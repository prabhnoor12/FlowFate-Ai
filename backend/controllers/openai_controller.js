// openai_controller.js
// Handles running automations and workflows using OpenAI
/**
 * Preview (dry-run) an automation or workflow prompt with input/context substitution, without calling OpenAI
 * POST /api/openai/preview
 * Body: { prompt: string, input?: string, context?: string }
 */
exports.previewPrompt = (req, res, next) => {
  try {
    const { prompt, input = '', context = '' } = req.body || {};
    if (!prompt) {
      return next(new AppError('Prompt is required for preview', 400));
    }
    let result = prompt;
    if (input) result = result.replace(/\{\{input\}\}/g, input);
    if (context) result = result.replace(/\{\{context\}\}/g, context);
    res.json({ preview: result });
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
const prisma = new PrismaClient();
const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');
const Joi = require('joi');
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

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
    const automation = await prisma.automation.findFirst({ where: { id: Number(automationId), userId } });
    if (!automation) {
      return next(new AppError('Automation not found', 404));
    }
    const { prompt, ...options } = automation.workflow;
    if (!prompt) {
      return next(new AppError('No prompt found in automation workflow', 400));
    }
    let finalPrompt = prompt;
    if (value.input) {
      finalPrompt = prompt.replace(/\{\{input\}\}/g, value.input);
    }
    // Streaming support (if requested)
    if (value.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();
      const completion = await openai.createChatCompletion({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: finalPrompt }],
        stream: true,
        ...options,
      }, { responseType: 'stream' });
      completion.data.on('data', chunk => {
        res.write(chunk);
      });
      completion.data.on('end', () => res.end());
      completion.data.on('error', err => {
        logger.error('OpenAI stream error', { error: err });
        res.end();
      });
      return;
    }
    // Standard (non-streaming)
    const response = await openai.createChatCompletion({
      model: options.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: finalPrompt }],
      ...options,
    });
    res.json({ result: response.data.choices[0].message.content });
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
    const workflow = await prisma.workflow.findFirst({ where: { id: Number(workflowId), userId } });
    if (!workflow) {
      return next(new AppError('Workflow not found', 404));
    }
    let context = value.input || '';
    const results = [];

    // Advanced feature: parallel execution for steps marked as parallel
    // If a step has { parallel: true }, treat all consecutive parallel steps as a batch and run them in parallel
    let i = 0;
    while (i < workflow.steps.length) {
      const step = workflow.steps[i];
      if (step.parallel) {
        // Gather all consecutive parallel steps
        const parallelSteps = [];
        let j = i;
        while (j < workflow.steps.length && workflow.steps[j].parallel) {
          parallelSteps.push({ ...workflow.steps[j], index: j });
          j++;
        }
        // Run all in parallel
        const parallelResults = await Promise.all(parallelSteps.map(async (pstep) => {
          let stepPrompt = pstep.prompt;
          if (context) {
            stepPrompt = stepPrompt.replace(/\{\{context\}\}/g, context);
          }
          let retries = 0;
          let result = null;
          let errorMsg = null;
          while (retries < 2) {
            try {
              const response = await openai.createChatCompletion({
                model: pstep.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: stepPrompt }],
                ...pstep,
              });
              result = response.data.choices[0].message.content;
              break;
            } catch (stepErr) {
              logger.error('OpenAI error in parallel workflow step', { error: stepErr, step: pstep.index, retry: retries });
              errorMsg = stepErr.message;
              retries++;
            }
          }
          return result ? { result } : { error: errorMsg };
        }));
        results.push(...parallelResults);
        // Optionally, update context with the first successful result
        const firstResult = parallelResults.find(r => r.result);
        if (firstResult) context = firstResult.result;
        i = j;
      } else {
        // Serial step
        if (!step.prompt) {
          results.push({ error: 'No prompt in step' });
          i++;
          continue;
        }
        let stepPrompt = step.prompt;
        if (context) {
          stepPrompt = stepPrompt.replace(/\{\{context\}\}/g, context);
        }
        let retries = 0;
        let result = null;
        let errorMsg = null;
        while (retries < 2) {
          try {
            const response = await openai.createChatCompletion({
              model: step.model || 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: stepPrompt }],
              ...step,
            });
            result = response.data.choices[0].message.content;
            break;
          } catch (stepErr) {
            logger.error('OpenAI error in workflow step', { error: stepErr, step: i, retry: retries });
            errorMsg = stepErr.message;
            retries++;
          }
        }
        if (result) {
          results.push({ result });
          context = result;
        } else {
          results.push({ error: errorMsg });
        }
        i++;
      }
    }
    res.json({ results });
  } catch (err) {
    logger.error('Failed to run workflow with OpenAI', { error: err });
    next(new AppError('Failed to run workflow', 500, err.message));
  }
};
