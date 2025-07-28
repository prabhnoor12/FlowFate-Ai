
// Task service for business logic (ESM)
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { parseDate } from '../utils/dateUtil.js';
import { createTaskSchema } from '../validators/taskValidator.js';
const prisma = new PrismaClient();

// List recent tasks for dashboard
export async function listRecentTasks({ userId, limit = 5 }) {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return tasks;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch recent tasks');
  }
}

// Get all tasks with pagination and filtering
export async function getAllTasks({ page = 1, pageSize = 20, userId, status } = {}) {
  try {
    const skip = (page - 1) * pageSize;
    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
    const total = await prisma.task.count({ where });
    logger.info(
      `[TaskService] getAllTasks: userId=${userId}, status=${status}, page=${page}`
    );
    return {
      tasks,
      meta: {
        count: tasks.length,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        total,
      },
    };
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch tasks');
  }
}

// Get a single task by ID
export async function getTaskById(id) {
  try {
    const task = await prisma.task.findUnique({ where: { id: Number(id) } });
    logger.info(`[TaskService] getTaskById: id=${id}`);
    return task;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch task');
  }
}

// Create a new task with validation
export async function createTask({
  title,
  description,
  dueDate,
  aiSummary,
  userId,
}) {
  try {
    const { error: validationError } = createTaskSchema.validate({
      type: title,
      input: description,
    });
    if (validationError) {
      logger.warn(
        `[TaskService] Validation failed: ${validationError.details
          .map((d) => d.message)
          .join(', ')}`
      );
      throw new Error(
        'Validation failed: ' +
          validationError.details.map((d) => d.message).join(', ')
      );
    }
    const parsedDueDate = dueDate ? parseDate(dueDate) : null;
    const task = await prisma.task.create({
      data: { title, description, dueDate: parsedDueDate, aiSummary, userId },
    });
    logger.info(`[TaskService] createTask: userId=${userId}, title=${title}`);
    return task;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to create task');
  }
}

// Update a task
export async function updateTask(id, data) {
  try {
    if (data.dueDate) data.dueDate = parseDate(data.dueDate);
    const task = await prisma.task.update({ where: { id: Number(id) }, data });
    logger.info(`[TaskService] updateTask: id=${id}`);
    return task;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to update task');
  }
}

// Delete a task
export async function deleteTask(id) {
  try {
    const task = await prisma.task.delete({ where: { id: Number(id) } });
    logger.info(`[TaskService] deleteTask: id=${id}`);
    return task;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to delete task');
  }
}

// Advanced filtering: by date range, search, sorting
export async function filterTasks({ userId, status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 20 } = {}) {
  try {
    const skip = (page - 1) * pageSize;
    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = parseDate(startDate);
      if (endDate) where.dueDate.lte = parseDate(endDate);
    }
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize
    });
    const total = await prisma.task.count({ where });
    logger.info(`[TaskService] filterTasks: userId=${userId}, status=${status}, search=${search}, startDate=${startDate}, endDate=${endDate}, sortBy=${sortBy}, sortOrder=${sortOrder}, page=${page}`);
    return { tasks, meta: { count: tasks.length, page, pageSize, totalPages: Math.ceil(total / pageSize), total } };
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to filter tasks');
  }
}

// Business logic: mark task as completed
export async function markTaskCompleted(id) {
  try {
    const task = await prisma.task.update({ where: { id: Number(id) }, data: { status: 'completed', completedAt: new Date() } });
    logger.info(`[TaskService] markTaskCompleted: id=${id}`);
    return task;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to mark task as completed');
  }
}

// Business logic: get overdue tasks
export async function getOverdueTasks({ userId, now = new Date() } = {}) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'completed' },
        dueDate: { lt: now }
      },
      orderBy: { dueDate: 'asc' }
    });
    logger.info(`[TaskService] getOverdueTasks: userId=${userId}`);
    return tasks;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to fetch overdue tasks');
  }
}

// Bulk update tasks status
export async function bulkUpdateTaskStatus(ids, status) {
  try {
    const result = await prisma.task.updateMany({
      where: { id: { in: ids.map(Number) } },
      data: { status }
    });
    logger.info(`[TaskService] bulkUpdateTaskStatus: ids=${ids}, status=${status}`);
    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to bulk update task status');
  }
}
