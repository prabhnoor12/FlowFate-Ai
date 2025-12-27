const request = require('supertest');
jest.mock('../services/openai_service');
const app = require('../app');
const openaiService = require('../services/openai_service');
const { generateToken } = require('../utils/token');

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);

describe('OpenAI API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/openai/preview', () => {
    it('should preview a prompt', async () => {
      const previewResult = { preview: 'result' };
      openaiService.previewPromptService.mockReturnValue(previewResult);
      const body = { prompt: 'Test prompt', input: 'foo', context: 'bar' };
      const res = await request(app)
        .post('/api/openai/preview')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(previewResult);
      expect(openaiService.previewPromptService).toHaveBeenCalledWith(body);
    });
  });

  describe('GET /api/openai/usage', () => {
    it('should return usage stats', async () => {
      const res = await request(app)
        .get('/api/openai/usage')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('usage');
    });
  });

  describe('POST /api/openai/automation/:automationId/run', () => {
    it('should run an automation', async () => {
      const automationResult = { result: 'automation run' };
      openaiService.runAutomationService.mockResolvedValue(automationResult);
      const body = { input: 'foo', stream: false };
      const res = await request(app)
        .post('/api/openai/automation/123/run')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(automationResult);
      expect(openaiService.runAutomationService).toHaveBeenCalledWith(user.id, '123', body, null);
    });
    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/openai/automation/123/run')
        .set('Authorization', `Bearer ${token}`)
        .send({ stream: 123 }); // invalid type
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/openai/workflow/:workflowId/run', () => {
    it('should run a workflow', async () => {
      const workflowResult = { result: 'workflow run' };
      openaiService.runWorkflowService.mockResolvedValue(workflowResult);
      const body = { input: 'bar' };
      const res = await request(app)
        .post('/api/openai/workflow/456/run')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(workflowResult);
      expect(openaiService.runWorkflowService).toHaveBeenCalledWith(user.id, '456', body);
    });
    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/openai/workflow/456/run')
        .set('Authorization', `Bearer ${token}`)
        .send({ input: 123 }); // invalid type
      expect(res.statusCode).toBe(400);
    });
  });
});
