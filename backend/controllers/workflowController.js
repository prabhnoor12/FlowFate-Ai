

// --- Imports ---
import { run as runAI } from './openAIController.js';
import integrationService from '../services/integrationService.js';
import * as workflowService from '../services/workflowService.js';
import sendResponse from '../utils/responseUtil.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import DOMPurify from 'isomorphic-dompurify';

// --- Exports (all at top for clarity) ---
export { createWorkflow, listWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow, executeWorkflow, getWorkflowStatus };

// --- Helpers ---
/**
 * Validate workflow definition structure
 * @param {any} definition
 * @returns {{valid: boolean, error?: string}}
 */
function validateWorkflowDefinition(definition) {
  if (!Array.isArray(definition) || definition.length === 0) {
    return { valid: false, error: 'Workflow must have at least one step.' };
  }
  for (const [i, step] of definition.entries()) {
    if (typeof step !== 'object' || !step.integration || !step.action) {
      return { valid: false, error: `Step ${i + 1} missing integration or action.` };
    }
  }
  return { valid: true };
}

function sanitizeWorkflowInput(data) {
  return {
    name: data.name ? DOMPurify.sanitize(data.name) : undefined,
    description: data.description ? DOMPurify.sanitize(data.description) : undefined,
    definition: data.definition,
    isShared: data.isShared
  };
}

// --- In-memory status tracking (for demo; use Redis or DB for production) ---
// TODO: Replace with Redis or persistent store for distributed/production deployments
const workflowStatusMap = new Map();
// TODO: Add per-user rate limiting for create/update/execute endpoints

// --- Controllers ---

/**
 * Create a new workflow
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function createWorkflow(req, res, next) {
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
    const { name, description, definition, isShared } = sanitizeWorkflowInput(parse.data);
    const validation = validateWorkflowDefinition(definition);
    if (!validation.valid) {
      return sendResponse(res, { status: 'error', error: { message: validation.error } }, 400);
    }
    for (const step of definition) {
      const connected = await integrationService.isIntegrationConnected(userId, step.integration);
      if (!connected) {
        return sendResponse(res, { status: 'error', error: { message: `Integration ${step.integration} not connected.` } }, 400);
      }
    }
    const workflow = await workflowService.createWorkflow({ userId, name, description, definition, isShared });
    logger.info(`[Workflow] Created by user ${userId}: ${workflow.id}`);
    sendResponse(res, { status: 'success', data: workflow }, 201);
  } catch (err) {
    logger.error('[Workflow] Create error', err);
    next(err);
  }
/**
 * Execute a workflow: runs all steps in order, returns results and status for each step
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function executeWorkflow(req, res, next) {
  try {
    const userId = req.user?.id;
    const workflowId = req.params.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    const workflow = await workflowService.getWorkflowById({ userId, id: workflowId });
    if (!workflow) return sendResponse(res, { status: 'error', error: { message: 'Workflow not found' } }, 404);
    const definition = workflow.definition;
    const results = [];
    for (const [i, step] of definition.entries()) {
      try {
        // Optionally, call AI to help with step execution
        // const aiResult = await runAI({ ... });
        // For now, just simulate execution
        results.push({ step: i + 1, integration: step.integration, action: step.action, status: 'success', output: `Executed ${step.action} on ${step.integration}` });
      } catch (err) {
        results.push({ step: i + 1, integration: step.integration, action: step.action, status: 'error', error: err.message });
        break;
      }
    }
    sendResponse(res, { status: 'success', workflowId, results }, 200);
  } catch (err) {
    logger.error('[Workflow] Execute error', err);
    next(err);
  }
}
/**
 * Get workflow status (demo: in-memory)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function getWorkflowStatus(req, res, next) {
  const workflowId = req.params.id;
  const status = workflowStatusMap.get(workflowId) || 'unknown';
  sendResponse(res, { status: 'success', workflowId, workflowStatus: status }, 200);
}

/**
 * List workflows with pagination, filtering, and sharing support
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function listWorkflows(req, res, next) {
  const start = Date.now();
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    // Pagination and filtering
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const skip = (page - 1) * pageSize;
    const filter = {};
    if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
    if (req.query.isShared !== undefined) filter.isShared = req.query.isShared === 'true';
    // Only show user's workflows or shared ones
    const where = {
      OR: [
        { userId },
        { isShared: true }
      ],
      ...filter
    };
    const [workflows, total] = await Promise.all([
      workflowService.listWorkflows({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      workflowService.countWorkflows({ where })
    ]);
    logger.info(`[Workflow] List: userId=${userId}, page=${page}, ms=${Date.now() - start}`);
    sendResponse(res, {
      status: 'success',
      data: workflows,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    logger.error('[Workflow] List error', err);
    sendResponse(res, { status: 'error', error: { message: 'Failed to list workflows', details: err.message } }, 500);
    if (next) next(err);
  }
}

/**
 * Get workflow by ID
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function getWorkflowById(req, res, next) {
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

/**
 * Update workflow
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function updateWorkflow(req, res, next) {
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
    const { name, description, definition, isShared } = sanitizeWorkflowInput(parse.data);
    const workflow = await workflowService.updateWorkflow({ userId, id, name, description, definition, isShared });
    if (!workflow) return sendResponse(res, { status: 'error', error: { message: 'Workflow not found or not owned by user' } }, 404);
    sendResponse(res, { status: 'success', data: workflow });
  } catch (err) {
    logger.error('[Workflow] Update error', err);
    next(err);
  }
}

/**
 * Delete workflow
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function deleteWorkflow(req, res, next) {
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
}}
