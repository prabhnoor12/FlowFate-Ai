const request = require('supertest');
jest.mock('../services/workflow_service');
const app = require('../app');
const workflowService = require('../services/workflow_service');
const { generateToken } = require('../utils/token');
const { workflows, singleWorkflow } = require('./fixtures/workflows.fixture');

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);

describe('Workflow API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workflows', () => {
    it('should return a list of workflows', async () => {
      workflowService.getWorkflows.mockResolvedValue({ workflows, total: workflows.length });
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.workflows).toHaveLength(workflows.length);
      expect(workflowService.getWorkflows).toHaveBeenCalledWith(user.id, { page: 1, pageSize: 10, search: '' });
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('should return a single workflow', async () => {
      workflowService.getWorkflowById.mockResolvedValue(singleWorkflow);
      const res = await request(app)
        .get(`/api/workflows/${singleWorkflow.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(singleWorkflow);
      expect(workflowService.getWorkflowById).toHaveBeenCalledWith(user.id, String(singleWorkflow.id));
    });
    it('should return 404 if workflow not found', async () => {
      workflowService.getWorkflowById.mockResolvedValue(null);
      const res = await request(app)
        .get('/api/workflows/999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/workflows', () => {
    it('should create a new workflow', async () => {
      workflowService.createWorkflow.mockResolvedValue(singleWorkflow);
      const workflowData = {
        name: singleWorkflow.name,
        description: singleWorkflow.description,
        steps: singleWorkflow.steps,
      };
      const res = await request(app)
        .post('/api/workflows')
        .set('Authorization', `Bearer ${token}`)
        .send(workflowData);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(singleWorkflow);
      expect(workflowService.createWorkflow).toHaveBeenCalledWith(user.id, workflowData);
    });
  });

  describe('PUT /api/workflows/:id', () => {
    it('should update a workflow', async () => {
      workflowService.updateWorkflow.mockResolvedValue(singleWorkflow);
      const workflowData = {
        name: singleWorkflow.name,
        description: singleWorkflow.description,
        steps: singleWorkflow.steps,
      };
      const res = await request(app)
        .put(`/api/workflows/${singleWorkflow.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(workflowData);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(singleWorkflow);
      expect(workflowService.updateWorkflow).toHaveBeenCalledWith(user.id, String(singleWorkflow.id), workflowData);
    });
    it('should return 404 if workflow not found', async () => {
      const error = new Error('Workflow not found');
      error.code = 'P2025';
      workflowService.updateWorkflow.mockRejectedValue(error);
      const workflowData = {
        name: singleWorkflow.name,
        description: singleWorkflow.description,
        steps: singleWorkflow.steps,
      };
      const res = await request(app)
        .put('/api/workflows/999')
        .set('Authorization', `Bearer ${token}`)
        .send(workflowData);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/workflows/:id', () => {
    it('should partially update a workflow', async () => {
      workflowService.patchWorkflow.mockResolvedValue(singleWorkflow);
      const res = await request(app)
        .patch(`/api/workflows/${singleWorkflow.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(singleWorkflow);
      expect(workflowService.patchWorkflow).toHaveBeenCalledWith(user.id, String(singleWorkflow.id), { name: 'Updated Name' });
    });
    it('should return 404 if workflow not found', async () => {
      const error = new Error('Workflow not found');
      error.code = 'P2025';
      workflowService.patchWorkflow.mockRejectedValue(error);
      const res = await request(app)
        .patch('/api/workflows/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/workflows/:id', () => {
    it('should delete a workflow', async () => {
      workflowService.deleteWorkflow.mockResolvedValue();
      const res = await request(app)
        .delete(`/api/workflows/${singleWorkflow.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'Workflow deleted' });
      expect(workflowService.deleteWorkflow).toHaveBeenCalledWith(user.id, String(singleWorkflow.id));
    });
    it('should return 404 if workflow not found', async () => {
      const error = new Error('Workflow not found');
      error.code = 'P2025';
      workflowService.deleteWorkflow.mockRejectedValue(error);
      const res = await request(app)
        .delete('/api/workflows/999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/workflows/:id/duplicate', () => {
    it('should duplicate a workflow', async () => {
      workflowService.duplicateWorkflow.mockResolvedValue(singleWorkflow);
      const res = await request(app)
        .post(`/api/workflows/${singleWorkflow.id}/duplicate`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(singleWorkflow);
      expect(workflowService.duplicateWorkflow).toHaveBeenCalledWith(user.id, String(singleWorkflow.id));
    });
    it('should return 404 if workflow not found', async () => {
      workflowService.duplicateWorkflow.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/workflows/999/duplicate')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
