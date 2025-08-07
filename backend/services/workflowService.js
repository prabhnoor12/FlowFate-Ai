import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

// Helper to check workflow existence
export async function getExistingWorkflow(userId, id) {
  if (!userId || !id) throw new Error('userId and id are required');
  const workflow = await prisma.workflow.findFirst({ where: { id: Number(id), userId } });
  if (!workflow) throw new Error(`Workflow ${id} not found for user ${userId}`);
  return workflow;
}

export async function createWorkflow({ userId, name, description, definition, isShared, tags }) {
  try {
    if (!userId || !name || !definition) {
      throw new Error('userId, name, and definition are required');
    }
    if (tags && !Array.isArray(tags)) throw new Error('tags must be an array');
    const workflow = await prisma.workflow.create({
      data: { userId, name, description, definition, isShared, tags: tags || [] }
    });
    logger.info(`Workflow created: ${workflow.id} by user ${userId}`);
    return workflow;
  } catch (err) {
    logger.error('Failed to create workflow:', err);
    throw new Error('Failed to create workflow: ' + err.message);
  }
}

export async function listWorkflows({ userId, page = 1, pageSize = 10, search, tags, isShared }) {
  try {
    if (!userId) throw new Error('userId is required');
    const skip = (page - 1) * pageSize;
    // Build filter object
    const where = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (Array.isArray(tags) && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    if (typeof isShared === 'boolean') {
      where.isShared = isShared;
    }
    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    });
    const total = await prisma.workflow.count({ where });
    logger.info(`Listed workflows for user ${userId} (page ${page}, size ${pageSize}, search: ${search}, tags: ${tags}, isShared: ${isShared})`);
    return { workflows, total, page, pageSize };
  } catch (err) {
    logger.error('Failed to list workflows:', err);
    throw new Error('Failed to list workflows: ' + err.message);
  }
}
// ...existing code...

export async function getWorkflowById({ userId, id }) {
  try {
    const workflow = await getExistingWorkflow(userId, id);
    logger.info(`Fetched workflow ${id} for user ${userId}`);
    return workflow;
  } catch (err) {
    logger.error('Failed to get workflow:', err);
    throw new Error('Failed to get workflow: ' + err.message);
  }
}

export async function updateWorkflow({ userId, id, name, description, definition, isShared, tags }) {
  try {
    await getExistingWorkflow(userId, id);
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (definition !== undefined) updateData.definition = definition;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (tags !== undefined) {
      if (!Array.isArray(tags)) throw new Error('tags must be an array');
      updateData.tags = tags;
    }
    const updated = await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: updateData
    });
    logger.info(`Updated workflow ${id} for user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to update workflow:', err);
    throw new Error('Failed to update workflow: ' + err.message);
  }
}
// Bulk update workflows
export async function bulkUpdateWorkflows({ userId, ids, updateFields }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const updated = await prisma.workflow.updateMany({
      where: { id: { in: ids.map(Number) }, userId },
      data: updateFields
    });
    logger.info(`Bulk updated workflows ${ids.join(', ')} for user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to bulk update workflows:', err);
    throw new Error('Failed to bulk update workflows: ' + err.message);
  }
}

// Bulk delete workflows
export async function bulkDeleteWorkflows({ userId, ids }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const deleted = await prisma.workflow.deleteMany({
      where: { id: { in: ids.map(Number) }, userId }
    });
    logger.info(`Bulk deleted workflows ${ids.join(', ')} for user ${userId}`);
    return deleted;
  } catch (err) {
    logger.error('Failed to bulk delete workflows:', err);
    throw new Error('Failed to bulk delete workflows: ' + err.message);
  }
}

// Bulk share/unshare workflows
export async function bulkSetWorkflowsShared({ userId, ids, isShared }) {
  try {
    if (!userId || !Array.isArray(ids) || ids.length === 0) throw new Error('userId and ids are required');
    const updated = await prisma.workflow.updateMany({
      where: { id: { in: ids.map(Number) }, userId },
      data: { isShared: !!isShared }
    });
    logger.info(`Bulk set shared=${!!isShared} for workflows ${ids.join(', ')} by user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to bulk set workflow sharing:', err);
    throw new Error('Failed to bulk set workflow sharing: ' + err.message);
  }
}

export async function deleteWorkflow({ userId, id }) {
  try {
    await getExistingWorkflow(userId, id);
    const deleted = await prisma.workflow.delete({
      where: { id: Number(id), userId }
    });
    logger.info(`Deleted workflow ${id} for user ${userId}`);
    return deleted;
  } catch (err) {
    logger.error('Failed to delete workflow:', err);
    throw new Error('Failed to delete workflow: ' + err.message);
  }
}

// Share or unshare a workflow
export async function setWorkflowShared({ userId, id, isShared }) {
  try {
    await getExistingWorkflow(userId, id);
    const updated = await prisma.workflow.update({
      where: { id: Number(id), userId },
      data: { isShared: !!isShared }
    });
    logger.info(`Set workflow ${id} shared=${!!isShared} for user ${userId}`);
    return updated;
  } catch (err) {
    logger.error('Failed to update workflow sharing:', err);
    throw new Error('Failed to update workflow sharing: ' + err.message);
  }
}
