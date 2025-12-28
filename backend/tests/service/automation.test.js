const automationService = require('../../services/automation_service');
const prisma = require('../../prisma/db');

jest.mock('../../prisma/db', () => ({
  automation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('automationService', () => {
  const userId = 1;
  const automation = { id: 1, name: 'Test', description: 'desc', workflow: {}, userId };
  const automations = [automation];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAutomationById returns automation', async () => {
    prisma.automation.findFirst.mockResolvedValue(automation);
    const result = await automationService.getAutomationById(userId, 1);
    expect(result).toEqual(automation);
    expect(prisma.automation.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId } });
  });

  it('duplicateAutomation returns new automation', async () => {
    prisma.automation.findFirst.mockResolvedValue(automation);
    prisma.automation.create.mockResolvedValue({ ...automation, id: 2, name: 'Test (Copy)' });
    const result = await automationService.duplicateAutomation(userId, 1);
    expect(result).toEqual({ ...automation, id: 2, name: 'Test (Copy)' });
    expect(prisma.automation.create).toHaveBeenCalledWith({
      data: {
        name: 'Test (Copy)',
        description: 'desc',
        workflow: {},
        userId,
      },
    });
  });

  it('duplicateAutomation returns null if not found', async () => {
    prisma.automation.findFirst.mockResolvedValue(null);
    const result = await automationService.duplicateAutomation(userId, 1);
    expect(result).toBeNull();
  });

  it('getAutomations returns automations and total', async () => {
    prisma.automation.findMany.mockResolvedValue(automations);
    prisma.automation.count.mockResolvedValue(1);
    const result = await automationService.getAutomations(userId, { page: 1, pageSize: 10, search: '' });
    expect(result).toEqual({ automations, total: 1 });
    expect(prisma.automation.findMany).toHaveBeenCalled();
    expect(prisma.automation.count).toHaveBeenCalled();
  });

  it('createAutomation creates and returns automation', async () => {
    prisma.automation.create.mockResolvedValue(automation);
    const result = await automationService.createAutomation(userId, { name: 'Test', description: 'desc', workflow: {} });
    expect(result).toEqual(automation);
    expect(prisma.automation.create).toHaveBeenCalledWith({ data: { name: 'Test', description: 'desc', workflow: {}, userId } });
  });

  it('updateAutomation updates and returns automation', async () => {
    prisma.automation.update.mockResolvedValue(automation);
    const result = await automationService.updateAutomation(userId, 1, { name: 'Test', description: 'desc', workflow: {} });
    expect(result).toEqual(automation);
    expect(prisma.automation.update).toHaveBeenCalledWith({ where: { id: 1, userId }, data: { name: 'Test', description: 'desc', workflow: {} } });
  });

  it('patchAutomation updates and returns automation', async () => {
    prisma.automation.update.mockResolvedValue(automation);
    const result = await automationService.patchAutomation(userId, 1, { name: 'Test' });
    expect(result).toEqual(automation);
    expect(prisma.automation.update).toHaveBeenCalledWith({ where: { id: 1, userId }, data: { name: 'Test' } });
  });

  it('deleteAutomation deletes and returns automation', async () => {
    prisma.automation.delete.mockResolvedValue(automation);
    const result = await automationService.deleteAutomation(userId, 1);
    expect(result).toEqual(automation);
    expect(prisma.automation.delete).toHaveBeenCalledWith({ where: { id: 1, userId } });
  });
});
