// backend/controllers/nlTaskController.js
import { run } from '@openai/agents';
import sendResponse from '../utils/responseUtil.js';
import * as taskService from '../services/taskService.js';
import * as reminderService from '../services/reminderService.js';
import * as automationService from '../services/automationService.js';
import logger from '../utils/logger.js';

// Helper: OpenAI prompt for parsing
function buildPrompt(input) {
  return `Extract the intent (task, reminder, or automation) and details from this user input.\nInput: "${input}"\nReturn JSON with type (task|reminder|automation), title, description, and if reminder, dueDate.`;
}

export async function parseAndCreateFromNL(req, res, next) {
  try {
    const userId = req.user?.id;
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      return sendResponse(res, { status: 'error', error: { message: 'Input is required.' } }, 400);
    }
    // Call OpenAI to parse
    const prompt = buildPrompt(input);
    const result = await run(prompt); // You may need to use your OpenAI wrapper here
    let parsed;
    try {
      parsed = typeof result === 'string' ? JSON.parse(result) : result;
    } catch (e) {
      logger.error('[NLTask] OpenAI parse error', e);
      return sendResponse(res, { status: 'error', error: { message: 'Could not parse AI response.' } }, 500);
    }
    if (!parsed.type) {
      return sendResponse(res, { status: 'error', error: { message: 'AI did not return a type.' } }, 400);
    }
    let created;
    if (parsed.type === 'task') {
      created = await taskService.createTask({ userId, title: parsed.title, description: parsed.description });
    } else if (parsed.type === 'reminder') {
      created = await reminderService.createReminder({ userId, message: parsed.title || parsed.description, dueAt: parsed.dueDate });
    } else if (parsed.type === 'automation') {
      created = await automationService.createAutomation({ userId, trigger: parsed.trigger, action: parsed.action });
    } else {
      return sendResponse(res, { status: 'error', error: { message: 'Unknown type from AI.' } }, 400);
    }
    sendResponse(res, { status: 'success', data: created }, 201);
  } catch (err) {
    logger.error('[NLTask] Error', err);
    next(err);
  }
}
