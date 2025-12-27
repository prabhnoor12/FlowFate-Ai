// openai_controller.js
// Handles running automations and workflows using OpenAI
/**
 * Preview (dry-run) an automation or workflow prompt with input/context substitution, without calling OpenAI
 * POST /api/openai/preview
 * Body: { prompt: string, input?: string, context?: string }
 */
const openaiService = require('../services/openai_service');

exports.previewPrompt = (req, res, next) => {
  try {
    const { prompt, input = '', context = '' } = req.body || {};
    const result = openaiService.previewPromptService({ prompt, input, context });
    res.json(result);
  } catch (err) {
    logger.error('Failed to preview prompt', { error: err });
    next(new AppError('Failed to preview prompt', 500, err.message));
  }
};

/**
 * Get OpenAI usage stats for the current API key
 * GET /api/openai/usage
 */
exports.getUsageStats = async (req, res, next) => {
  try {
    // This endpoint is a placeholder. In production, use OpenAI's usage API if available.
    // For now, just return a dummy object or fetch from your own logs/DB if tracked.
    res.json({
      usage: 'Not implemented. Track usage in your DB or use OpenAI billing API.'
    });
  } catch (err) {
    logger.error('Failed to get OpenAI usage stats', { error: err });
    next(new AppError('Failed to get usage stats', 500, err.message));
  }
};
const { PrismaClient } = require('@prisma/client');

const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');
const Joi = require('joi');
const OpenAI = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} else if (process.env.NODE_ENV !== 'test') {
    console.warn('OPENAI_API_KEY is not set. OpenAI services will not be available in openai_controller.');
}

/**
 * Run a single-step automation using OpenAI
 * Expects automationId in params
 */
const automationRunSchema = Joi.object({
  input: Joi.string().allow('', null), // Optional user input to inject into prompt
  stream: Joi.boolean().default(false),
});

exports.runAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { automationId } = req.params;
    const { error, value } = automationRunSchema.validate(req.body || {});
    if (error) {
      logger.warn('Validation failed for runAutomation', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const result = await openaiService.runAutomationService(userId, automationId, value, value.stream ? res : null);
    if (!value.stream) res.json(result);
  } catch (err) {
    logger.error('Failed to run automation with OpenAI', { error: err });
    next(new AppError('Failed to run automation', 500, err.message));
  }
};

/**
 * Run a multi-step workflow using OpenAI
 * Expects workflowId in params
 */
const workflowRunSchema = Joi.object({
  input: Joi.string().allow('', null), // Optional user input for first step
});

exports.runWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;
    const { error, value } = workflowRunSchema.validate(req.body || {});
    if (error) {
      logger.warn('Validation failed for runWorkflow', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const result = await openaiService.runWorkflowService(userId, workflowId, value);
    res.json(result);
  } catch (err) {
    logger.error('Failed to run workflow with OpenAI', { error: err });
    next(new AppError('Failed to run workflow', 500, err.message));
  }
};
