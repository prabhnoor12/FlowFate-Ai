// backend/controllers/dashboardController.js
import * as workflowService from '../services/workflowService.js';
import { listRecentTasks } from '../services/taskService.js';
import { getUserById } from '../services/userService.js';
import sendResponse from '../utils/responseUtil.js';
import logger from '../utils/logger.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);

    // Fetch user workflows
    const workflows = await workflowService.listWorkflows({ userId });
    // Fetch user tasks (limit to recent 5)
    const tasks = await listRecentTasks({ userId, limit: 5 });
    // Fetch user info (for integrations, etc.)
    const user = await getUserById({ id: userId });

    // Example: Add more dashboard widgets as needed
    const dashboard = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        integrations: user.integrations || {},
      },
      workflows,
      tasks,
      // Add reminders, notifications, stats, etc. here
    };

    sendResponse(res, { status: 'success', data: dashboard });
  } catch (err) {
    logger.error('[Dashboard] Get error', err);
    next(err);
  }
}
