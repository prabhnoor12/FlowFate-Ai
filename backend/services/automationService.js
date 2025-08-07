// backend/services/automationService.js
// Automation service with error handling, relationships, tagging, and helpers.

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
const prisma = new PrismaClient();


const ALLOWED_STATUSES = ['pending', 'active', 'completed', 'failed', 'inactive'];

// Helper: Check automation existence
async function getExistingAutomation(id) {
  if (!id) throw new Error('id is required');
  const automation = await prisma.automation.findUnique({ where: { id: Number(id) } });
  if (!automation) throw new Error(`Automation ${id} not found`);
  return automation;
}

// Helper: Check user permission
async function checkAutomationPermission(id, userId) {
  const automation = await getExistingAutomation(id);
  if (automation.userId !== userId) throw new Error('Permission denied');
  return automation;
}

function validateAutomationInput({ userId, name, config, status, workflowId, tags }) {
  if (!userId) throw new Error('userId is required');
  if (!name) throw new Error('name is required');
  if (typeof config !== 'object' || config === null) throw new Error('config must be a valid object');
  if (status && !ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
  if (workflowId && typeof workflowId !== 'number') throw new Error('workflowId must be a number');
  if (tags && !Array.isArray(tags)) throw new Error('tags must be an array');
}

// Create a new automation
async function createAutomation({ userId, name, config, status = 'pending', workflowId, tags = [] }) {
  try {
    validateAutomationInput({ userId, name, config, status, workflowId, tags });
    const automation = await prisma.automation.create({
      data: {
        userId,
        name,
        config,
        status,
        workflowId,
        tags
      }
    });
    logger.info(`Automation created: ${automation.id} by user ${userId}`);
    return automation;
  } catch (err) {
    throw new Error('Failed to create automation: ' + err.message);
  }
}

// List automations for a user
async function listAutomations({ userId, status, workflowId, tags, limit = 20 } = {}) {
  try {
    if (!userId) throw new Error('userId is required');
    const where = { userId };
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
      where.status = status;
    }
    if (workflowId) where.workflowId = workflowId;
    if (Array.isArray(tags) && tags.length > 0) where.tags = { hasSome: tags };
    const automations = await prisma.automation.findMany({
      where: { ...where, archived: false },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    logger.info(`Listed automations for user ${userId}`);
    return automations;
  } catch (err) {
    throw new Error('Failed to list automations: ' + err.message);
  }
}

// Update an automation
async function updateAutomation(id, data, userId) {
  try {
    await checkAutomationPermission(id, userId);
    if (data.status && !ALLOWED_STATUSES.includes(data.status)) throw new Error(`Invalid status: ${data.status}`);
    if (data.config && (typeof data.config !== 'object' || data.config === null)) throw new Error('config must be a valid object');
    if (data.workflowId && typeof data.workflowId !== 'number') throw new Error('workflowId must be a number');
    if (data.tags && !Array.isArray(data.tags)) throw new Error('tags must be an array');
    const updated = await prisma.automation.update({
      where: { id: Number(id) },
      data
    });
    logger.info(`Updated automation ${id} by user ${userId}`);
    return updated;
  } catch (err) {
    if (err.code === 'P2025') {
      throw new Error(`Automation ${id} not found`);
    }
    throw new Error('Failed to update automation: ' + err.message);
  }
}

// Delete an automation
async function deleteAutomation(id, userId) {
  try {
    await checkAutomationPermission(id, userId);
    const deleted = await prisma.automation.delete({ where: { id: Number(id) } });
    logger.info(`Deleted automation ${id} by user ${userId}`);
    return deleted;
  } catch (err) {
    if (err.code === 'P2025') {
      throw new Error(`Automation ${id} not found`);
    }
    throw new Error('Failed to delete automation: ' + err.message);
  }
}

// Change automation status
async function setAutomationStatus(id, status, userId) {
  try {
    await checkAutomationPermission(id, userId);
    if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    const updated = await prisma.automation.update({
      where: { id: Number(id) },
      data: { status }
    });
    logger.info(`Set status of automation ${id} to ${status} by user ${userId}`);
    return updated;
  } catch (err) {
    if (err.code === 'P2025') {
      throw new Error(`Automation ${id} not found`);
    }
    throw new Error('Failed to set automation status: ' + err.message);
  }
}

// Bulk update automations
async function bulkUpdateAutomations({ userId, ids, updateFields }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const updated = await prisma.automation.updateMany({
      where: { id: { in: ids.map(Number) }, userId },
      data: updateFields
    });
    logger.info(`Bulk updated automations ${ids.join(', ')} for user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to bulk update automations:', err);
    throw new Error('Failed to bulk update automations: ' + err.message);
  }
}

// Bulk delete automations
async function bulkDeleteAutomations({ userId, ids }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const deleted = await prisma.automation.deleteMany({
      where: { id: { in: ids.map(Number) }, userId }
    });
    logger.info(`Bulk deleted automations ${ids.join(', ')} for user ${userId}`);
    return deleted;
  } catch (err) {
    logger.error('Failed to bulk delete automations:', err);
    throw new Error('Failed to bulk delete automations: ' + err.message);
  }
}

// Bulk set status for automations
async function bulkSetAutomationsStatus({ userId, ids, status }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    const updated = await prisma.automation.updateMany({
      where: { id: { in: ids.map(Number) }, userId },
      data: { status }
    });
    logger.info(`Bulk set status=${status} for automations ${ids.join(', ')} by user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to bulk set automation status:', err);
    throw new Error('Failed to bulk set automation status: ' + err.message);
  }
}

// Soft delete (archive) automation
async function archiveAutomation(id, userId) {
  try {
    await checkAutomationPermission(id, userId);
    const archived = await prisma.automation.update({
      where: { id: Number(id) },
      data: { archived: true }
    });
    logger.info(`Archived automation ${id} by user ${userId}`);
    return archived;
  } catch (err) {
    if (err.code === 'P2025') {
      throw new Error(`Automation ${id} not found`);
    }
    throw new Error('Failed to archive automation: ' + err.message);
  }
}

// Advanced filtering & pagination
async function searchAutomations({ userId, query, tags, status, workflowId, page = 1, pageSize = 20 }) {
  try {
    if (!userId) throw new Error('userId is required');
    const skip = (page - 1) * pageSize;
    const where = { userId, archived: false };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { config: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (Array.isArray(tags) && tags.length > 0) where.tags = { hasSome: tags };
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
      where.status = status;
    }
    if (workflowId) where.workflowId = workflowId;
    const automations = await prisma.automation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });
    const total = await prisma.automation.count({ where });
    logger.info(`Searched automations for user ${userId} (query: ${query}, tags: ${tags}, status: ${status}, workflowId: ${workflowId}, page: ${page}, pageSize: ${pageSize})`);
    return { automations, total, page, pageSize };
  } catch (err) {
    logger.error('Failed to search automations:', err);
    throw new Error('Failed to search automations: ' + err.message);
  }
}

export {
  getExistingAutomation,
  checkAutomationPermission,
  validateAutomationInput,
  createAutomation,
  listAutomations,
  updateAutomation,
  deleteAutomation,
  setAutomationStatus,
  bulkUpdateAutomations,
  bulkDeleteAutomations,
  bulkSetAutomationsStatus,
  archiveAutomation,
  searchAutomations
}
