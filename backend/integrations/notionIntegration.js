/**
 * Create a new Notion page in the user's workspace (for OpenAI function-calling)
 * @param {Object} params
 * @param {string} params.token - The user's Notion integration token
 * @param {string} params.title - The title of the Notion page
 * @param {string} [params.content] - The content/body of the Notion page (optional)
 * @param {Object} [params.customProperties] - Additional Notion properties (e.g., tags, status, priority)
 * @param {Array} [params.blocks] - Array of Notion block objects for rich content
 * @returns {Promise<Object>} - The created Notion page object
 */
export async function createNotionPage({ token, title, content, customProperties = {}, blocks = [] }) {
  const notion = new Client({ auth: token });
  // You may want to fetch a default databaseId from config or user profile
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) throw new Error('No Notion database ID configured');
  // Fetch database properties to validate customProperties
  let dbProperties = {};
  try {
    const notion = new Client({ auth: token });
    const db = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
    dbProperties = db.properties || {};
  } catch (e) {
    console.error('Failed to fetch Notion database properties:', e);
    // Proceed without validation if schema fetch fails
  }

  // Only set custom properties that exist in the database
  const filteredCustomProperties = {};
  const missing = [];
  for (const key of Object.keys(customProperties)) {
    if (dbProperties && key in dbProperties) {
      filteredCustomProperties[key] = customProperties[key];
    } else {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.warn(
      `Notion database is missing the following properties (skipped): ${missing.join(', ')}.`
    );
  }

  const properties = {
    Name: {
      title: [
        {
          text: { content: title }
        }
      ]
    },
    ...filteredCustomProperties
  };
  // Build children blocks: support content, blocks, or both
  let children = [];
  if (Array.isArray(blocks) && blocks.length > 0) {
    children = blocks;
  } else if (content) {
    children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      }
    ];
  }
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      ...(children.length > 0 ? { children } : {})
    });
    return response;
  } catch (error) {
    // Enhanced error logging
    if (error && error.body) {
      console.error('Notion create page error:', error.body);
    } else {
      console.error('Notion create page error:', error);
    }
    throw new Error('Failed to create Notion page: ' + (error && error.message ? error.message : 'Unknown error'));
  }
}
// Handles integration with Notion (ESM)
import { Client } from '@notionhq/client';

/**
 * Sync data to a Notion database
 * @param {Object} params
 * @param {string} params.notionToken - The user's Notion integration token
 * @param {string} params.databaseId - The Notion database ID
 * @param {Object} params.properties - The properties to add/update in the Notion page
 */
export async function syncWithNotion({ notionToken, databaseId, properties }) {
  const notion = new Client({ auth: notionToken });
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
    return { message: 'Synced with Notion', pageId: response.id };
  } catch (error) {
    console.error('Notion sync error:', error);
    throw new Error('Failed to sync with Notion');
  }
}
