// backend/controllers/nlTaskController.js

import { run } from '@openai/agents';
import sendResponse from '../utils/responseUtil.js';
import * as taskService from '../services/taskService.js';
import * as reminderService from '../services/reminderService.js';
import * as automationService from '../services/automationService.js';
import logger from '../utils/logger.js';
import DOMPurify from 'isomorphic-dompurify';

// Helper: OpenAI prompt for parsing
function buildPrompt(input) {
  return `Extract the intent (task, reminder, or automation) and details from this user input.\nInput: "${input}"\nReturn JSON with type (task|reminder|automation), title, description, and if reminder, dueDate, and for automation, trigger and action.`;
}

export async function parseAndCreateFromNL(req, res, next) {

  try {
    const userId = req.user?.id;
    let { input } = req.body;
    if (!input || typeof input !== 'string') {
      return sendResponse(res, { status: 'error', error: { message: 'Input is required.' } }, 400);
    }
    input = DOMPurify.sanitize(input.trim());
    if (input.length < 3 || input.length > 500) {
      return sendResponse(res, { status: 'error', error: { message: 'Input must be 3-500 characters.' } }, 400);
    }
    logger.info(`[NLTask] User ${userId} input: ${input}`);

    // Call OpenAI to parse, with timeout
    const prompt = buildPrompt(input);
    let result;
    try {
      const openAITimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI timeout')), 15000));
      result = await Promise.race([run(prompt), openAITimeout]);
    } catch (aiErr) {
      logger.error('[NLTask] OpenAI error', aiErr);
      return sendResponse(res, { status: 'error', error: { message: 'AI service unavailable. Try again later.' } }, 503);
    }

    // Try to parse AI response flexibly
    let parsed;
    try {
      if (typeof result === 'string') {
        // Remove code block markers if present
        let clean = result.replace(/^```json|```$/gi, '').trim();
        parsed = JSON.parse(clean);
      } else {
        parsed = result;
      }
    } catch (e) {
      logger.error('[NLTask] OpenAI parse error', { result, error: e });
      return sendResponse(res, { status: 'error', error: { message: 'Could not parse AI response.', details: result } }, 500);
    }
    logger.info(`[NLTask] AI output: ${JSON.stringify(parsed)}`);

    if (!parsed.type) {
      return sendResponse(res, { status: 'error', error: { message: 'AI did not return a type.', details: parsed } }, 400);
    }
    let created;
    if (parsed.type === 'task') {
      if (!parsed.title) return sendResponse(res, { status: 'error', error: { message: 'Task title missing from AI.' } }, 400);
      created = await taskService.createTask({ userId, title: DOMPurify.sanitize(parsed.title), description: DOMPurify.sanitize(parsed.description || '') });
    } else if (parsed.type === 'reminder') {
      if (!parsed.title && !parsed.description) return sendResponse(res, { status: 'error', error: { message: 'Reminder details missing from AI.' } }, 400);
      created = await reminderService.createReminder({ userId, message: DOMPurify.sanitize(parsed.title || parsed.description), dueAt: parsed.dueDate });
    } else if (parsed.type === 'automation') {
      if (!parsed.trigger || !parsed.action) return sendResponse(res, { status: 'error', error: { message: 'Automation trigger/action missing from AI.' } }, 400);
      created = await automationService.createAutomation({ userId, trigger: DOMPurify.sanitize(parsed.trigger), action: DOMPurify.sanitize(parsed.action) });
    } else {
      return sendResponse(res, { status: 'error', error: { message: 'Unknown type from AI.', details: parsed } }, 400);
    }
    sendResponse(res, { status: 'success', data: created }, 201);
  } catch (err) {
    logger.error('[NLTask] Error', err);
    sendResponse(res, { status: 'error', error: { message: 'Failed to process input', details: err.message } }, 500);
    if (next) next(err);
  }
}
