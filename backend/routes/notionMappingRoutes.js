// Notion property mapping and automation routes
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Save property mapping for a user/workspace/database
router.post('/property-mapping', async (req, res) => {
  const { userId, workspaceId, databaseId, mapping } = req.body;
  if (!userId || !workspaceId || !databaseId || !mapping) {
    return res.status(400).json({ error: 'userId, workspaceId, databaseId, and mapping are required' });
  }
  try {
    // Store mapping in GoFile API or your DB
    const gofileApiUrl = 'https://api.gofile.io/v1/savePropertyMapping';
    await axios.post(gofileApiUrl, { userId, workspaceId, databaseId, mapping }, {
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` },
      params: { accountId: process.env.GO_ACCOUNT_ID }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get property mapping for a user/workspace/database
router.get('/property-mapping', async (req, res) => {
  const { userId, workspaceId, databaseId } = req.query;
  if (!userId || !workspaceId || !databaseId) {
    return res.status(400).json({ error: 'userId, workspaceId, and databaseId are required' });
  }
  try {
    const gofileApiUrl = 'https://api.gofile.io/v1/getPropertyMapping';
    const gofileRes = await axios.get(gofileApiUrl, {
      params: { userId, workspaceId, databaseId, accountId: process.env.GO_ACCOUNT_ID },
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
    });
    res.json({ mapping: gofileRes.data.mapping || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save automation (trigger/action) for a user
router.post('/automation', async (req, res) => {
  const { userId, workspaceId, trigger, action } = req.body;
  if (!userId || !workspaceId || !trigger || !action) {
    return res.status(400).json({ error: 'userId, workspaceId, trigger, and action are required' });
  }
  try {
    const gofileApiUrl = 'https://api.gofile.io/v1/saveAutomation';
    await axios.post(gofileApiUrl, { userId, workspaceId, trigger, action }, {
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` },
      params: { accountId: process.env.GO_ACCOUNT_ID }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get automations for a user/workspace
router.get('/automation', async (req, res) => {
  const { userId, workspaceId } = req.query;
  if (!userId || !workspaceId) {
    return res.status(400).json({ error: 'userId and workspaceId are required' });
  }
  try {
    const gofileApiUrl = 'https://api.gofile.io/v1/getAutomations';
    const gofileRes = await axios.get(gofileApiUrl, {
      params: { userId, workspaceId, accountId: process.env.GO_ACCOUNT_ID },
      headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
    });
    res.json({ automations: gofileRes.data.automations || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
