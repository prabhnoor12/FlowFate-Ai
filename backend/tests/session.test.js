const request = require('supertest');
jest.mock('../services/session_service');
const app = require('../app');
const sessionService = require('../services/session_service');
const { generateToken } = require('../utils/token');
const { sessions, singleSession } = require('./fixtures/sessions.fixture');

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);

// Fixtures for session tokens
const sessionToken = 'mocked-session-token';

describe('Session API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      sessionService.createSessionService.mockResolvedValue({ session: singleSession, sessionToken });
      const res = await request(app)
        .post('/api/sessions')
        .send({ userId: user.id, userAgent: 'test-agent' });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.session).toEqual(singleSession);
      expect(res.body.data.sessionToken).toBe(sessionToken);
      expect(sessionService.createSessionService).toHaveBeenCalledWith({ userId: user.id, userAgent: 'test-agent' });
    });
  });

  describe('POST /api/sessions/validate', () => {
    it('should validate a session', async () => {
      sessionService.validateSessionService.mockResolvedValue({ session: singleSession });
      const res = await request(app)
        .post('/api/sessions/validate')
        .send({ sessionToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.session).toEqual(singleSession);
      expect(sessionService.validateSessionService).toHaveBeenCalledWith({ sessionToken });
    });
  });

  describe('POST /api/sessions/revoke', () => {
    it('should revoke a session', async () => {
      sessionService.revokeSessionService.mockResolvedValue(true);
      const res = await request(app)
        .post('/api/sessions/revoke')
        .send({ sessionId: singleSession.id });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Session revoked');
      expect(sessionService.revokeSessionService).toHaveBeenCalledWith({ sessionId: singleSession.id });
    });
  });

  describe('POST /api/sessions/list', () => {
    it('should list all sessions for a user', async () => {
      sessionService.listSessionsService.mockResolvedValue({ sessions });
      const res = await request(app)
        .post('/api/sessions/list')
        .send({ userId: user.id });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.sessions).toEqual(sessions);
      expect(sessionService.listSessionsService).toHaveBeenCalledWith({ userId: user.id });
    });
  });

  describe('POST /api/sessions/revoke-all', () => {
    it('should revoke all sessions for a user', async () => {
      sessionService.revokeAllSessionsService.mockResolvedValue(true);
      const res = await request(app)
        .post('/api/sessions/revoke-all')
        .send({ userId: user.id });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('All sessions revoked');
      expect(sessionService.revokeAllSessionsService).toHaveBeenCalledWith({ userId: user.id });
    });
  });
});
