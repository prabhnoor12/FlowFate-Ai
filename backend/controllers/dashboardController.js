// backend/controllers/dashboardController.js

import * as workflowService from '../services/workflowService.js';
import { listRecentTasks } from '../services/taskService.js';
import { getUserById } from '../services/userService.js';
import { listReminders } from '../services/reminderService.js';
import sendResponse from '../utils/responseUtil.js';
import logger from '../utils/logger.js';

export async function getDashboard(req, res, next) {
  const start = Date.now();
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);

    // Allow dashboard customization via query params
    const workflowLimit = Math.min(20, Math.max(1, parseInt(req.query.workflowLimit) || 5));
    const taskLimit = Math.min(20, Math.max(1, parseInt(req.query.taskLimit) || 5));
    const reminderLimit = Math.min(20, Math.max(1, parseInt(req.query.reminderLimit) || 5));

    // Fetch user info (for integrations, etc.)
    const user = await getUserById({ id: userId });
    if (!user) {
      logger.warn(`[Dashboard] User not found: ${userId}`);
      return sendResponse(res, { status: 'error', error: { message: 'User not found' } }, 404);
    }

    // Fetch user workflows
    const workflows = await workflowService.listWorkflows({ userId, limit: workflowLimit });
    // Fetch user tasks
    const tasks = await listRecentTasks({ userId, limit: taskLimit });
    // Fetch reminders (if service exists)
    let reminders = [];
    try {
      reminders = await listReminders({ userId, limit: reminderLimit });
    } catch (e) {
      logger.warn('[Dashboard] Reminders fetch failed', e);
    }

    // Example: notifications and stats (mocked for now)
    const notifications = [
      // { type: 'info', message: 'Welcome to your dashboard!' }
    ];
    const stats = {
      workflowCount: Array.isArray(workflows) ? workflows.length : 0,
      taskCount: Array.isArray(tasks) ? tasks.length : 0,
      reminderCount: Array.isArray(reminders) ? reminders.length : 0,
      lastLogin: user.lastLogin || null
    };

    const dashboard = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        integrations: user.integrations || {},
      },
      workflows,
      tasks,
      reminders,
      notifications,
      stats,
      // Add more widgets as needed
    };

    logger.info(`[Dashboard] Success: userId=${userId}, ms=${Date.now() - start}`);
    sendResponse(res, { status: 'success', data: dashboard });
  } catch (err) {
    logger.error('[Dashboard] Get error', err);
    sendResponse(res, { status: 'error', error: { message: 'Failed to load dashboard', details: err.message } }, 500);
    if (next) next(err);
  }
}
