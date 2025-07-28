// Handles integration with Gmail (ESM)


import { google } from 'googleapis';
import { getIntegrationToken } from '../services/integrationService.js';
import nodemailer from 'nodemailer';

/**
 * Get an authenticated Gmail API client for a user
 * @param {number|string} userId - The user's ID
 * @returns {google.gmail_v1.Gmail}
 */
export async function getGmailApiClient(userId) {
  const tokenData = await getIntegrationToken(userId, 'gmail');
  if (!tokenData) throw new Error('No Gmail tokens found for user');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * List Gmail messages for a user
 * @param {number|string} userId - The user's ID
 * @param {object} [queryOptions] - Optional query params (e.g., maxResults, q)
 * @returns {Array} List of messages
 */
export async function listGmailMessages(userId, queryOptions = {}) {
  try {
    const gmail = await getGmailApiClient(userId);
    const response = await gmail.users.messages.list({
      userId: 'me',
      ...queryOptions
    });
    return response.data.messages || [];
  } catch (err) {
    throw new Error('Failed to list Gmail messages: ' + err.message);
  }
}

/**
 * Send an email using Gmail with user OAuth2 credentials
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body (plain text)
 * @param {string} params.user - The user's Gmail address
 * @param {string} params.clientId - OAuth2 client ID
 * @param {string} params.clientSecret - OAuth2 client secret
 * @param {string} params.refreshToken - OAuth2 refresh token
 * @param {string} params.accessToken - OAuth2 access token (optional, will refresh if expired)
 */
/**
 * Send an email using Gmail with user OAuth2 credentials
 * @param {number|string} userId - The user's ID
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @returns {object} Info about sent email
 */
export async function sendGmail(userId, to, subject, body) {
  try {
    const tokenData = await getIntegrationToken(userId, 'gmail');
    if (!tokenData) throw new Error('No Gmail tokens found for user');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: tokenData.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: tokenData.refreshToken,
        accessToken: tokenData.accessToken,
      },
    });
    const info = await transporter.sendMail({
      from: tokenData.email,
      to,
      subject,
      text: body,
    });
    return { message: 'Email sent via Gmail', info };
  } catch (error) {
    console.error('Gmail send error:', error);
    throw new Error('Failed to send email via Gmail: ' + error.message);
  }
}
