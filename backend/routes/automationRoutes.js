// Automation routes (ESM)
import { Router } from 'express';
import {
  createAutomation,
  getAutomations,
  updateAutomation,
  deleteAutomation
} from '../controllers/automationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Create a new automation
router.post('/', auth, createAutomation);
// List all automations for the user
router.get('/', auth, getAutomations);
// Update an automation
router.put('/:id', auth, updateAutomation);
// Delete an automation
router.delete('/:id', auth, deleteAutomation);

export default router;
