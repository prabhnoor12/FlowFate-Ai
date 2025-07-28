// Handles user automations (ESM)
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';
import { createAutomationSchema } from '../validators/automationValidator.js';

const prisma = new PrismaClient();

// Create a new automation rule
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
    const { error: validationError, value } = createAutomationSchema.validate(req.body);
    if (validationError) {
      logger.warn('Validation failed', validationError.details);
      return sendResponse(res, {
        status: 'error',
        requestId,
        error: { message: 'Validation failed', details: validationError.details.map(d => d.message) }
      }, 400);
    }
    const { trigger, action } = value;
    const automation = await prisma.automation.create({
      data: { trigger, action, userId },
    });
    logger.info(`[Automation] Created: userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: automation
    }, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
}

// List all automations for the user
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
    const automations = await prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    logger.info(`[Automation] Fetched: userId=${userId}, requestId=${requestId}`);
    sendResponse(res, {
      status: 'success',
      requestId,
      data: automations
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
}
