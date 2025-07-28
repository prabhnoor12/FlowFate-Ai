// backend/services/workflowService.js
import prisma from '../prisma/client.js';

export async function createWorkflow({ userId, name, description, definition, isShared }) {
  try {
    return await prisma.workflow.create({
      data: { userId, name, description, definition, isShared }
    });
  } catch (err) {
    throw new Error('Failed to create workflow: ' + err.message);
  }
}

export async function listWorkflows({ userId }) {
  try {
    return await prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    throw new Error('Failed to list workflows: ' + err.message);
  }
}

export async function getWorkflowById({ userId, id }) {
  try {
    return await prisma.workflow.findFirst({
      where: { id: Number(id), userId }
    });
  } catch (err) {
    throw new Error('Failed to get workflow: ' + err.message);
  }
}

export async function updateWorkflow({ userId, id, name, description, definition, isShared }) {
  try {
    // Only update provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (definition !== undefined) updateData.definition = definition;
    if (isShared !== undefined) updateData.isShared = isShared;
    return await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: updateData
    });
  } catch (err) {
    throw new Error('Failed to update workflow: ' + err.message);
  }
}

export async function deleteWorkflow({ userId, id }) {
  try {
    return await prisma.workflow.delete({
      where: { id: Number(id), userId }
    });
  } catch (err) {
    throw new Error('Failed to delete workflow: ' + err.message);
  }

}

// Share or unshare a workflow
export async function setWorkflowShared({ userId, id, isShared }) {
  try {
    return await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: { isShared: !!isShared }
    });
  } catch (err) {
    throw new Error('Failed to update workflow sharing: ' + err.message);
  }
}
