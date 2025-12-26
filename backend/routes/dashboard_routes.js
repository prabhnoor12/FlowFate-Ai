const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard_controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard summary (stats, recent, analytics)
router.get('/summary', dashboardController.getDashboardSummary);
// Activity timeline (last 30 days)
router.get('/timeline', dashboardController.getActivityTimeline);
// Usage breakdown (last 7 days)
router.get('/usage-breakdown', dashboardController.getUsageBreakdown);

module.exports = router;
