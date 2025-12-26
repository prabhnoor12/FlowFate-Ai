const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai_controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Run a single-step automation
router.post('/automation/:automationId/run', openaiController.runAutomation);
// Run a multi-step workflow
router.post('/workflow/:workflowId/run', openaiController.runWorkflow);
// Preview a prompt (dry-run)
router.post('/preview', openaiController.previewPrompt);
// Get OpenAI usage stats
router.get('/usage', openaiController.getUsageStats);

module.exports = router;
