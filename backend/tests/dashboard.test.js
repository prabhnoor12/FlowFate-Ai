const request = require('supertest');
jest.mock('../services/dashboard_service');
const app = require('../app');
const dashboardService = require('../services/dashboard_service');
const { generateToken } = require('../utils/token');
const { automations } = require('./fixtures/automations.fixture');
const { workflows } = require('./fixtures/workflows.fixture');
const { sessions } = require('./fixtures/sessions.fixture');

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);

describe('Dashboard API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return dashboard summary', async () => {
      const summary = {
        stats: { automations: 2, workflows: 2, sessions: 2 },
        recent: {
          automations,
          workflows,
          sessions,
        },
        analytics: {
          mostActiveDay: '2025-12-27',
          mostActiveDayCount: 2,
          avgWorkflowSteps: 1.5,
        },
      };
      dashboardService.getDashboardSummary.mockResolvedValue(summary);
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(summary);
      expect(dashboardService.getDashboardSummary).toHaveBeenCalledWith(user.id);
    });
  });

  describe('GET /api/dashboard/timeline', () => {
    it('should return activity timeline', async () => {
      const timeline = { automations, workflows, sessions };
      dashboardService.getActivityTimeline.mockResolvedValue(timeline);
      const res = await request(app)
        .get('/api/dashboard/timeline')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(timeline);
      expect(dashboardService.getActivityTimeline).toHaveBeenCalledWith(user.id);
    });
  });

  describe('GET /api/dashboard/usage-breakdown', () => {
    it('should return usage breakdown', async () => {
      const breakdown = { automations: 2, workflows: 2 };
      dashboardService.getUsageBreakdown.mockResolvedValue(breakdown);
      const res = await request(app)
        .get('/api/dashboard/usage-breakdown')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(breakdown);
      expect(dashboardService.getUsageBreakdown).toHaveBeenCalledWith(user.id);
    });
  });
});
