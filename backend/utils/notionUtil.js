

import { getNotionClientForUser } from '../services/notionService.js';
import logger from './logger.js';
import { z } from 'zod';

// Type definitions (JSDoc)
/**
 * @typedef {import('@notionhq/client').Client} NotionClient
 * @typedef {Record<string, any>} NotionProperties
 * @typedef {Record<string, any>} NotionBlock
 * @typedef {Record<string, any>} NotionParent
 */

/**
 * Helper to get Notion client for user or throw a consistent error
 */
const userIdSchema = z.string().min(1, 'User ID required');
const pageIdSchema = z.string().min(1, 'Page ID required');
const databaseIdSchema = z.string().min(1, 'Database ID required');
const blockIdSchema = z.string().min(1, 'Block ID required');
const notionPropertiesSchema = z.record(z.any());
const notionBlockSchema = z.record(z.any());
const notionParentSchema = z.record(z.any());

async function getClientOrThrow(userId) {
  userIdSchema.parse(userId);
  const notion = await getNotionClientForUser(userId);
  if (!notion) throw new Error('Notion connection not found');
  return notion;
}

/**
 * Helper to handle and log Notion errors
 */
function handleNotionError(action, userId, extra, err) {
  logger.error(`[Notion] Error ${action}`, { userId, ...extra, error: err.message, code: err.code });
  if (err.code === 'rate_limited') throw new Error('Notion API rate limit exceeded.');
  if (err.code === 'unauthorized') throw new Error('Notion token invalid or expired.');
  if (err.code === 'object_not_found') throw new Error('Notion workspace or page not found.');
  throw new Error(`Failed to ${action}: ${err.message}`);
}

/**
 * Create a Notion note for a user
 * @param {string} userId
 * @param {string} title
 * @param {string} content
 * @returns {Promise<string>} Success message
 */

/**
 * Create a Notion note for a user
 * @param {string} userId
 * @param {string} title
 * @param {string} content
 * @param {object} context
 * @returns {Promise<string>}
 */
export async function createNoteForUser(userId, title, content, context = {}) {
  userIdSchema.parse(userId);
  z.string().min(1, 'Title required').parse(title);
  z.string().min(1, 'Content required').parse(content);
  logger.info(`[Notion] Create note requested`, { userId, title, context });
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.pages.create({
      parent: { type: 'workspace', workspace: true },
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
    logger.info(`[Notion] Note created`, { userId, title, notionPageId: response.id, context });
    return `Notion note \"${title}\" created.`;
  } catch (err) {
    handleNotionError('creating note', userId, { title, context }, err);
  }
}

/**
 * Create a Notion page
 */
export async function createPage(userId, parent, properties, children = [], context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.pages.create({ parent, properties, children });
    logger.info('[Notion] Page created', { userId, pageId: response.id, context });
    return response;
  } catch (err) {
    handleNotionError('creating page', userId, { context }, err);
  }
}

/**
 * Update a Notion page
 */
export async function updatePage(userId, pageId, properties, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.pages.update({ page_id: pageId, properties });
    logger.info('[Notion] Page updated', { userId, pageId, context });
    return response;
  } catch (err) {
    handleNotionError('updating page', userId, { pageId, context }, err);
  }
}

/**
 * Delete (archive) a Notion page
 */
export async function deletePage(userId, pageId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.pages.update({ page_id: pageId, archived: true });
    logger.info('[Notion] Page archived', { userId, pageId, context });
    return response;
  } catch (err) {
    handleNotionError('archiving page', userId, { pageId, context }, err);
  }
}

/**
 * Retrieve a Notion page
 */
export async function getPage(userId, pageId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.pages.retrieve({ page_id: pageId });
    logger.info('[Notion] Page retrieved', { userId, pageId, context });
    return response;
  } catch (err) {
    handleNotionError('retrieving page', userId, { pageId, context }, err);
  }
}

/**
 * Create a Notion database
 */
export async function createDatabase(userId, parent, title, properties, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.databases.create({
      parent,
      title: [{ type: 'text', text: { content: title } }],
      properties
    });
    logger.info('[Notion] Database created', { userId, databaseId: response.id, context });
    return response;
  } catch (err) {
    handleNotionError('creating database', userId, { context }, err);
  }
}

/**
 * Update a Notion database
 */
export async function updateDatabase(userId, databaseId, properties, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.databases.update({ database_id: databaseId, properties });
    logger.info('[Notion] Database updated', { userId, databaseId, context });
    return response;
  } catch (err) {
    handleNotionError('updating database', userId, { databaseId, context }, err);
  }
}

/**
 * Delete (archive) a Notion database
 */
export async function deleteDatabase(userId, databaseId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.databases.update({ database_id: databaseId, archived: true });
    logger.info('[Notion] Database archived', { userId, databaseId, context });
    return response;
  } catch (err) {
    handleNotionError('archiving database', userId, { databaseId, context }, err);
  }
}

/**
 * Retrieve a Notion database
 */
export async function getDatabase(userId, databaseId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    logger.info('[Notion] Database retrieved', { userId, databaseId, context });
    return response;
  } catch (err) {
    handleNotionError('retrieving database', userId, { databaseId, context }, err);
  }
}

/**
 * Query a Notion database with filters, sorts, and pagination
 */
export async function queryDatabase(userId, databaseId, filter = {}, sorts = [], start_cursor = undefined, page_size = 100, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      start_cursor,
      page_size
    });
    logger.info('[Notion] Database queried', { userId, databaseId, context });
    return response;
  } catch (err) {
    handleNotionError('querying database', userId, { databaseId, context }, err);
  }
}

/**
 * Create or update a Notion block (paragraph, heading, list, table, embed, media, etc)
 */
export async function createBlock(userId, parentId, block, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.blocks.children.append({ block_id: parentId, children: [block] });
    logger.info('[Notion] Block created', { userId, parentId, blockType: block.type, context });
    return response;
  } catch (err) {
    handleNotionError('creating block', userId, { parentId, blockType: block.type, context }, err);
  }
}

export async function updateBlock(userId, blockId, block, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.blocks.update({ block_id: blockId, ...block });
    logger.info('[Notion] Block updated', { userId, blockId, context });
    return response;
  } catch (err) {
    handleNotionError('updating block', userId, { blockId, context }, err);
  }
}

export async function deleteBlock(userId, blockId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.blocks.update({ block_id: blockId, archived: true });
    logger.info('[Notion] Block archived', { userId, blockId, context });
    return response;
  } catch (err) {
    handleNotionError('archiving block', userId, { blockId, context }, err);
  }
}

export async function getBlock(userId, blockId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.blocks.retrieve({ block_id: blockId });
    logger.info('[Notion] Block retrieved', { userId, blockId, context });
    return response;
  } catch (err) {
    handleNotionError('retrieving block', userId, { blockId, context }, err);
  }
}

/**
 * Fetch Notion user info
 */
export async function getUser(userId, notionUserId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.users.retrieve({ user_id: notionUserId });
    logger.info('[Notion] User retrieved', { userId, notionUserId, context });
    return response;
  } catch (err) {
    handleNotionError('retrieving user', userId, { notionUserId, context }, err);
  }
}

/**
 * Update Notion user info (if API allows)
 */
export async function updateUser(userId, notionUserId, properties, context = {}) {
  throw new Error('Notion API does not support updating users');
}

/**
 * Read comments on a Notion page or block
 */
export async function getComments(userId, blockId, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.comments.list({ block_id: blockId });
    logger.info('[Notion] Comments listed', { userId, blockId, context });
    return response;
  } catch (err) {
    handleNotionError('listing comments', userId, { blockId, context }, err);
  }
}

/**
 * Post a comment to a Notion page or block
 */
export async function postComment(userId, blockId, comment, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.comments.create({ parent: { block_id: blockId }, rich_text: [{ type: 'text', text: { content: comment } }] });
    logger.info('[Notion] Comment posted', { userId, blockId, context });
    return response;
  } catch (err) {
    handleNotionError('posting comment', userId, { blockId, context }, err);
  }
}

/**
 * Search across Notion content
 */
export async function searchNotion(userId, query, filter = {}, sort = {}, start_cursor = undefined, page_size = 100, context = {}) {
  const notion = await getClientOrThrow(userId);
  try {
    const response = await notion.search({
      query,
      filter,
      sort,
      start_cursor,
      page_size
    });
    logger.info('[Notion] Search performed', { userId, query, context });
    return response;
  } catch (err) {
    handleNotionError('searching', userId, { query, context }, err);
  }
}
