const request = require('supertest');
jest.mock('openai');
const app = require('../app');
const automationService = require('../services/automation_service');
const { generateToken } = require('../utils/token');
const { automations, singleAutomation } = require('./fixtures/automations.fixture');

jest.mock('../services/automation_service');

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);

describe('Automation API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/automations', () => {
    it('should return a list of automations', async () => {
      automationService.getAutomations.mockResolvedValue({ automations, total: automations.length });

      const res = await request(app)
        .get('/api/automations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.automations).toHaveLength(automations.length);
      expect(automationService.getAutomations).toHaveBeenCalledWith(user.id, { page: 1, pageSize: 10, search: '' });
    });
  });

  describe('GET /api/automations/:id', () => {
    it('should return a single automation', async () => {
      automationService.getAutomationById.mockResolvedValue(singleAutomation);

      const res = await request(app)
        .get(`/api/automations/${singleAutomation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(singleAutomation.name);
      expect(automationService.getAutomationById).toHaveBeenCalledWith(user.id, singleAutomation.id.toString());
    });

    it('should return 404 if automation not found', async () => {
      automationService.getAutomationById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/automations/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/automations', () => {
    it('should create a new automation', async () => {
      const newAutomation = { name: 'New Automation', description: 'A new one', workflow: { nodes: [] } };
      automationService.createAutomation.mockResolvedValue({ id: 3, ...newAutomation, userId: user.id });

      const res = await request(app)
        .post('/api/automations')
        .set('Authorization', `Bearer ${token}`)
        .send(newAutomation);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe(newAutomation.name);
      expect(automationService.createAutomation).toHaveBeenCalledWith(user.id, newAutomation);
    });
  });

  describe('PUT /api/automations/:id', () => {
    it('should update an automation', async () => {
      const updatedAutomation = { name: 'Updated Automation', description: 'Updated', workflow: { nodes: [] } };
      automationService.updateAutomation.mockResolvedValue({ id: singleAutomation.id, ...updatedAutomation, userId: user.id });

      const res = await request(app)
        .put(`/api/automations/${singleAutomation.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedAutomation);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(updatedAutomation.name);
      expect(automationService.updateAutomation).toHaveBeenCalledWith(user.id, singleAutomation.id.toString(), updatedAutomation);
    });
  });

  describe('PATCH /api/automations/:id', () => {
    it('should partially update an automation', async () => {
      const patchData = { name: 'Patched Automation' };
      automationService.patchAutomation.mockResolvedValue({ ...singleAutomation, ...patchData });

      const res = await request(app)
        .patch(`/api/automations/${singleAutomation.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(patchData.name);
      expect(automationService.patchAutomation).toHaveBeenCalledWith(user.id, singleAutomation.id.toString(), patchData);
    });
  });

  describe('DELETE /api/automations/:id', () => {
    it('should delete an automation', async () => {
      automationService.deleteAutomation.mockResolvedValue();

      const res = await request(app)
        .delete(`/api/automations/${singleAutomation.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Automation deleted');
      expect(automationService.deleteAutomation).toHaveBeenCalledWith(user.id, singleAutomation.id.toString());
    });
  });

  describe('POST /api/automations/:id/duplicate', () => {
    it('should duplicate an automation', async () => {
      const duplicatedAutomation = { ...singleAutomation, id: 3, name: `${singleAutomation.name} (Copy)` };
      automationService.duplicateAutomation.mockResolvedValue(duplicatedAutomation);

      const res = await request(app)
        .post(`/api/automations/${singleAutomation.id}/duplicate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe(duplicatedAutomation.name);
      expect(automationService.duplicateAutomation).toHaveBeenCalledWith(user.id, singleAutomation.id.toString());
    });
  });
});
