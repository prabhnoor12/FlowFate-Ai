// backend/services/reminderService.js
// Minimal placeholder to resolve import error. Expand as needed for real reminder logic.

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
const prisma = new PrismaClient();

const ALLOWED_STATUSES = ['pending', 'sent', 'completed', 'cancelled'];

function validateReminderInput({ userId, message, dueAt, status }) {
  if (!userId) throw new Error('userId is required');
  if (!message) throw new Error('message is required');
  if (!dueAt || isNaN(new Date(dueAt))) throw new Error('dueAt must be a valid date');
  if (status && !ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
}

export async function createReminder({ userId, message, dueAt }) {
  try {
    validateReminderInput({ userId, message, dueAt });
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        message,
        dueAt: new Date(dueAt),
        status: 'pending',
      }
    });
    logger.info(`Reminder created: ${reminder.id} by user ${userId}`);
    return reminder;
  } catch (err) {
    logger.error('Failed to create reminder:', err);
    throw new Error('Failed to create reminder: ' + err.message);
  }
}

// List reminders for a user
export async function listReminders({ userId, status, limit = 20 } = {}) {
  try {
    if (!userId) throw new Error('userId is required');
    const where = { userId };
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
      where.status = status;
    }
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      take: limit
    });
    logger.info(`Listed reminders for user ${userId}`);
    return reminders;
  } catch (err) {
    logger.error('Failed to list reminders:', err);
    throw new Error('Failed to list reminders: ' + err.message);
  }
}

// Update a reminder
export async function updateReminder(id, data) {
  try {
    if (!id) throw new Error('id is required');
    if (data.dueAt) data.dueAt = new Date(data.dueAt);
    if (data.status && !ALLOWED_STATUSES.includes(data.status)) throw new Error(`Invalid status: ${data.status}`);
    const updated = await prisma.reminder.update({
      where: { id: Number(id) },
      data
    });
    logger.info(`Updated reminder ${id}`);
    return updated;
  } catch (err) {
    logger.error('Failed to update reminder:', err);
    throw new Error('Failed to update reminder: ' + err.message);
  }
}

// Delete a reminder
export async function deleteReminder(id) {
  try {
    if (!id) throw new Error('id is required');
    const deleted = await prisma.reminder.delete({ where: { id: Number(id) } });
    logger.info(`Deleted reminder ${id}`);
    return deleted;
  } catch (err) {
    logger.error('Failed to delete reminder:', err);
    throw new Error('Failed to delete reminder: ' + err.message);
  }
}

// Bulk update reminders
export async function bulkUpdateReminders({ userId, ids, updateFields }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const updated = await prisma.reminder.updateMany({
      where: { id: { in: ids.map(Number) }, userId },
      data: updateFields
    });
    logger.info(`Bulk updated reminders ${ids.join(', ')} for user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to bulk update reminders:', err);
    throw new Error('Failed to bulk update reminders: ' + err.message);
  }
}

// Bulk delete reminders
export async function bulkDeleteReminders({ userId, ids }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const deleted = await prisma.reminder.deleteMany({
      where: { id: { in: ids.map(Number) }, userId }
    });
    logger.info(`Bulk deleted reminders ${ids.join(', ')} for user ${userId}`);
    return deleted;
  } catch (err) {
    logger.error('Failed to bulk delete reminders:', err);
    throw new Error('Failed to bulk delete reminders: ' + err.message);
  }
}

// Set reminder status
export async function setReminderStatus(id, status) {
  try {
    if (!id) throw new Error('id is required');
    if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    const updated = await prisma.reminder.update({
      where: { id: Number(id) },
      data: { status }
    });
    logger.info(`Set status of reminder ${id} to ${status}`);
    return updated;
  } catch (err) {
    logger.error('Failed to set reminder status:', err);
    throw new Error('Failed to set reminder status: ' + err.message);
  }
}

// Advanced filtering & pagination
export async function searchReminders({ userId, query, status, page = 1, pageSize = 20 }) {
  try {
    if (!userId) throw new Error('userId is required');
    const skip = (page - 1) * pageSize;
    const where = { userId };
    if (query) {
      where.OR = [
        { message: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
      where.status = status;
    }
    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      skip,
      take: pageSize
    });
    const total = await prisma.reminder.count({ where });
    logger.info(`Searched reminders for user ${userId} (query: ${query}, status: ${status}, page: ${page}, pageSize: ${pageSize})`);
    return { reminders, total, page, pageSize };
  } catch (err) {
    logger.error('Failed to search reminders:', err);
    throw new Error('Failed to search reminders: ' + err.message);
  }
}
export default {
  createReminder,
  listReminders,
  updateReminder,
  deleteReminder,
  bulkUpdateReminders,
  bulkDeleteReminders,
  setReminderStatus,
  searchReminders
};
