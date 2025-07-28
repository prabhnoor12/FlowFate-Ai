// Handles task-related business logic (ESM + Prisma)

import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';
import { createTaskSchema } from '../validators/taskValidator.js';
import * as taskService from '../services/taskService.js';
import { createNotionPage } from '../integrations/notionIntegration.js';

// OpenAI integration helpers
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Call OpenAI's chat API with advanced options and error handling
 * @param {Object} params
 * @param {string} params.prompt - The prompt or message for the AI
 * @param {string} [params.model] - The OpenAI model to use
 * @param {number} [params.temperature]
 * @param {number} [params.max_tokens]
 * @param {Array} [params.messages] - Full chat history (optional)
 * @param {Object} [params.functions] - Function calling schema (optional)
 * @returns {Promise<string>} - The AI's response
 */
async function callOpenAI({ prompt, model = 'gpt-4o', temperature = 0.7, max_tokens = 256, messages, functions }) {
  const payload = {
    model,
    messages: messages || [{ role: 'user', content: prompt }],
    temperature,
    max_tokens,
  };
  if (functions) payload.functions = functions;
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorMsg = 'OpenAI API error';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Example: Summarize email with OpenAI (with language and tone options)
async function summarizeWithOpenAI(emailText, { language = 'English', tone = 'concise' } = {}) {
  const prompt = `Summarize the following email in a ${tone} tone and in ${language}:
${emailText}`;
  return callOpenAI({ prompt, temperature: 0.4, max_tokens: 256 });
}

// General OpenAI endpoint for tasks (supports chat history and function calling)
import { aiTaskQueue } from '../jobs/aitaskworker.js';

export async function askOpenAI(req, res) {
  try {
    const { prompt, model, temperature, max_tokens, messages } = req.body;
    if (!prompt && !messages) {
      return res.status(400).json({ error: 'Prompt or messages are required' });
    }

    // Detect Notion connection intent
    if (/connect.*notion|link.*notion|notion.*connect|notion.*link/i.test(prompt)) {
      // Enqueue a notion_oauth_prompt task for the user
      const userId = req.user?.id;
      const taskId = Date.now(); // Replace with your real task ID logic if needed
      await aiTaskQueue.add('ai-task', {
        id: taskId,
        type: 'notion_oauth_prompt',
        input: { userId }
      });
      return sendResponse(res, {
        status: 'action_required',
        action: 'notion_oauth',
        message: 'To connect Notion, please click here.',
        oauthUrl: '/integrations/notion/auth'
      });
    }

    // --- Notion function definition for OpenAI ---
    const functions = [
      {
        name: 'createNotionPage',
        description: 'Create a new page in the user\'s Notion workspace',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title of the Notion page' },
            content: { type: 'string', description: 'Content/body of the Notion page' }
          },
          required: ['title']
        }
      }
    ];

    // Call OpenAI with function-calling
    const payload = {
      model: model || 'gpt-4o',
      messages: messages || [{ role: 'user', content: prompt }],
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 256,
      functions
    };
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let errorMsg = 'OpenAI API error';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    const data = await response.json();

    // If OpenAI calls a function, handle it
    const functionCall = data.choices?.[0]?.message?.function_call;
    if (functionCall && functionCall.name === 'createNotionPage') {
      // Parse arguments
      let args = {};
      try {
        args = JSON.parse(functionCall.arguments);
      } catch {}
      // You must fetch the user's Notion token from your DB/session here
      const userId = req.user?.id;
      // TODO: Replace with real token lookup
      const notionToken = req.user?.notionToken || process.env.NOTION_TOKEN;
      if (!notionToken) {
        // Instead of returning an error, enqueue a notion_oauth_prompt task and inform the frontend to prompt for OAuth
        const taskId = Date.now(); // Replace with your real task ID logic if needed
        await aiTaskQueue.add('ai-task', {
          id: taskId,
          type: 'notion_oauth_prompt',
          input: { userId }
        });
        return sendResponse(res, {
          status: 'action_required',
          action: 'notion_oauth',
          message: 'To connect Notion, please click here.',
          oauthUrl: '/integrations/notion/auth'
        });
      }
      try {
        const notionResult = await createNotionPage({ token: notionToken, title: args.title, content: args.content });
        return sendResponse(res, { status: 'success', data: { notionResult } });
      } catch (err) {
        logger.error('[Notion] Error creating page', err);
        return sendResponse(res, { status: 'error', error: { message: 'Failed to create Notion page.' } }, 500);
      }
    }

    // Otherwise, return the AI's message
    const result = data.choices?.[0]?.message?.content || '';
    res.json({ result });
  } catch (error) {
    handleError(res, error, 'OpenAI request failed');
  }
}
// Helper: format error response
function handleError(res, error, message = 'Internal server error', requestId = null) {
  logger.error(error);
  sendResponse(res, {
    status: 'error',
    timestamp: new Date().toISOString(),
    requestId,
    error: { message, details: error.message }
  }, 500);
}

// Get all tasks
export async function getTasks(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    let { page = 1, pageSize = 20, status } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const result = await taskService.getAllTasks({ page, pageSize, userId, status });
    sendResponse(res, {
      status: 'success',
      requestId,
      data: result.tasks,
      meta: result.meta
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}
// Create a new AI task (type, input, status=pending)
export async function createTask(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Unauthorized' }
      }, 401);
    }
    const { error: validationError, value } = createTaskSchema.validate(req.body);
    if (validationError) {
      logger.warn('Validation failed', validationError.details);
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Validation failed', details: validationError.details.map(d => d.message) }
      }, 400);
    }
    const { title, description, dueDate, aiSummary } = value;
    const task = await taskService.createTask({ title, description, dueDate, aiSummary, userId });
    // Enqueue for background processing
    try {
      const { aiTaskQueue } = await import('../jobs/aitaskworker.js');
      await aiTaskQueue.add('ai-task', { id: task.id, title, description });
    } catch (queueError) {
      logger.error('Failed to enqueue AI task:', queueError);
    }
    sendResponse(res, {
      status: 'success',
      requestId,
      data: task
    }, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Get a specific task (only if it belongs to the user)
export async function getTask(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Task ID is required' }
      }, 400);
    }
    const task = await taskService.getTaskById(id);
    if (!task || task.userId !== userId) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Task not found' }
      }, 404);
    }
    logger.info(`[Task] Fetched: userId=${userId}, taskId=${id}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: task
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// Delete a task
export async function deleteTask(req, res, next) {
  const requestId = req.headers['x-request-id'] || null;
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Task ID is required' }
      }, 400);
    }
    const task = await taskService.getTaskById(id);
    if (!task || task.userId !== userId) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Task not found or unauthorized' }
      }, 404);
    }
    await taskService.deleteTask(id);
    logger.info(`[Task] Deleted: userId=${userId}, taskId=${id}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: { message: 'Task deleted.' }
    }, 200);
  } catch (error) {
    logger.error(error);
    next(error);
  }
}
