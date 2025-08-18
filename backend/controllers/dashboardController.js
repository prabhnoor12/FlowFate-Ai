// backend/controllers/dashboardController.js

import * as workflowService from '../services/workflowService.js';
import * as taskService from '../services/taskService.js';
import * as userService from '../services/userService.js';
import * as reminderService from '../services/reminderService.js';
import * as integrationService from '../services/integrationService.js'; // Assuming this service exists
import sendResponse from '../utils/responseUtil.js';
import logger from '../utils/logger.js';

export async function getDashboard(req, res, next) {
  const start = Date.now();
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, { status: 'error', error: { message: 'Unauthorized' } }, 401);
    }

    // Define limits for fetched data, customizable via query params
    const workflowLimit = Math.min(20, Math.max(1, parseInt(req.query.workflowLimit) || 5));
    const taskLimit = Math.min(20, Math.max(1, parseInt(req.query.taskLimit) || 10));
    const reminderLimit = Math.min(20, Math.max(1, parseInt(req.query.reminderLimit) || 5));
    const activityLimit = Math.min(50, Math.max(1, parseInt(req.query.activityLimit) || 15));

    // Fetch all dashboard data in parallel for performance
    const promises = [
      userService.getUserById(userId),
      workflowService.listWorkflows({ userId, limit: workflowLimit }),
      taskService.listRecentTasks({ userId, limit: taskLimit }),
      reminderService.listReminders({ userId, limit: reminderLimit }),
      // Assuming the following services and methods exist for richer data
      workflowService.getStats({ userId }), // e.g., { total: 10, success: 8, failed: 1, running: 1 }
      taskService.getStats({ userId }),     // e.g., { total: 50, completed: 45, pending: 5 }
      taskService.getCompletionTrend({ userId, days: 7 }), // e.g., [{ date: '2025-08-15', count: 5 }, ...]
      integrationService.checkIntegrationsHealth({ userId }), // e.g., [{ provider: 'slack', status: 'connected' }]
      workflowService.getRecentExecutions({ userId, limit: activityLimit }) // For activity feed
    ];

    const results = await Promise.allSettled(promises);
    
    // Helper to safely extract data from settled promises
    const getResult = (index, defaultValue = null) => 
      results[index].status === 'fulfilled' ? results[index].value : defaultValue;

    const user = getResult(0);
    if (!user) {
      logger.warn(`[Dashboard] User not found: ${userId}`);
      return sendResponse(res, { status: 'error', error: { message: 'User not found' } }, 404);
    }

    const workflows = getResult(1, []);
    const tasks = getResult(2, []);
    const reminders = getResult(3, []);
    // Ensure workflowStats includes running, paused, completed for automations
    let workflowStats = getResult(4, { total: 0, success: 0, failed: 0, running: 0, paused: 0, completed: 0 });
    // If stats are missing, try to infer from available fields
    if (workflowStats) {
      // Map 'success' to 'completed' if not present
      if (workflowStats.completed === undefined && workflowStats.success !== undefined) {
        workflowStats.completed = workflowStats.success;
      }
      // Map 'running' to 'working' if needed (frontend expects running)
      if (workflowStats.running === undefined && workflowStats.working !== undefined) {
        workflowStats.running = workflowStats.working;
      }
      // Default paused to 0 if missing
      if (workflowStats.paused === undefined) {
        workflowStats.paused = 0;
      }
    } else {
      workflowStats = { running: 0, paused: 0, completed: 0 };
    }
    const taskStats = getResult(5, { total: 0, completed: 0, pending: 0 });
    const taskCompletionTrend = getResult(6, []);
    const integrationsHealth = getResult(7, []);
    const recentExecutions = getResult(8, []);

    // Generate alerts from failed workflows and disconnected integrations
    const alerts = [];
    if (workflowStats.failed > 0) {
      alerts.push({
        id: 'failed-workflows',
        type: 'error',
        message: `You have ${workflowStats.failed} workflow(s) that failed recently.`,
        link: '/workflows?status=failed'
      });
    }
    const disconnectedIntegrations = integrationsHealth.filter(int => int.status === 'disconnected');
    if (disconnectedIntegrations.length > 0) {
      alerts.push({
        id: 'disconnected-integrations',
        type: 'warning',
        message: `You have ${disconnectedIntegrations.length} disconnected integration(s).`,
        link: '/integrations'
      });
    }

    // Combine tasks and workflow executions for a unified activity feed
    const activityFeed = [
      ...tasks.map(t => ({ type: 'task_completed', date: t.completedAt, data: t })),
      ...recentExecutions.map(e => ({ type: 'workflow_executed', date: e.executedAt, data: e }))
    ]
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, activityLimit);

    const dashboard = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin || null,
        integrations: user.integrations || [],
      },
      stats: {
        workflows: workflowStats,
        tasks: taskStats,
        reminders: Array.isArray(reminders) ? reminders.length : 0,
        integrations: integrationsHealth.length,
      },
      charts: {
        taskCompletionTrend,
      },
      alerts,
      activityFeed,
      widgets: {
        workflows,
        tasks,
        reminders,
      }
    };

    logger.info(`[Dashboard] Success: userId=${userId}, ms=${Date.now() - start}`);
    sendResponse(res, { status: 'success', data: dashboard });
  } catch (err) {
    logger.error('[Dashboard] Get error', { message: err.message, stack: err.stack });
    sendResponse(res, { status: 'error', error: { message: 'Failed to load dashboard' } }, 500);
    if (next) next(err);
  }
}
