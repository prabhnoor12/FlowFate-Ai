// Notion API integration layer
import { Client } from '@notionhq/client';
import { decryptToken } from '../utils/tokenCrypto.js';
import axios from 'axios';

import logger from '../utils/logger.js';

/**
 * Poll Notion for changes to a database or page (fallback if webhooks unavailable)
 * @param {string} userId
 * @param {string} resourceId (databaseId or pageId)
 * @param {string} resourceType ('database' | 'page')
 * @param {string} [startCursor]
 * @returns {Promise<object>} Changed objects since last sync
 */
import { getDatabase, getPage, queryDatabase } from '../utils/notionUtil.js';

/**
 * Poll Notion for changes to a database or page (using last_edited_time)
 * Returns changed objects since last sync (for polling-based sync)
 */
export async function pollNotionForChanges(userId, resourceId, resourceType, startCursor = undefined, since = undefined, pageSize = 50) {
  logger.info(`[Sync] Polling Notion for changes`, { userId, resourceId, resourceType, startCursor, since, pageSize });
  let changes = [];
  let nextCursor = null;
  if (resourceType === 'database') {
    // Query all pages in the database, filter by last_edited_time if 'since' provided
    const filter = since ? { property: 'Last edited time', last_edited_time: { after: since } } : {};
    const result = await queryDatabase(userId, resourceId, filter, [], startCursor, pageSize);
    changes = result.results || [];
    nextCursor = result.next_cursor || null;
  } else if (resourceType === 'page') {
    // Get the page and check last_edited_time
    const page = await getPage(userId, resourceId);
    if (!since || new Date(page.last_edited_time) > new Date(since)) {
      changes = [page];
    }
    nextCursor = null;
  } else {
    throw new Error('resourceType must be "database" or "page"');
  }
  return { changes, nextCursor };
}

/**
 * Push local changes to Notion (create/update/delete)
 * @param {string} userId
 * @param {object} changeObj (should include type, data, notionId, etc)
 * @returns {Promise<object>} Notion API response
 */
import {
  createPage,
  updatePage,
  deletePage,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  createBlock,
  updateBlock,
  deleteBlock
} from '../utils/notionUtil.js';

/**
 * Push local changes to Notion (create/update/delete for page, database, block)
 */
export async function pushLocalChangeToNotion(userId, changeObj) {
  logger.info(`[Sync] Pushing local change to Notion`, { userId, changeObj });
  const { type, action, data } = changeObj;
  let result;
  try {
    if (type === 'page') {
      if (action === 'create') result = await createPage(userId, data.parent, data.properties, data.children);
      else if (action === 'update') result = await updatePage(userId, data.pageId, data.properties);
      else if (action === 'delete') result = await deletePage(userId, data.pageId);
      else throw new Error('Unknown page action');
    } else if (type === 'database') {
      if (action === 'create') result = await createDatabase(userId, data.parent, data.title, data.properties);
      else if (action === 'update') result = await updateDatabase(userId, data.databaseId, data.properties);
      else if (action === 'delete') result = await deleteDatabase(userId, data.databaseId);
      else throw new Error('Unknown database action');
    } else if (type === 'block') {
      if (action === 'create') result = await createBlock(userId, data.parentId, data.block);
      else if (action === 'update') result = await updateBlock(userId, data.blockId, data.block);
      else if (action === 'delete') result = await deleteBlock(userId, data.blockId);
      else throw new Error('Unknown block action');
    } else {
      throw new Error('Unknown change type');
    }
    return { success: true, result };
  } catch (err) {
    logger.error(`[Sync] Failed to push local change`, { userId, changeObj, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Resolve conflicts between local and Notion changes
 * @param {object} localObj
 * @param {object} remoteObj
 * @returns {object} Resolved object
 */
/**
 * Resolve conflicts between local and Notion changes
 * Prefer the object with the latest last_edited_time/updated_time
 */
export function resolveSyncConflict(localObj, remoteObj) {
  logger.warn(`[Sync] Conflict detected`, { localObj, remoteObj });
  const localTime = new Date(localObj.last_edited_time || localObj.updated_time || 0);
  const remoteTime = new Date(remoteObj.last_edited_time || remoteObj.updated_time || 0);
  return localTime > remoteTime ? localObj : remoteObj;
}

/**
 * Log sync events for auditing
 * @param {string} userId
 * @param {string} action
 * @param {object} details
 */
export function logSyncEvent(userId, action, details) {
  logger.info(`[Sync] ${action}`, { userId, ...details });
}

/**
 * Get a Notion client for a user by retrieving and decrypting their token from GoFile API
 * @param {string} userId
 * @returns {Promise<Client>} Notion client instance
 */
export async function getNotionClientForUser(userId) {
  // Fetch encrypted token from GoFile API
  const gofileApiUrl = 'https://api.gofile.io/v1/getUser'; // Replace with actual endpoint
  const res = await axios.get(gofileApiUrl, {
    params: { userId, accountId: process.env.GO_ACCOUNT_ID },
    headers: { 'Authorization': `Bearer ${process.env.GO_ACCOUNT_TOKEN}` }
  });
  const encryptedToken = res.data.notionToken;
  const token = decryptToken(encryptedToken);
  return new Client({ auth: token });
}

/**
 * Refresh Notion token if expired (if Notion supports refresh tokens)
 * @param {string} refreshToken
 * @returns {Promise<string>} new access token
 */
export async function refreshNotionToken(refreshToken) {
  // If Notion supports refresh tokens, implement here
  const res = await axios.post('https://api.notion.com/v1/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.NOTION_CLIENT_ID,
    client_secret: process.env.NOTION_CLIENT_SECRET
  }, { headers: { 'Content-Type': 'application/json' } });
  return res.data.access_token;
}
