// Handles user automations (ESM)

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';
import { createAutomationSchema } from '../validators/automationValidator.js';
import DOMPurify from 'isomorphic-dompurify';

const prisma = new PrismaClient();

// --- Utility: Centralized error handler ---
function handleError(res, error, requestId, next, status = 500, userMessage = 'Internal server error') {
  logger.error(error);
  if (typeof error === 'object' && error.code && error.code.startsWith('P')) {
    // Prisma error
    return sendResponse(res, {
      status: 'error',
      requestId,
      error: { message: 'Database error', details: error.message }
    }, 500);
  }
  sendResponse(res, {
    status: 'error',
    requestId,
    error: { message: userMessage, details: error?.message || error }
  }, status);
  if (next) next(error);
}

// --- In-memory rate limit store (userId -> [timestamps]) ---
const automationRateLimitMap = new Map();
const AUTOMATION_LIMIT = 5; // max creations
const AUTOMATION_WINDOW_MS = 60 * 1000; // 1 minute

// Helper: Check if user has connected the required integration (stub for extensibility)
async function isIntegrationConnected(userId, integration) {
  // TODO: Implement real check using integrationService if needed
  return true;
}

// Create a new automation rule (with per-user rate limiting, one integration/task enforced)
export async function createAutomation(req, res, next) {
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
    // --- Rate limiting logic ---
    const now = Date.now();
    let timestamps = automationRateLimitMap.get(userId) || [];
    // Remove timestamps older than window
    timestamps = timestamps.filter(ts => now - ts < AUTOMATION_WINDOW_MS);
    if (timestamps.length >= AUTOMATION_LIMIT) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: `Rate limit exceeded: Max ${AUTOMATION_LIMIT} automations per minute.` }
      }, 429);
    }
    timestamps.push(now);
    automationRateLimitMap.set(userId, timestamps);

    const { error: validationError, value } = createAutomationSchema.validate(req.body);
    if (validationError) {
      logger.warn('Validation failed', validationError.details);
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Validation failed', details: validationError.details.map(d => d.message) }
      }, 400);
    }
    // Enforce: only one integration and one task per automation
    if (Array.isArray(value.integration) && value.integration.length > 1) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Only one integration per automation is allowed.' }
      }, 400);
    }
    if (Array.isArray(value.tasks) && value.tasks.length > 1) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Only one task per automation is allowed.' }
      }, 400);
    }
    // Optionally check integration connection
    if (value.integration && !(await isIntegrationConnected(userId, value.integration))) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: `Integration ${value.integration} not connected.` }
      }, 400);
    }
    // Sanitize input
    const trigger = DOMPurify.sanitize(value.trigger);
    const action = DOMPurify.sanitize(value.action);
    const integration = value.integration ? DOMPurify.sanitize(value.integration) : undefined;
    const automation = await prisma.automation.create({
      data: { trigger, action, integration, userId },
    });
    logger.info(`[Automation] Created: userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: automation
    }, 201);
  } catch (error) {
    handleError(res, error, requestId, next);
  }
}


// List all automations for the user, with pagination and optional filtering
// Supports filtering by trigger, action, and integration
export async function getAutomations(req, res, next) {
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
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    // Optional filtering by trigger/action/integration
    const filter = {};
    if (req.query.trigger) filter.trigger = { contains: req.query.trigger, mode: 'insensitive' };
    if (req.query.action) filter.action = { contains: req.query.action, mode: 'insensitive' };
    if (req.query.integration) filter.integration = { contains: req.query.integration, mode: 'insensitive' };
    const [automations, total] = await Promise.all([
      prisma.automation.findMany({
        where: { userId, ...filter },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.automation.count({ where: { userId, ...filter } })
    ]);
    logger.info(`[Automation] Fetched: userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: automations,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    handleError(res, error, requestId, next);
  }
}

// Update an automation rule (enforces one integration/task)
export async function updateAutomation(req, res, next) {
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
    const id = parseInt(req.params.id);
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Invalid automation ID' }
      }, 400);
    }
    const { error: validationError, value } = createAutomationSchema.validate(req.body);
    if (validationError) {
      logger.warn('Validation failed', validationError.details);
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Validation failed', details: validationError.details.map(d => d.message) }
      }, 400);
    }
    // Enforce: only one integration and one task per automation
    if (Array.isArray(value.integration) && value.integration.length > 1) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Only one integration per automation is allowed.' }
      }, 400);
    }
    if (Array.isArray(value.tasks) && value.tasks.length > 1) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Only one task per automation is allowed.' }
      }, 400);
    }
    // Optionally check integration connection
    if (value.integration && !(await isIntegrationConnected(userId, value.integration))) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: `Integration ${value.integration} not connected.` }
      }, 400);
    }
    // Sanitize input
    const trigger = DOMPurify.sanitize(value.trigger);
    const action = DOMPurify.sanitize(value.action);
    const integration = value.integration ? DOMPurify.sanitize(value.integration) : undefined;
    const automation = await prisma.automation.update({
      where: { id, userId },
      data: { trigger, action, integration },
    });
    logger.info(`[Automation] Updated: id=${id}, userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: automation
    });
  } catch (error) {
    handleError(res, error, requestId, next, 404, 'Automation not found or update failed');
  }
}

// Delete an automation rule
export async function deleteAutomation(req, res, next) {
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
    const id = parseInt(req.params.id);
    if (!id) {
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Invalid automation ID' }
      }, 400);
    }
    await prisma.automation.delete({ where: { id, userId } });
    logger.info(`[Automation] Deleted: id=${id}, userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      message: 'Automation deleted'
    });
  } catch (error) {
    handleError(res, error, requestId, next, 404, 'Automation not found or delete failed');
  }
}
