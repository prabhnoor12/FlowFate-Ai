import { Router } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { encryptToken } from '../utils/tokenCrypto.js';

const router = Router();

// --- List connected Notion workspaces for a user ---
router.get('/workspaces', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    // Fetch all Notion accounts for this user from GoFile API
    const gofileApiUrl = 'https://api.gofile.io/v1/listUserWorkspaces'; // Replace with actual endpoint
    const gofileRes = await axios.get(gofileApiUrl, {
      params: { userId, accountId: process.env.GO_ACCOUNT_ID },
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
    });
    res.json({ workspaces: gofileRes.data.workspaces || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Set/select active Notion workspace for a user/session ---
router.post('/workspace/select', async (req, res) => {
  const { userId, workspaceId } = req.body;
  if (!userId || !workspaceId) return res.status(400).json({ error: 'Missing userId or workspaceId' });
  try {
    // Store active workspace in GoFile API or your DB (or session)
    const gofileApiUrl = 'https://api.gofile.io/v1/setActiveWorkspace'; // Replace with actual endpoint
    await axios.post(gofileApiUrl, { userId, workspaceId }, {
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` },
      params: { accountId: process.env.GO_ACCOUNT_ID }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- List Notion databases for a user/workspace (for property mapping UI) ---
router.get('/databases', async (req, res) => {
  const { userId, workspaceId } = req.query;
  if (!userId || !workspaceId) return res.status(400).json({ error: 'Missing userId or workspaceId' });
  try {
    // Fetch access token for this workspace from GoFile API
    const gofileApiUrl = 'https://api.gofile.io/v1/getUserWorkspaceToken';
    const gofileRes = await axios.get(gofileApiUrl, {
      params: { userId, workspaceId, accountId: process.env.GO_ACCOUNT_ID },
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
    });
    const notionToken = gofileRes.data.notionToken;
    // List databases using Notion API
    const notionRes = await axios.post('https://api.notion.com/v1/search', {
      filter: { property: 'object', value: 'database' }
    }, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    res.json({ databases: notionRes.data.results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- List properties for a Notion database (for mapping UI) ---
router.get('/database/:id/properties', async (req, res) => {
  const { userId, workspaceId } = req.query;
  const databaseId = req.params.id;
  if (!userId || !workspaceId || !databaseId) return res.status(400).json({ error: 'Missing userId, workspaceId, or databaseId' });
  try {
    // Fetch access token for this workspace from GoFile API
    const gofileApiUrl = 'https://api.gofile.io/v1/getUserWorkspaceToken';
    const gofileRes = await axios.get(gofileApiUrl, {
      params: { userId, workspaceId, accountId: process.env.GO_ACCOUNT_ID },
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
    });
    const notionToken = gofileRes.data.notionToken;
    // Get database details from Notion API
    const notionRes = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    res.json({ properties: notionRes.data.properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Step 1: Redirect user to Notion OAuth consent screen
router.get('/connect', (req, res) => {
  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(process.env.NOTION_REDIRECT_URI)}`;
  res.redirect(notionAuthUrl);
});

// Step 2: Handle Notion OAuth callback and exchange code for access token
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');
  try {
    // Exchange code for Notion access token
    const tokenRes = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
      client_id: process.env.NOTION_CLIENT_ID,
      client_secret: process.env.NOTION_CLIENT_SECRET,
    }, { headers: { 'Content-Type': 'application/json' } });

    // Prepare user details to store securely
    const userId = req.user?.id || uuidv4();

    // Encrypt the Notion access token before storing
    const encryptedToken = encryptToken(tokenRes.data.access_token);
    const notionUserDetails = {
      userId,
      notionToken: encryptedToken,
      notionWorkspaceId: tokenRes.data.workspace_id,
      notionBotId: tokenRes.data.bot_id,
      notionOwner: tokenRes.data.owner,
      notionDuplicatedTemplateId: tokenRes.data.duplicated_template_id,
      notionWorkspaceName: tokenRes.data.workspace_name,
      notionRefreshToken: tokenRes.data.refresh_token // store refresh token if provided
    };
// Step 3: Revoke Notion token on user disconnect
router.post('/disconnect', async (req, res) => {
  const { notionToken } = req.body;
  if (!notionToken) return res.status(400).send('Missing Notion token');
  try {
    // Optionally decrypt if stored encrypted
    // const decryptedToken = decryptToken(notionToken);
    // Notion does not have a public revoke endpoint as of 2025, but if it does:
    // await axios.post('https://api.notion.com/v1/oauth/revoke', { token: decryptedToken });
    res.send('Notion token revoked (simulated).');
  } catch (err) {
    res.status(500).send('Failed to revoke Notion token: ' + err.message);
  }
});

    // Store user details in GoFile API
    const gofileApiUrl = 'https://api.gofile.io/v1/storeUser'; // Replace with actual GoFile API endpoint if different
    const gofileRes = await axios.post(
      gofileApiUrl,
      notionUserDetails,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          accountId: process.env.GO_ACCOUNT_ID
        }
      }
    );

    if (gofileRes.status === 200) {
      // If opened as a popup, notify the opener window
      res.send(`
        <html><body>
        <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'notion_oauth_complete' }, '*');
        }
        </script>
        <div style="font-family:sans-serif;font-size:1.2em;margin-top:2em;text-align:center;">
          <b>Notion connected and user details stored securely!</b><br><br>
          You can close this window.
        </div>
        </body></html>
      `);
    } else {
      res.status(500).send('Notion connected, but failed to store user details securely.');
    }
  } catch (err) {
    res.status(500).send('Failed to connect Notion or store user details: ' + err.message);
  }
});

export default router;
