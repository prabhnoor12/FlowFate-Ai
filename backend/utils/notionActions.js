// Delete a Notion page
export async function deleteNotionPage(userId, pageId, context = {}) {
  logger.info('[Notion] Delete page requested', { userId, pageId, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    // Notion API: set archived true to "delete" a page
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });
    logger.info('[Notion] Page deleted (archived)', { userId, pageId, context });
    logger.info('[Notion] Page deleted (archived)', { userId, pageId, context });
    // Monitoring: log Notion delete event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response;
  } catch (err) {
    logger.error('[Notion] Error deleting page', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}

// Duplicate a Notion page (copy content to new page)
export async function duplicateNotionPage(userId, sourcePageId, newParentId, newTitle, context = {}) {
  logger.info('[Notion] Duplicate page requested', { userId, sourcePageId, newParentId, newTitle, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    // Fetch source page content (basic blocks)
    const blocks = await notion.blocks.children.list({ block_id: sourcePageId });
    // Create new page with copied blocks
    const response = await notion.pages.create({
      parent: { page_id: newParentId },
      properties: {
        title: [{ type: 'text', text: { content: newTitle } }]
      },
      children: blocks.results
    });
    logger.info('[Notion] Page duplicated', { userId, newPageId: response.id, context });
    logger.info('[Notion] Page duplicated', { userId, newPageId: response.id, context });
    // Monitoring: log Notion duplicate event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response;
  } catch (err) {
    logger.error('[Notion] Error duplicating page', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}

// Search Notion pages by title
export async function searchNotionPages(userId, query, context = {}) {
  logger.info('[Notion] Search pages requested', { userId, query, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    const response = await notion.search({
      query,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      filter: { value: 'page', property: 'object' }
    });
    logger.info('[Notion] Search complete', { userId, count: response.results.length, context });
    logger.info('[Notion] Search complete', { userId, count: response.results.length, context });
    // Monitoring: log Notion search event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response.results;
  } catch (err) {
    logger.error('[Notion] Error searching pages', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}
// More Notion actions for async task worker
import { getNotionClientForUser } from '../services/notionService.js';
import logger from './logger.js';

export async function createNotionPage(userId, parentId, title, content, context = {}) {
  logger.info('[Notion] Create page requested', { userId, parentId, title, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    const response = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [{ type: 'text', text: { content: title } }]
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { text: [{ type: 'text', text: { content } }] }
        }
      ]
    });
    // Monitor Notion API rate limits (headers)
    if (response && response.response && response.response.headers) {
      logger.info('[Notion] RateLimit', {
        userId,
        rateLimit: response.response.headers['x-ratelimit-limit'],
        rateLimitRemaining: response.response.headers['x-ratelimit-remaining'],
        rateLimitReset: response.response.headers['x-ratelimit-reset'],
        context
      });
    }
    logger.info('[Notion] Page created', { userId, pageId: response.id, context });
    logger.info('[Notion] Page created', { userId, pageId: response.id, context });
    // Monitoring: log Notion create event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response;
  } catch (err) {
    logger.error('[Notion] Error creating page', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}

export async function updateNotionPage(userId, pageId, properties, context = {}) {
  logger.info('[Notion] Update page requested', { userId, pageId, properties, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    // If Notion token is missing, throw a specific error so the controller can trigger OAuth prompt
    if (!userId || !parentId) {
      const err = new Error('Notion integration not found');
      err.code = 'NOTION_OAUTH_REQUIRED';
      throw err;
    }
    logger.info('[Notion] Page updated', { userId, pageId, context });
    logger.info('[Notion] Page updated', { userId, pageId, context });
    // Monitoring: log Notion update event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response;
  } catch (err) {
    logger.error('[Notion] Error updating page', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}

export async function appendNotionBlock(userId, blockId, content, context = {}) {
  logger.info('[Notion] Append block requested', { userId, blockId, context });
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  try {
    const response = await notion.blocks.children.append({
      block_id: blockId,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { text: [{ type: 'text', text: { content } }] }
        }
      ]
    });
    logger.info('[Notion] Block appended', { userId, blockId, context });
    logger.info('[Notion] Block appended', { userId, blockId, context });
    // Monitoring: log Notion append event, latency, and rate limit
    const latency = response?.responseTimeMs ?? null;
    if (response && response.response && response.response.headers) {
      logger.info({ event: 'NotionRateLimit', userId, limit: response.response.headers['x-ratelimit-limit'], remaining: response.response.headers['x-ratelimit-remaining'], reset: response.response.headers['x-ratelimit-reset'], context });
    }
    return response;
  } catch (err) {
    logger.error('[Notion] Error appending block', { userId, error: err.message, code: err.code, context });
    throw err;
  }
}
