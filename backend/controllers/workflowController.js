// backend/controllers/workflowController.js
import * as workflowService from '../services/workflowService.js';
import sendResponse from '../utils/responseUtil.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import DOMPurify from 'isomorphic-dompurify';

export async function createWorkflow(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const schema = z.object({
      name: z.string().min(2).max(100),
      description: z.string().max(500).optional(),
      definition: z.any(),
      isShared: z.boolean().optional()
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return sendResponse(res, { status: 'error', error: { message: 'Validation failed', details: parse.error.errors } }, 400);
    }
    // Sanitize input
    const name = DOMPurify.sanitize(parse.data.name);
    const description = parse.data.description ? DOMPurify.sanitize(parse.data.description) : undefined;
    const { definition, isShared } = parse.data;
    const workflow = await workflowService.createWorkflow({ userId, name, description, definition, isShared });
    logger.info(`[Workflow] Created by user ${userId}: ${workflow.id}`);
    sendResponse(res, { status: 'success', data: workflow }, 201);
  } catch (err) {
    logger.error('[Workflow] Create error', err);
    next(err);
  }
}

export async function listWorkflows(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const workflows = await workflowService.listWorkflows({ userId });
    sendResponse(res, { status: 'success', data: workflows });
  } catch (err) {
    logger.error('[Workflow] List error', err);
    next(err);
  }
}

export async function getWorkflowById(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return sendResponse(res, { status: 'error', error: { message: 'Invalid workflow ID' } }, 400);
    }
    const workflow = await workflowService.getWorkflowById({ userId, id });
    if (!workflow) return sendResponse(res, { status: 'error', error: { message: 'Workflow not found or not owned by user' } }, 404);
    sendResponse(res, { status: 'success', data: workflow });
  } catch (err) {
    logger.error('[Workflow] Get by ID error', err);
    next(err);
  }
}

export async function updateWorkflow(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return sendResponse(res, { status: 'error', error: { message: 'Invalid workflow ID' } }, 400);
    }
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      description: z.string().max(500).optional(),
      definition: z.any().optional(),
      isShared: z.boolean().optional()
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return sendResponse(res, { status: 'error', error: { message: 'Validation failed', details: parse.error.errors } }, 400);
    }
    // Sanitize input
    const name = parse.data.name ? DOMPurify.sanitize(parse.data.name) : undefined;
    const description = parse.data.description ? DOMPurify.sanitize(parse.data.description) : undefined;
    const { definition, isShared } = parse.data;
    const workflow = await workflowService.updateWorkflow({ userId, id, name, description, definition, isShared });
    if (!workflow) return sendResponse(res, { status: 'error', error: { message: 'Workflow not found or not owned by user' } }, 404);
    logger.info(`[Workflow] Updated by user ${userId}: ${id}`);
    sendResponse(res, { status: 'success', data: workflow });
  } catch (err) {
    logger.error('[Workflow] Update error', err);
    next(err);
  }
}

export async function deleteWorkflow(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return sendResponse(res, { status: 'error', error: { message: 'Invalid workflow ID' } }, 400);
    }
    await workflowService.deleteWorkflow({ userId, id });
    logger.info(`[Workflow] Deleted by user ${userId}: ${id}`);
    sendResponse(res, { status: 'success', data: { message: 'Workflow deleted' } });
  } catch (err) {
    logger.error('[Workflow] Delete error', err);
    next(err);
  }
}
