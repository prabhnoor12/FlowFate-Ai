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
// Update an automation (full)
router.put('/:id', auth, updateAutomation);
// Update only the status of an automation (partial)
import { updateAutomationStatus } from '../controllers/automationController.js';
router.patch('/:id/status', auth, updateAutomationStatus);
// Delete an automation
router.delete('/:id', auth, deleteAutomation);

export default router;
