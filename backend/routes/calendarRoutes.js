import { Router } from 'express';
import { getCalendarApiClient } from '../integrations/calendarIntegration.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// List user's calendar events
router.get('/events', auth, async (req, res) => {
  try {
    const calendar = await getCalendarApiClient(req.user.id);
    const events = await calendar.events.list({ calendarId: 'primary', maxResults: 10 });
    res.json({ events: events.data.items || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
