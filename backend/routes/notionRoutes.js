// --- Notion Link Unfurling ---
// POST /api/notion/unfurl { url }
router.post('/unfurl', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing Notion URL' });
  try {
    // Extract Notion page ID from URL
    const match = url.match(/([0-9a-fA-F]{32})|([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
    if (!match) return res.status(400).json({ error: 'Invalid Notion URL' });
    let pageId = match[0].replace(/-/g, '');
    // Try to get page info (using getPage from notionUtil)
    // For demo, use a default userId (in real app, get from session/auth)
    const userId = req.user?.id || req.body.userId || req.query.userId || 'demo-user';
    const page = await getPage(userId, pageId);
    let title = 'Untitled';
    let snippet = '';
    if (page && page.properties) {
      // Try to extract title from properties
      for (const key in page.properties) {
        const prop = page.properties[key];
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          title = prop.title.map(t => t.plain_text).join(' ');
          break;
        }
      }
      // Try to extract snippet from first paragraph block (optional)
      // (You could use Notion API to fetch children blocks for more detail)
    }
    return res.json({ title, snippet });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unfurl Notion link', details: err.message });
  }
});

// --- Notion Task/Reminder Creation ---
// POST /api/notion/create-task { text }
router.post('/create-task', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing task/reminder text' });
  try {
    // Use OpenAI or simple NLP to extract intent (task/reminder)
    // For now, use a simple heuristic: if text contains 'remind' or 'reminder', treat as reminder
    const isReminder = /remind(er)?/i.test(text);
    // Use a default userId (in real app, get from session/auth)
    const userId = req.user?.id || req.body.userId || req.query.userId || 'demo-user';
    // Use a default Notion database ID (should be dynamic per user in real app)
    const NOTION_TASK_DB = process.env.NOTION_TASK_DB || 'your-database-id';
    // Prepare Notion page properties
    const properties = {
      Name: {
        title: [
          {
            text: { content: text }
          }
        ]
      },
      Status: {
        select: { name: isReminder ? 'Reminder' : 'Task' }
      }
    };
    // Use Notion SDK to create page (via createNotionPage)
    const result = await createNotionPage({
      token: process.env.NOTION_TOKEN,
      title: text,
      customProperties: properties,
      databaseId: NOTION_TASK_DB
    });
    // Return the created page URL
    return res.json({ url: result.url, id: result.id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create Notion task/reminder', details: err.message });
  }
});

// --- Notion Recent Updates Feed ---
// GET /api/notion/recent
router.get('/recent', async (req, res) => {
  try {
    // Use a default userId and databaseId (should be dynamic per user in real app)
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const NOTION_TASK_DB = process.env.NOTION_TASK_DB || 'your-database-id';
    // Query Notion database for recent pages (tasks/notes)
    const result = await queryDatabase(userId, NOTION_TASK_DB, {}, [{ timestamp: 'last_edited_time', direction: 'descending' }], undefined, 5);
    // Map to updates array
    const updates = (result.results || []).map(page => {
      let title = 'Untitled';
      if (page.properties) {
        for (const key in page.properties) {
          const prop = page.properties[key];
          if (prop.type === 'title' && prop.title && prop.title.length > 0) {
            title = prop.title.map(t => t.plain_text).join(' ');
            break;
          }
        }
      }
      return {
        title,
        url: page.url,
        time: page.last_edited_time ? new Date(page.last_edited_time).toLocaleString() : ''
      };
    });
    return res.json({ updates });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch Notion updates', details: err.message });
  }
});

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

