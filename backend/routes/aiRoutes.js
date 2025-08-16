import express from 'express';
import { completeAutomationAI } from '../controllers/openAIController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/complete-automation
router.post('/complete-automation', auth, completeAutomationAI);

export default router;
