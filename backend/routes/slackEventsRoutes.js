import express from 'express';
import bodyParser from 'body-parser';

const router = express.Router();

// Slack Events API endpoint
router.post('/events', bodyParser.json(), async (req, res) => {
  // Slack URL verification challenge
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }

  // Handle event callbacks
  if (req.body.type === 'event_callback') {
    const event = req.body.event;
    // Example: log message events
    if (event.type === 'message' && !event.bot_id) {
      console.log(`[Slack Event] Message from ${event.user} in ${event.channel}: ${event.text}`);
      // TODO: Trigger automations, store in DB, etc.
    }
    // Example: handle reactions
    if (event.type === 'reaction_added') {
      console.log(`[Slack Event] Reaction ${event.reaction} added by ${event.user} to item`, event.item);
      // TODO: Trigger automations, etc.
    }
    // Respond quickly to Slack
    return res.status(200).send();
  }

  // Default: acknowledge
  res.status(200).send();
});

export default router;
