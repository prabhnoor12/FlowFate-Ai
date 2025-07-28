// Utility for sending emails (ESM)
import nodemailer from 'nodemailer';
import validator from 'validator';
import logger from '../utils/logger.js';
import handlebars from 'handlebars';
import sgMail from '@sendgrid/mail';

/**
 * Send an email using a generic SMTP transporter (for system notifications, not user Gmail)
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body (plain text)
 */
export async function sendEmail({ to, subject, body }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    // Monitoring: log SMTP response, accepted/rejected, and latency
    const latency = info?.envelopeTime || (info?.responseTimeMs ?? null);
    logger.info({ event: 'EmailSent', to, subject, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, latency });
    // Workflow automation: auto-escalate on repeated failure
    if (info.rejected?.length) {
      logger.warn({ event: 'EmailRejected', to, subject, rejected: info.rejected });
      // Optionally trigger alert/escalation here (e.g., send to admin, queue for retry)
    }
    return { message: 'Email sent', info };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send an email with HTML body and optional attachments
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Email body (plain text)
 * @param {string} [params.html] - Email body (HTML)
 * @param {Array} [params.attachments] - Array of attachment objects
 */
export async function sendEmailAdvanced({ to, subject, text, html, attachments }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      attachments,
    });
    logger.info({ event: 'EmailSent', to, subject, messageId: info.messageId });
    return { message: 'Email sent', info };
  } catch (error) {
    logger.error({ event: 'EmailSendError', to, subject, error: error.message });
    // Monitoring: increment error metric, trigger alert if needed
    // Optionally: add to retry queue or escalate
    throw new Error('Failed to send email');
  }
}

/**
 * Validate an email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return validator.isEmail(email);
}

/**
 * Send a templated email using Handlebars
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.template - Handlebars template string
 * @param {Object} params.variables - Variables for template
 * @param {Array} [params.attachments] - Array of attachment objects
 */
export async function sendTemplatedEmail({ to, subject, template, variables, attachments }) {
  const html = handlebars.compile(template)(variables);
  return sendEmailAdvanced({ to, subject, html, attachments });
}

/**
 * Bulk send emails (returns array of results)
 * @param {Array} emails - Array of email objects (to, subject, body/text/html/attachments)
 */
export async function sendBulkEmails(emails) {
  const results = [];
  for (const email of emails) {
    try {
      // Use sendEmailAdvanced for each
      const result = await sendEmailAdvanced(email);
      results.push({ to: email.to, status: 'sent', info: result.info });
    } catch (error) {
      logger.error({ event: 'BulkEmailError', to: email.to, error: error.message });
      results.push({ to: email.to, status: 'error', error: error.message });
    }
  }
  // Monitoring: summary of bulk send
  logger.info({ event: 'BulkEmailSummary', sent: results.filter(r => r.status === 'sent').length, failed: results.filter(r => r.status === 'error').length });
  return results;
}

// Configure SendGrid if API key is present
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Schedule an email to be sent at a future date (uses setTimeout, for demo; use a job queue for production)
 * @param {Object} emailParams - Same as sendEmailAdvanced
 * @param {Date} sendAt - When to send the email
 */
export function scheduleEmail(emailParams, sendAt) {
  const delay = sendAt - new Date();
  if (delay <= 0) return sendEmailAdvanced(emailParams);
  setTimeout(() => {
    sendEmailAdvanced(emailParams).catch(err => {
      logger.error({ event: 'ScheduledEmailError', to: emailParams.to, error: err.message });
    });
  }, delay);
  logger.info({ event: 'EmailScheduled', to: emailParams.to, subject: emailParams.subject, sendAt });
  // Monitoring: schedule event
  return { message: 'Email scheduled', sendAt };
}

/**
 * Retry sending an email up to maxRetries times
 * @param {Object} emailParams - Same as sendEmailAdvanced
 * @param {number} maxRetries
 */
export async function sendEmailWithRetry(emailParams, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEmailAdvanced(emailParams);
    } catch (error) {
      lastError = error;
      logger.warn({ event: 'EmailRetry', to: emailParams.to, attempt, error: error.message });
    }
  }
  logger.error({ event: 'EmailRetryFailed', to: emailParams.to, error: lastError?.message });
  // Workflow automation: escalate to admin or alert system
  throw lastError;
}

/**
 * Send email via SendGrid (if configured)
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} [params.text]
 * @param {string} [params.html]
 * @param {Array} [params.attachments]
 */
export async function sendEmailSendGrid({ to, subject, text, html, attachments }) {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SendGrid API key not configured');
  const msg = {
    to,
    from: process.env.SENDGRID_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    subject,
    text,
    html,
    attachments,
  };
  try {
    const info = await sgMail.send(msg);
    logger.info({ event: 'SendGridEmailSent', to, subject, messageId: info[0]?.headers['x-message-id'] });
    // Monitoring: log SendGrid response, accepted/rejected
    return { message: 'Email sent via SendGrid', info };
  } catch (error) {
    logger.error({ event: 'SendGridEmailError', to, subject, error: error.message });
    // Monitoring: increment SendGrid error metric, trigger alert if needed
    throw new Error('Failed to send email via SendGrid');
  }
}

/**
 * Track delivery status for SendGrid (polls messageId, demo only)
 * @param {string} messageId
 * @returns {Promise<Object>} Delivery status
 */
export async function trackSendGridDelivery(messageId) {
  // Real implementation would use SendGrid Event Webhooks
  // This is a stub for demo purposes
  logger.info({ event: 'TrackSendGridDelivery', messageId });
  // Monitoring: delivery status event
  // Simulate polling or webhook event
  return { messageId, status: 'unknown', info: 'Use SendGrid Event Webhooks for real tracking.' };
}

/**
 * Track SMTP delivery status (stub, most SMTPs do not support tracking)
 * @param {Object} info - nodemailer sendMail info
 * @returns {Object} Delivery status
 */
export function trackSmtpDelivery(info) {
  // Most SMTPs do not support delivery tracking; rely on accepted/rejected
  logger.info({ event: 'TrackSmtpDelivery', messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
  // Monitoring: SMTP delivery event
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    status: info.rejected?.length ? 'failed' : 'sent'
  };
}

/**
 * Webhook handler stub for SendGrid Event Webhooks (to be used in Express route)
 * @param {Object} req
 * @param {Object} res
 */
export function sendGridWebhookHandler(req, res) {
  // Parse and log SendGrid event
  logger.info({ event: 'SendGridWebhook', body: req.body });
  // Monitoring: webhook event
  res.status(200).json({ status: 'received' });
}
