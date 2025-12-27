const automationController = require('../controllers/automation_controller');
const automationService = require('../services/automation_service');
const { AppError } = require('../utils/error_handling');
const { automations, singleAutomation } = require('./fixtures/automations.fixture');

jest.mock('../services/automation_service');
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Automation Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAutomations', () => {
    it('should fetch automations and return them with pagination', async () => {
      const serviceResponse = { automations, total: automations.length };
      automationService.getAutomations.mockResolvedValue(serviceResponse);
      req.query = { page: '1', pageSize: '10' };

      await automationController.getAutomations(req, res, next);

      expect(automationService.getAutomations).toHaveBeenCalledWith(1, { page: '1', pageSize: '10', search: '' });
      expect(res.json).toHaveBeenCalledWith({
        automations,
        total: automations.length,
        page: 1,
        pageSize: 10,
      });
    });

    it('should handle errors when fetching automations', async () => {
      const error = new Error('Failed to fetch');
      automationService.getAutomations.mockRejectedValue(error);

      await automationController.getAutomations(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Failed to fetch automations');
    });
  });

  describe('getAutomationById', () => {
    it('should fetch a single automation by ID', async () => {
      automationService.getAutomationById.mockResolvedValue(singleAutomation);
      req.params.id = singleAutomation.id;

      await automationController.getAutomationById(req, res, next);

      expect(automationService.getAutomationById).toHaveBeenCalledWith(1, singleAutomation.id);
      expect(res.json).toHaveBeenCalledWith(singleAutomation);
    });

    it('should return a 404 error if automation is not found', async () => {
      automationService.getAutomationById.mockResolvedValue(null);
      req.params.id = 999;

      await automationController.getAutomationById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Automation not found');
    });
  });

  describe('createAutomation', () => {
    it('should create a new automation', async () => {
      const newAutomation = { name: 'New Automation', description: 'A new one', workflow: {} };
      const createdAutomation = { ...newAutomation, id: 3, userId: 1 };
      automationService.createAutomation.mockResolvedValue(createdAutomation);
      req.body = newAutomation;

      await automationController.createAutomation(req, res, next);

      expect(automationService.createAutomation).toHaveBeenCalledWith(1, newAutomation);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdAutomation);
    });

    it('should return a validation error for invalid data', async () => {
      req.body = { name: 'A' }; // Invalid name

      await automationController.createAutomation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Validation error');
    });
  });

  describe('updateAutomation', () => {
    it('should update an existing automation', async () => {
      const updatedData = { name: 'Updated Name', description: 'Updated desc', workflow: {} };
      const updatedAutomation = { ...singleAutomation, ...updatedData };
      automationService.updateAutomation.mockResolvedValue(updatedAutomation);
      req.params.id = singleAutomation.id;
      req.body = updatedData;

      await automationController.updateAutomation(req, res, next);

      expect(automationService.updateAutomation).toHaveBeenCalledWith(1, singleAutomation.id, updatedData);
      expect(res.json).toHaveBeenCalledWith(updatedAutomation);
    });

    it('should return 404 if automation to update is not found', async () => {
      const error = { code: 'P2025' };
      automationService.updateAutomation.mockRejectedValue(error);
      req.params.id = 999;
      req.body = { name: 'test', workflow: {} };

      await automationController.updateAutomation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('patchAutomation', () => {
    it('should partially update an automation', async () => {
      const patchData = { name: 'Patched Name' };
      const patchedAutomation = { ...singleAutomation, ...patchData };
      automationService.patchAutomation.mockResolvedValue(patchedAutomation);
      req.params.id = singleAutomation.id;
      req.body = patchData;

      await automationController.patchAutomation(req, res, next);

      expect(automationService.patchAutomation).toHaveBeenCalledWith(1, singleAutomation.id, patchData);
      expect(res.json).toHaveBeenCalledWith(patchedAutomation);
    });

    it('should return validation error for invalid patch data', async () => {
        req.body = { name: 'A' }; // Invalid name
        req.params.id = singleAutomation.id;
  
        await automationController.patchAutomation(req, res, next);
  
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('deleteAutomation', () => {
    it('should delete an automation', async () => {
      automationService.deleteAutomation.mockResolvedValue({ message: 'Automation deleted' });
      req.params.id = singleAutomation.id;

      await automationController.deleteAutomation(req, res, next);

      expect(automationService.deleteAutomation).toHaveBeenCalledWith(1, singleAutomation.id);
      expect(res.json).toHaveBeenCalledWith({ message: 'Automation deleted' });
    });

    it('should return 404 if automation to delete is not found', async () => {
        const error = { code: 'P2025' };
        automationService.deleteAutomation.mockRejectedValue(error);
        req.params.id = 999;
  
        await automationController.deleteAutomation(req, res, next);
  
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        expect(next.mock.calls[0][0].statusCode).toBe(404);
      });
  });

  describe('duplicateAutomation', () => {
    it('should duplicate an automation', async () => {
      const duplicated = { ...singleAutomation, id: 3, name: `${singleAutomation.name} (Copy)` };
      automationService.duplicateAutomation.mockResolvedValue(duplicated);
      req.params.id = singleAutomation.id;

      await automationController.duplicateAutomation(req, res, next);

      expect(automationService.duplicateAutomation).toHaveBeenCalledWith(1, singleAutomation.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(duplicated);
    });

    it('should return 404 if automation to duplicate is not found', async () => {
        automationService.duplicateAutomation.mockResolvedValue(null);
        req.params.id = 999;
  
        await automationController.duplicateAutomation(req, res, next);
  
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        expect(next.mock.calls[0][0].statusCode).toBe(404);
      });
  });
});

const prisma = require('../prisma/db');
const {
	getAutomationById,
	duplicateAutomation,
	getAutomations,
	createAutomation,
	updateAutomation,
	patchAutomation,
	deleteAutomation,
} = require('../services/automation_service');

jest.mock('../prisma/db', () => ({
  automation: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Automation Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('getAutomationById should fetch automation by id', async () => {
        prisma.automation.findFirst.mockResolvedValue(singleAutomation);
        const result = await getAutomationById(1, 1);
        expect(result).toEqual(singleAutomation);
        expect(prisma.automation.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
    });

    it('duplicateAutomation should create a copy of an automation', async () => {
        prisma.automation.findFirst.mockResolvedValue(singleAutomation);
        const newCopy = { ...singleAutomation, name: `${singleAutomation.name} (Copy)`};
        prisma.automation.create.mockResolvedValue(newCopy);

        const result = await duplicateAutomation(1, 1);

        expect(prisma.automation.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
        expect(prisma.automation.create).toHaveBeenCalledWith({
            data: {
                name: `${singleAutomation.name} (Copy)`,
                description: singleAutomation.description,
                workflow: singleAutomation.workflow,
                userId: 1,
            }
        });
        expect(result).toEqual(newCopy);
    });

    it('getAutomations should fetch automations with pagination and search', async () => {
        prisma.automation.findMany.mockResolvedValue(automations);
        prisma.automation.count.mockResolvedValue(automations.length);

        const result = await getAutomations(1, { page: 1, pageSize: 10, search: 'Test' });

        expect(prisma.automation.findMany).toHaveBeenCalledWith({
            where: {
                userId: 1,
                OR: [
                    { name: { contains: 'Test', mode: 'insensitive' } },
                    { description: { contains: 'Test', mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 10,
        });
        expect(prisma.automation.count).toHaveBeenCalledWith({
            where: {
                userId: 1,
                OR: [
                    { name: { contains: 'Test', mode: 'insensitive' } },
                    { description: { contains: 'Test', mode: 'insensitive' } },
                ],
            }
        });
        expect(result).toEqual({ automations, total: automations.length });
    });

    it('createAutomation should create a new automation', async () => {
        const data = { name: 'New', workflow: {} };
        prisma.automation.create.mockResolvedValue({ ...data, id: 3, userId: 1 });
        const result = await createAutomation(1, data);
        expect(result).toBeDefined();
        expect(prisma.automation.create).toHaveBeenCalledWith({ data: { ...data, userId: 1 } });
    });

    it('updateAutomation should update an automation', async () => {
        const data = { name: 'Updated' };
        prisma.automation.update.mockResolvedValue({ ...singleAutomation, ...data });
        const result = await updateAutomation(1, 1, data);
        expect(result.name).toBe('Updated');
        expect(prisma.automation.update).toHaveBeenCalledWith({ where: { id: 1, userId: 1 }, data });
    });

    it('patchAutomation should patch an automation', async () => {
        const data = { name: 'Patched' };
        prisma.automation.update.mockResolvedValue({ ...singleAutomation, ...data });
        const result = await patchAutomation(1, 1, data);
        expect(result.name).toBe('Patched');
        expect(prisma.automation.update).toHaveBeenCalledWith({ where: { id: 1, userId: 1 }, data });
    });

    it('deleteAutomation should delete an automation', async () => {
        prisma.automation.delete.mockResolvedValue(singleAutomation);
        await deleteAutomation(1, 1);
        expect(prisma.automation.delete).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
    });
});
