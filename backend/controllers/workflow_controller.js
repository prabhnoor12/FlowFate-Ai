// workflow_controller.js
// Handles CRUD operations for user-created workflows (multi-step tasks)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');

const workflowSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  steps: Joi.array().items(Joi.object()).min(1).required(),
});

/**
 * Get all workflows for a user, with pagination and search
 */
exports.getWorkflows = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(pageSize) }),
      prisma.workflow.count({ where }),
    ]);
    res.json({ workflows, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    logger.error('Failed to fetch workflows', { error: err });
    next(new AppError('Failed to fetch workflows', 500, err.message));
  }
};

/**
 * Get a single workflow by ID
 */
exports.getWorkflowById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const workflow = await prisma.workflow.findFirst({ where: { id: Number(id), userId } });
    if (!workflow) {
      return next(new AppError('Workflow not found', 404));
    }
    res.json(workflow);
  } catch (err) {
    logger.error('Failed to fetch workflow by ID', { error: err });
    next(new AppError('Failed to fetch workflow', 500, err.message));
  }
};

/**
 * Create a new workflow
 */
exports.createWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error, value } = workflowSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for createWorkflow', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const workflow = await prisma.workflow.create({
      data: { ...value, userId },
    });
    res.status(201).json(workflow);
  } catch (err) {
    logger.error('Failed to create workflow', { error: err });
    next(new AppError('Failed to create workflow', 500, err.message));
  }
};

/**
 * Update an existing workflow
 */
exports.updateWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { error, value } = workflowSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for updateWorkflow', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const workflow = await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: value,
    });
    res.json(workflow);
  } catch (err) {
    logger.error('Failed to update workflow', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Workflow not found', 404));
    }
    next(new AppError('Failed to update workflow', 500, err.message));
  }
};
/**
 * Partially update a workflow (PATCH)
 */
exports.patchWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Allow partial update, but validate known fields
    const patchSchema = Joi.object({
      name: Joi.string().min(2).max(100),
      description: Joi.string().max(500).allow('', null),
      steps: Joi.array().items(Joi.object()).min(1),
    });
    const { error, value } = patchSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for patchWorkflow', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const workflow = await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: value,
    });
    res.json(workflow);
  } catch (err) {
    logger.error('Failed to patch workflow', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Workflow not found', 404));
    }
    next(new AppError('Failed to patch workflow', 500, err.message));
  }
};

/**
 * Delete a workflow
 */
exports.deleteWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await prisma.workflow.delete({ where: { id: Number(id), userId } });
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    logger.error('Failed to delete workflow', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Workflow not found', 404));
    }
    next(new AppError('Failed to delete workflow', 500, err.message));
  }
};

/**
 * Duplicate a workflow
 */
exports.duplicateWorkflow = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const workflow = await prisma.workflow.findFirst({ where: { id: Number(id), userId } });
    if (!workflow) {
      return next(new AppError('Workflow not found', 404));
    }
    const copy = await prisma.workflow.create({
      data: {
        name: workflow.name + ' (Copy)',
        description: workflow.description,
        steps: workflow.steps,
        userId,
      },
    });
    res.status(201).json(copy);
  } catch (err) {
    logger.error('Failed to duplicate workflow', { error: err });
    next(new AppError('Failed to duplicate workflow', 500, err.message));
  }
};
