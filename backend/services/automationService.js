// backend/services/automationService.js
// Minimal placeholder to resolve import error. Expand as needed for real automation logic.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// Create a new automation
export async function createAutomation({ userId, name, config }) {
  try {
    return await prisma.automation.create({
      data: {
        userId,
        name,
        config,
        status: 'pending',
      }
    });
  } catch (err) {
    throw new Error('Failed to create automation: ' + err.message);
  }
}

// List automations for a user
export async function listAutomations({ userId, status, limit = 20 } = {}) {
  try {
    const where = { userId };
    if (status) where.status = status;
    return await prisma.automation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (err) {
    throw new Error('Failed to list automations: ' + err.message);
  }
}

// Update an automation
export async function updateAutomation(id, data) {
  try {
    return await prisma.automation.update({
      where: { id: Number(id) },
      data
    });
  } catch (err) {
    throw new Error('Failed to update automation: ' + err.message);
  }
}

// Delete an automation
export async function deleteAutomation(id) {
  try {
    return await prisma.automation.delete({ where: { id: Number(id) } });
  } catch (err) {
    throw new Error('Failed to delete automation: ' + err.message);
  }
}
