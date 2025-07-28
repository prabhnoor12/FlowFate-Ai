import express from 'express';
import prisma from '../prisma/client.js';
import { getIntegrationToken } from '../services/integrationService.js';
import { sendSlackMessage } from '../integrations/slackIntegration.js';

const router = express.Router();

// Middleware: require authentication (assumes req.user is set)
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/slack/schedule-message
router.post('/schedule-message', requireAuth, async (req, res) => {
  try {
    const { channel, text, sendAt, workspace } = req.body;
    if (!channel || !text || !sendAt || !workspace) {
      return res.status(400).json({ error: 'Missing channel, text, sendAt, or workspace' });
    }
    const scheduled = await prisma.scheduledSlackMessage.create({
      data: {
        userId: req.user.id,
        workspace,
        channel,
        text,
        sendAt: new Date(sendAt),
      },
    });
    res.json({ ok: true, scheduled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
