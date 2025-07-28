
import express from 'express';
import { createNotionPage, syncWithNotion } from '../integrations/notionIntegration.js';
import sendResponse from '../utils/responseUtil.js';
import { z } from 'zod';
import {
  queryDatabase,
  getDatabase,
  getPage,
  createBlock
} from '../utils/notionUtil.js';

const router = express.Router();

// Notion webhook endpoint (for future Notion webhook support)
router.post('/webhook', async (req, res) => {
  // Notion will POST events here (when webhooks are available)
  // Log and process the event
  try {
    const event = req.body;
    // TODO: Validate and process event (update local app, trigger sync, etc)
    console.log('[NotionWebhook] Received event:', event);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Zod schemas for validation
const queryDatabaseSchema = z.object({
  userId: z.string().min(1),
  databaseId: z.string().min(1),
  filter: z.record(z.any()).optional(),
  sorts: z.array(z.any()).optional(),
  start_cursor: z.string().optional(),
  page_size: z.number().min(1).max(100).optional(),
  context: z.record(z.any()).optional()
});

const createBlockSchema = z.object({
  userId: z.string().min(1),
  parentId: z.string().min(1),
  block: z.record(z.any()),
  context: z.record(z.any()).optional()
});

// POST /query-database: advanced query with filters, relations, rollups
router.post('/query-database', async (req, res) => {
  try {
    const { userId, databaseId, filter, sorts, start_cursor, page_size, context } = queryDatabaseSchema.parse(req.body);
    const result = await queryDatabase(userId, databaseId, filter, sorts, start_cursor, page_size, context);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /block: create any block type (tables, embeds, media, code, etc)
router.post('/block', async (req, res) => {
  try {
    const { userId, parentId, block, context } = createBlockSchema.parse(req.body);
    const result = await createBlock(userId, parentId, block, context);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /database/:id: retrieve database details
router.get('/database/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const databaseId = req.params.id;
    if (!userId) throw new Error('userId required');
    const result = await getDatabase(userId, databaseId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /page/:id: retrieve page details
router.get('/page/:id', async (req, res) => {
  try {
    const userId = req.query.userId;
    const pageId = req.params.id;
    if (!userId) throw new Error('userId required');
    const result = await getPage(userId, pageId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/notion/create
router.post('/create', async (req, res, next) => {
  const { token, title, content, customProperties, blocks } = req.body;
  if (!token || !title) {
    return sendResponse(res, {
      status: 'error',
      error: { code: 'BAD_REQUEST', message: 'token and title are required' }
    }, 400);
  }
  try {
    const result = await createNotionPage({ token, title, content, customProperties, blocks });
    sendResponse(res, { status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});


// POST /api/notion/sync
router.post('/sync', async (req, res, next) => {
  const { notionToken, databaseId, properties } = req.body;
  if (!notionToken || !databaseId || !properties) {
    return sendResponse(res, {
      status: 'error',
      error: { code: 'BAD_REQUEST', message: 'notionToken, databaseId, and properties are required' }
    }, 400);
  }
  try {
    const result = await syncWithNotion({ notionToken, databaseId, properties });
    sendResponse(res, { status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;



// POST /api/notion/create
router.post('/create', async (req, res, next) => {
  const { token, title, content, customProperties, blocks } = req.body;
  if (!token || !title) {
    return sendResponse(res, {
      status: 'error',
      error: { code: 'BAD_REQUEST', message: 'token and title are required' }
    }, 400);
  }
  try {
    const result = await createNotionPage({ token, title, content, customProperties, blocks });
    sendResponse(res, { status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/notion/sync
router.post('/sync', async (req, res, next) => {
  const { notionToken, databaseId, properties } = req.body;
  if (!notionToken || !databaseId || !properties) {
    return sendResponse(res, {
      status: 'error',
      error: { code: 'BAD_REQUEST', message: 'notionToken, databaseId, and properties are required' }
    }, 400);
  }
  try {
    const result = await syncWithNotion({ notionToken, databaseId, properties });
    sendResponse(res, { status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

