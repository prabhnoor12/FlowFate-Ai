import express from 'express';
import { connectSlack, sendSlackMessage } from '../controllers/slackController.js';

const router = express.Router();

// Route to prompt user to connect Slack
router.get('/connect', async (req, res) => {
  try {
    // Simulate a context if needed
    const ctx = { user: req.user };
    const result = await connectSlack.execute({}, ctx);
    res.send(result);
  } catch (err) {
    res.status(500).send('Failed to generate Slack connect prompt.');
  }
});

// Route to send a Slack message
router.post('/send', async (req, res) => {
  try {
    const { channel, message } = req.body;
    if (!channel || !message) {
      return res.status(400).json({ error: 'Channel and message are required.' });
    }
    const ctx = { user: req.user };
    const result = await sendSlackMessage.execute({ channel, message }, ctx);
    res.send(result);
  } catch (err) {
    res.status(500).send('Failed to send Slack message.');
  }
});

export default router;
