// Routes for OpenAI integration (ESM)
import { Router } from 'express';
import { askOpenAI } from '../controllers/openAIController.js';
import { cleanIntegrationReplyMiddleware } from '../middleware/cleanIntegrationReply.js';

const router = Router();

// POST /api/openai (for chat interface)
router.post('/', cleanIntegrationReplyMiddleware, askOpenAI);

// Health check for AI route
router.get('/health', (req, res) => res.json({ status: 'ok', ai: true }));

export default router;
