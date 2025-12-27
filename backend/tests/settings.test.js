const request = require('supertest');
const app = require('../app');
const prisma = require('../prisma/db');
const { generateToken } = require('../utils/token');

jest.mock('../prisma/db', () => ({
  settings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
}));

const user = { id: 1, email: 'test@example.com' };
const token = generateToken(user);
const defaultSettings = { theme: 'light', notifications: true, language: 'en', userId: user.id };
const customSettings = { theme: 'dark', notifications: false, language: 'fr', userId: user.id };

describe('Settings API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return user settings if present', async () => {
      prisma.settings.findUnique.mockResolvedValue(customSettings);
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.settings).toEqual(customSettings);
      expect(prisma.settings.findUnique).toHaveBeenCalledWith({ where: { userId: user.id } });
    });
    it('should create and return default settings if not present', async () => {
      prisma.settings.findUnique.mockResolvedValue(null);
      prisma.settings.create.mockResolvedValue(defaultSettings);
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.settings).toEqual(defaultSettings);
      expect(prisma.settings.create).toHaveBeenCalledWith({ data: { ...defaultSettings } });
    });
  });

  describe('PUT /api/settings', () => {
    it('should update user settings with valid data', async () => {
      prisma.settings.upsert.mockResolvedValue(customSettings);
      const update = { theme: 'dark', notifications: false, language: 'fr' };
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(update);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.settings).toEqual(customSettings);
      expect(prisma.settings.upsert).toHaveBeenCalledWith({
        where: { userId: user.id },
        update,
        create: { userId: user.id, ...defaultSettings, ...update },
      });
    });
    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'invalid' });
      expect(res.statusCode).toBe(400);
    });
    it('should return 400 for empty update', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/settings/reset', () => {
    it('should reset user settings to default', async () => {
      prisma.settings.upsert.mockResolvedValue(defaultSettings);
      const res = await request(app)
        .post('/api/settings/reset')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.settings).toEqual(defaultSettings);
      expect(prisma.settings.upsert).toHaveBeenCalledWith({
        where: { userId: user.id },
        update: { theme: 'light', notifications: true, language: 'en' },
        create: { userId: user.id, ...defaultSettings },
      });
    });
  });
});
