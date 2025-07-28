import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createReminder,
  listReminders,
  updateReminder,
  deleteReminder
} from '../services/reminderService.js';

const router = Router();

// List reminders
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await listReminders({ userId: req.user.id, status: req.query.status });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reminder
router.post('/', auth, async (req, res) => {
  try {
    const { message, dueAt } = req.body;
    const reminder = await createReminder({ userId: req.user.id, message, dueAt });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update reminder
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await updateReminder(req.params.id, req.body);
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    await deleteReminder(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
