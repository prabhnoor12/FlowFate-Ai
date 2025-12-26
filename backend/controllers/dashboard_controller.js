// dashboard_controller.js
// Provides endpoints for user dashboard data aggregation and summaries

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');

/**
 * Get dashboard summary for the current user
 * Returns counts, recent items, and advanced analytics
 */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Fetch counts and recent items in parallel
    const [automationCount, workflowCount, sessionCount, recentAutomations, recentWorkflows, recentSessions, allAutomations, allWorkflows] = await Promise.all([
      prisma.automation.count({ where: { userId } }),
      prisma.workflow.count({ where: { userId } }),
      prisma.session.count({ where: { userId } }),
      prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.workflow.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.session.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.automation.findMany({ where: { userId } }),
      prisma.workflow.findMany({ where: { userId } }),
    ]);

    // Advanced Analytics 1: Most active day (by automation/workflow creation)
    const allItems = [...allAutomations, ...allWorkflows];
    const dayCounts = allItems.reduce((acc, item) => {
      const day = item.createdAt.toISOString().slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    let mostActiveDay = null;
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxCount) {
        mostActiveDay = day;
        maxCount = count;
      }
    }

    // Advanced Analytics 2: Average number of steps per workflow
    let avgSteps = 0;
    if (allWorkflows.length > 0) {
      const totalSteps = allWorkflows.reduce((sum, w) => sum + (Array.isArray(w.steps) ? w.steps.length : 0), 0);
      avgSteps = totalSteps / allWorkflows.length;
    }

    res.json({
      stats: {
        automations: automationCount,
        workflows: workflowCount,
        sessions: sessionCount,
      },
      recent: {
        automations: recentAutomations,
        workflows: recentWorkflows,
        sessions: recentSessions,
      },
      analytics: {
        mostActiveDay,
        mostActiveDayCount: maxCount,
        avgWorkflowSteps: avgSteps,
      },
    });
  } catch (err) {
    logger.error('Failed to fetch dashboard summary', { error: err });
    next(new AppError('Failed to fetch dashboard summary', 500, err.message));
  }
};

/**
 * Get activity timeline for the user (last 30 days)
 */
exports.getActivityTimeline = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    // Fetch recent automations, workflows, and sessions
    const [automations, workflows, sessions] = await Promise.all([
      prisma.automation.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
      prisma.workflow.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
      prisma.session.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
    ]);
    // Merge and sort by createdAt
    const timeline = [...automations.map(a => ({ type: 'automation', ...a })),
      ...workflows.map(w => ({ type: 'workflow', ...w })),
      ...sessions.map(s => ({ type: 'session', ...s }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ timeline });
  } catch (err) {
    logger.error('Failed to fetch activity timeline', { error: err });
    next(new AppError('Failed to fetch activity timeline', 500, err.message));
  }
};

/**
 * Get usage breakdown for automations and workflows
 */
exports.getUsageBreakdown = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Example: count automations/workflows created per day for last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const automations = await prisma.automation.findMany({ where: { userId, createdAt: { gte: since } } });
    const workflows = await prisma.workflow.findMany({ where: { userId, createdAt: { gte: since } } });
    // Group by day
    const groupByDay = (items) => {
      return items.reduce((acc, item) => {
        const day = item.createdAt.toISOString().slice(0, 10);
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
    };
    res.json({
      automations: groupByDay(automations),
      workflows: groupByDay(workflows),
    });
  } catch (err) {
    logger.error('Failed to fetch usage breakdown', { error: err });
    next(new AppError('Failed to fetch usage breakdown', 500, err.message));
  }
};
