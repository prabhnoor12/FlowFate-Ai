import express from 'express';
import {
  createNotionPage, updateNotionPage, appendNotionBlock,
  deleteNotionPage, duplicateNotionPage, searchNotionPages
} from '../utils/notionActions.js';
import { aiTaskQueue } from '../jobs/aitaskworker.js';

const router = express.Router();

// Queue a Notion action as a task
router.post('/queue', async (req, res) => {
  const { type, input } = req.body;
  if (!type || !input) return res.status(400).json({ error: 'type and input required' });
  try {
    const job = await aiTaskQueue.add(type, { ...input, type });
    res.json({ status: 'queued', jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct Notion API endpoints (sync, for admin/testing)
router.post('/create', async (req, res) => {
  const { userId, parentId, title, content } = req.body;
  if (!userId || !parentId || !title) {
    return res.status(400).json({ error: 'userId, parentId, and title are required' });
  }
  try {
    const page = await createNotionPage(userId, parentId, title, content);
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update', async (req, res) => {
  const { userId, pageId, properties } = req.body;
  if (!userId || !pageId || !properties) {
    return res.status(400).json({ error: 'userId, pageId, and properties are required' });
  }
  try {
    const page = await updateNotionPage(userId, pageId, properties);
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/append', async (req, res) => {
  const { userId, blockId, content } = req.body;
  if (!userId || !blockId || !content) {
    return res.status(400).json({ error: 'userId, blockId, and content are required' });
  }
  try {
    const block = await appendNotionBlock(userId, blockId, content);
    res.json(block);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  const { userId, pageId } = req.body;
  if (!userId || !pageId) {
    return res.status(400).json({ error: 'userId and pageId are required' });
  }
  try {
    const result = await deleteNotionPage(userId, pageId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/duplicate', async (req, res) => {
  const { userId, sourcePageId, newParentId, newTitle } = req.body;
  if (!userId || !sourcePageId || !newParentId || !newTitle) {
    return res.status(400).json({ error: 'userId, sourcePageId, newParentId, and newTitle are required' });
  }
  try {
    const result = await duplicateNotionPage(userId, sourcePageId, newParentId, newTitle);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  const { userId, query } = req.query;
  if (!userId || !query) {
    return res.status(400).json({ error: 'userId and query are required' });
  }
  try {
    const results = await searchNotionPages(userId, query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monitor Notion API rate limits and usage
router.get('/monitor', async (req, res) => {
  // Example: If you log rate limit headers in notionActions.js, fetch and report here
  // For now, return a static message and optionally last known headers if available
  const lastRateLimit = global.notionRateLimitHeaders || null;
  res.json({
    message: 'Track Notion API rate limits by logging X-RateLimit headers from API responses.',
    lastRateLimit
  });
});

export default router;
