// Gmail Integration for Automation and Workflows
// This module provides functions to authenticate with Gmail, read/send emails, and trigger automations.
// Dependencies: googleapis (install with `npm install googleapis`)

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Load OAuth2 credentials from a file or environment variables
const CREDENTIALS_PATH = process.env.GMAIL_CREDENTIALS_PATH || path.join(__dirname, 'gmail_credentials.json');
const TOKEN_PATH = process.env.GMAIL_TOKEN_PATH || path.join(__dirname, 'gmail_token.json');

function loadCredentials() {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  }
  throw new Error('Gmail credentials file not found.');
}

function loadToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH));
  }
  throw new Error('Gmail token file not found.');
}

function getOAuth2Client() {
  const credentials = loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const token = loadToken();
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// Send an email using Gmail API
async function sendEmail({ to, subject, message }) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    message,
  ];
  const email = emailLines.join('\n');
  const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}

// List unread emails (for automation triggers)
async function listUnreadEmails() {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 10,
  });
  return res.data.messages || [];
}

// Get the content of a specific email
async function getEmailContent(messageId) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return res.data;
}

// Mark an email as read
async function markAsRead(messageId) {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

module.exports = {
  sendEmail,
  listUnreadEmails,
  getEmailContent,
  markAsRead,
};
