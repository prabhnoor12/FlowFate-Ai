import express from 'express';
import axios from 'axios';
import { storeIntegrationToken } from '../services/integrationService.js';

const router = express.Router();

// Step 1: Redirect user to Todoist OAuth consent
router.get('/todoist/connect', (req, res) => {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.TODOIST_REDIRECT_URI);
  const authUrl = `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read_write&state=${req.user?.id || ''}&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
});

// Step 2: Handle Todoist OAuth callback
router.get('/todoist/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    // Exchange code for access token
    const response = await axios.post('https://todoist.com/oauth/access_token', {
      client_id: process.env.TODOIST_CLIENT_ID,
      client_secret: process.env.TODOIST_CLIENT_SECRET,
      code,
      redirect_uri: process.env.TODOIST_REDIRECT_URI
    });
    const data = response.data;
    if (!data.access_token) throw new Error('Todoist OAuth failed');
    const userId = req.user?.id || state;
    if (!userId) return res.status(400).send('Missing user identification');
    await storeIntegrationToken(userId, 'todoist', {
      accessToken: data.access_token,
      refreshToken: null
    });
    res.send('Todoist integration successful! Token stored.');
  } catch (err) {
    console.error('Todoist OAuth error:', err);
    res.status(500).send('Failed to store Todoist token');
  }
});

export default router;
