// automation_controller.js
// Handles CRUD operations for user-created automations
/**
 * Get a single automation by ID (for viewing/editing)
 */
const automationService = require('../services/automation_service');

exports.getAutomationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const automation = await automationService.getAutomationById(userId, id);
    if (!automation) {
      return next(new AppError('Automation not found', 404));
    }
    res.json(automation);
  } catch (err) {
    logger.error('Failed to fetch automation by ID', { error: err });
    next(new AppError('Failed to fetch automation', 500, err.message));
  }
};

/**
 * Duplicate an existing automation (creates a copy for the user)
 */
exports.duplicateAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const copy = await automationService.duplicateAutomation(userId, id);
    if (!copy) {
      return next(new AppError('Automation not found', 404));
    }
    res.status(201).json(copy);
  } catch (err) {
    logger.error('Failed to duplicate automation', { error: err });
    next(new AppError('Failed to duplicate automation', 500, err.message));
  }
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');

/**
 * Get all automations for a user
 */
exports.getAutomations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const { automations, total } = await automationService.getAutomations(userId, { page, pageSize, search });
    res.json({ automations, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    logger.error('Failed to fetch automations', { error: err });
    next(new AppError('Failed to fetch automations', 500, err.message));
  }
};

/**
 * Create a new automation
 */
const automationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  workflow: Joi.object().required(),
});

exports.createAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error, value } = automationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for createAutomation', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const automation = await automationService.createAutomation(userId, value);
    res.status(201).json(automation);
  } catch (err) {
    logger.error('Failed to create automation', { error: err });
    next(new AppError('Failed to create automation', 500, err.message));
  }
};

/**
 * Update an existing automation
 */
exports.updateAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { error, value } = automationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for updateAutomation', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const automation = await automationService.updateAutomation(userId, id, value);
    res.json(automation);
  } catch (err) {
    logger.error('Failed to update automation', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Automation not found', 404));
    }
    next(new AppError('Failed to update automation', 500, err.message));
  }
};
/**
 * Partially update an automation (PATCH)
 */
exports.patchAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Allow partial update, but validate known fields
    const patchSchema = Joi.object({
      name: Joi.string().min(2).max(100),
      description: Joi.string().max(500).allow('', null),
      workflow: Joi.object(),
    });
    const { error, value } = patchSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Validation failed for patchAutomation', { error });
      return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
    }
    const automation = await automationService.patchAutomation(userId, id, value);
    res.json(automation);
  } catch (err) {
    logger.error('Failed to patch automation', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Automation not found', 404));
    }
    next(new AppError('Failed to patch automation', 500, err.message));
  }
};

/**
 * Delete an automation
 */
exports.deleteAutomation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await automationService.deleteAutomation(userId, id);
    res.json({ message: 'Automation deleted' });
  } catch (err) {
    logger.error('Failed to delete automation', { error: err });
    if (err.code === 'P2025') {
      return next(new AppError('Automation not found', 404));
    }
    next(new AppError('Failed to delete automation', 500, err.message));
  }
};
