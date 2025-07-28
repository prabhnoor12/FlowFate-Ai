// Task routes (ESM)
import { Router } from 'express';
import { createTask, getTask } from '../controllers/taskController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Create a new AI task
router.post('/', auth, createTask);

// Get a specific task by id
router.get('/:id', auth, getTask);

export default router;
