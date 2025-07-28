// Routes for OpenAI integration (ESM)
import { Router } from 'express';
import { askOpenAI } from '../controllers/openAIController.js';

const router = Router();

// POST /api/openai (for chat interface)
router.post('/', askOpenAI);

// Health check for AI route
router.get('/health', (req, res) => res.json({ status: 'ok', ai: true }));

export default router;
