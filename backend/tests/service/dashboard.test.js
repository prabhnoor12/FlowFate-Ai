const dashboardService = require('../../services/dashboard_service');
const prisma = require('../../prisma/db');

jest.mock('../../prisma/db', () => ({
  automation: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  workflow: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  session: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
}));

describe('dashboardService', () => {
  const userId = 1;
  const automation = { id: 1, name: 'A', createdAt: new Date(), steps: [] };
  const workflow = { id: 2, name: 'W', createdAt: new Date(), steps: [{}, {}] };
  const session = { id: 3, name: 'S', createdAt: new Date() };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getDashboardSummary returns correct summary', async () => {
    prisma.automation.count.mockResolvedValue(1);
    prisma.workflow.count.mockResolvedValue(1);
    prisma.session.count.mockResolvedValue(1);
    prisma.automation.findMany.mockResolvedValueOnce([automation]) // recentAutomations
      .mockResolvedValueOnce([]) // allAutomations for analytics
      .mockResolvedValueOnce([automation]); // allAutomations for allItems
    prisma.workflow.findMany.mockResolvedValueOnce([workflow]) // recentWorkflows
      .mockResolvedValueOnce([]) // allWorkflows for analytics
      .mockResolvedValueOnce([workflow]); // allWorkflows for allItems
    prisma.session.findMany.mockResolvedValue([session]);

    const result = await dashboardService.getDashboardSummary(userId);
    expect(result.stats.automations).toBe(1);
    expect(result.stats.workflows).toBe(1);
    expect(result.stats.sessions).toBe(1);
    expect(result.recent.automations).toEqual([automation]);
    expect(result.recent.workflows).toEqual([workflow]);
    expect(result.recent.sessions).toEqual([session]);
    expect(result.analytics).toHaveProperty('mostActiveDay');
    expect(result.analytics).toHaveProperty('mostActiveDayCount');
    expect(result.analytics).toHaveProperty('avgWorkflowSteps');
  });

  it('getActivityTimeline returns timeline', async () => {
    prisma.automation.findMany.mockResolvedValue([automation]);
    prisma.workflow.findMany.mockResolvedValue([workflow]);
    prisma.session.findMany.mockResolvedValue([session]);
    const result = await dashboardService.getActivityTimeline(userId);
    expect(result.timeline).toBeInstanceOf(Array);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it('getUsageBreakdown returns grouped usage', async () => {
    prisma.automation.findMany.mockResolvedValue([automation]);
    prisma.workflow.findMany.mockResolvedValue([workflow]);
    const result = await dashboardService.getUsageBreakdown(userId);
    expect(result.automations).toBeInstanceOf(Object);
    expect(result.workflows).toBeInstanceOf(Object);
  });
});
