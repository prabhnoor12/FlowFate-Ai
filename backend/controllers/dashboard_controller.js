// dashboard_controller.js
// Provides endpoints for user dashboard data aggregation and summaries

const dashboardService = require('../services/dashboard_service');
const { AppError } = require('../utils/error_handling');
const logger = require('../utils/logger');

/**
 * Get dashboard summary for the current user
 * Returns counts, recent items, and advanced analytics
 */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await dashboardService.getDashboardSummary(userId);
    res.json(summary);
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
    const timeline = await dashboardService.getActivityTimeline(userId);
    res.json(timeline);
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
    const breakdown = await dashboardService.getUsageBreakdown(userId);
    res.json(breakdown);
  } catch (err) {
    logger.error('Failed to fetch usage breakdown', { error: err });
    next(new AppError('Failed to fetch usage breakdown', 500, err.message));
  }
};
