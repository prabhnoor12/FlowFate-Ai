// Slack OAuth connect: redirect to Slack consent screen
router.get('/slack/connect', (req, res) => {
  const scopes = [
    'chat:write',
    'channels:read',
    'users:read',
    'channels:join',
    'groups:read',
    'im:write',
    'mpim:write'
  ];
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes.join(','))}` +
    `&redirect_uri=${encodeURIComponent(process.env.SLACK_REDIRECT_URI)}` +
    `&user_scope=`;
  res.redirect(authUrl);
});

// Slack OAuth callback: exchange code for token and store in DB
router.get('/slack/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI
      }
    });
    const data = response.data;
    if (!data.ok) throw new Error(data.error || 'Slack OAuth failed');
    // Get userId from session, JWT, or state param
    const userId = req.user?.id || state;
    if (!userId) return res.status(400).send('Missing user identification');
    // Store teamId and teamName for multi-workspace support
    await storeIntegrationToken(userId, 'slack', {
      accessToken: data.access_token,
      refreshToken: null,
      teamId: data.team && data.team.id ? data.team.id : null,
      teamName: data.team && data.team.name ? data.team.name : null
    });
    res.send('Slack integration successful! Tokens stored.');
  } catch (err) {
    console.error('Slack OAuth error:', err);
    res.status(500).send('Failed to store Slack tokens');
  }
});
// Generic OAuth routes for all integrations
import { Router } from 'express';
import axios from 'axios';
import { google } from 'googleapis';
import { storeIntegrationToken } from '../services/integrationService.js';

const router = Router();

// Step 1: Redirect to provider's OAuth consent screen

// Gmail OAuth connect: redirect to Google consent screen with Gmail scopes
router.get('/gmail/connect', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
});

// Drive OAuth connect
router.get('/drive/connect', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
});

// Calendar OAuth connect
router.get('/calendar/connect', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback for any provider

// Gmail OAuth callback: store tokens in DB
async function handleGoogleCallback(req, res, integrationType) {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oAuth2Client.getToken(code);
    // Get userId from session, JWT, or state param
    const userId = req.user?.id || state;
    if (!userId) return res.status(400).send('Missing user identification');
    await storeIntegrationToken(userId, integrationType, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: tokens.id_token ? parseIdTokenEmail(tokens.id_token) : undefined
    });
    res.send(`${integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} integration successful! Tokens stored.`);
  } catch (err) {
    console.error(`${integrationType} OAuth error:`, err);
    res.status(500).send(`Failed to store ${integrationType} tokens`);
  }
}

function parseIdTokenEmail(idToken) {
  try {
    const base64Payload = idToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    return payload.email;
  } catch {
    return undefined;
  }
}

router.get('/gmail/callback', (req, res) => handleGoogleCallback(req, res, 'gmail'));
router.get('/drive/callback', (req, res) => handleGoogleCallback(req, res, 'drive'));
router.get('/calendar/callback', (req, res) => handleGoogleCallback(req, res, 'calendar'));

export default router;
