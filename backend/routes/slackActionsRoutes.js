import express from 'express';
import { sendSlackMessage, sendSlackBlockMessage, listSlackChannels, getSlackUserInfo } from '../integrations/slackIntegration.js';
import { getIntegrationTokenForTeam } from '../services/integrationService.js';

const router = express.Router();

// Middleware: require authentication (assumes req.user is set)
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/slack/send-message (multi-workspace)
router.post('/send-message', requireAuth, async (req, res) => {
  try {
    const { channel, text, teamId } = req.body;
    if (!channel || !text || !teamId) return res.status(400).json({ error: 'Missing channel, text, or teamId' });
    const { accessToken } = await getIntegrationTokenForTeam(req.user.id, 'slack', teamId);
    if (!accessToken) return res.status(400).json({ error: 'Slack not connected for this workspace' });
    const result = await sendSlackMessage({ accessToken, channel, text });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/slack/send-block-message (multi-workspace)
router.post('/send-block-message', requireAuth, async (req, res) => {
  try {
    const { channel, text, blocks, teamId } = req.body;
    if (!channel || !blocks || !teamId) return res.status(400).json({ error: 'Missing channel, blocks, or teamId' });
    const { accessToken } = await getIntegrationTokenForTeam(req.user.id, 'slack', teamId);
    if (!accessToken) return res.status(400).json({ error: 'Slack not connected for this workspace' });
    const result = await sendSlackBlockMessage({ accessToken, channel, text, blocks });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/slack/channels (multi-workspace)
router.get('/channels', requireAuth, async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'Missing teamId' });
    const { accessToken } = await getIntegrationTokenForTeam(req.user.id, 'slack', teamId);
    if (!accessToken) return res.status(400).json({ error: 'Slack not connected for this workspace' });
    const channels = await listSlackChannels(accessToken);
    res.json({ ok: true, channels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/slack/user-info (multi-workspace)
router.get('/user-info', requireAuth, async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'Missing teamId' });
    const { accessToken } = await getIntegrationTokenForTeam(req.user.id, 'slack', teamId);
    if (!accessToken) return res.status(400).json({ error: 'Slack not connected for this workspace' });
    const user = await getSlackUserInfo(accessToken);
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
