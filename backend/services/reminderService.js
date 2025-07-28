// backend/services/reminderService.js
// Minimal placeholder to resolve import error. Expand as needed for real reminder logic.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createReminder({ userId, message, dueAt }) {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        message,
        dueAt: new Date(dueAt),
        status: 'pending',
      }
    });
    return reminder;
  } catch (err) {
    throw new Error('Failed to create reminder: ' + err.message);
  }
}

// List reminders for a user
export async function listReminders({ userId, status, limit = 20 } = {}) {
  try {
    const where = { userId };
    if (status) where.status = status;
    return await prisma.reminder.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      take: limit
    });
  } catch (err) {
    throw new Error('Failed to list reminders: ' + err.message);
  }
}

// Update a reminder
export async function updateReminder(id, data) {
  try {
    if (data.dueAt) data.dueAt = new Date(data.dueAt);
    return await prisma.reminder.update({
      where: { id: Number(id) },
      data
    });
  } catch (err) {
    throw new Error('Failed to update reminder: ' + err.message);
  }
}

// Delete a reminder
export async function deleteReminder(id) {
  try {
    return await prisma.reminder.delete({ where: { id: Number(id) } });
  } catch (err) {
    throw new Error('Failed to delete reminder: ' + err.message);
  }
}
