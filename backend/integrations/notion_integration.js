// Notion Integration for Automation and Workflows
// This module provides functions to interact with Notion API for reading/writing pages and databases.
// Dependencies: @notionhq/client (install with `npm install @notionhq/client`)


const { Client } = require('@notionhq/client');
const path = require('path');
const logger = require('../utils/logger');

// Initialize Notion client with integration token
if (!process.env.NOTION_API_KEY) {
  logger && logger.error
    ? logger.error('NOTION_API_KEY is not set in environment variables.')
    : console.error('NOTION_API_KEY is not set in environment variables.');
}
const notion = new Client({ auth: process.env.NOTION_API_KEY });


// Retrieve a Notion page by ID
async function getPage(pageId) {
  try {
    return await notion.pages.retrieve({ page_id: pageId });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to retrieve Notion page: ${error.message}`)
      : console.error(`Failed to retrieve Notion page: ${error.message}`);
    throw error;
  }
}


// Query a Notion database
async function queryDatabase(databaseId, filter = {}) {
  try {
    return await notion.databases.query({
      database_id: databaseId,
      ...(filter && Object.keys(filter).length > 0 ? { filter } : {}),
    });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to query Notion database: ${error.message}`)
      : console.error(`Failed to query Notion database: ${error.message}`);
    throw error;
  }
}


// Create a new page in a Notion database
async function createPage(databaseId, properties, children = undefined) {
  try {
    const payload = {
      parent: { database_id: databaseId },
      properties,
    };
    if (children) payload.children = children;
    return await notion.pages.create(payload);
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to create Notion page: ${error.message}`)
      : console.error(`Failed to create Notion page: ${error.message}`);
    throw error;
  }
}


// Update a Notion page
async function updatePage(pageId, properties) {
  try {
    return await notion.pages.update({
      page_id: pageId,
      properties,
    });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to update Notion page: ${error.message}`)
      : console.error(`Failed to update Notion page: ${error.message}`);
    throw error;
  }
}

// Utility: Search for a page by title in a database
async function findPageByTitle(databaseId, title) {
  try {
    const response = await queryDatabase(databaseId, {
      property: 'Name',
      title: {
        equals: title,
      },
    });
    return response.results && response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to find Notion page by title: ${error.message}`)
      : console.error(`Failed to find Notion page by title: ${error.message}`);
    throw error;
  }
}

// Utility: Append blocks to a page (for workflow automation)
async function appendBlocksToPage(pageId, blocks) {
  try {
    return await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    });
  } catch (error) {
    logger && logger.error
      ? logger.error(`Failed to append blocks to Notion page: ${error.message}`)
      : console.error(`Failed to append blocks to Notion page: ${error.message}`);
    throw error;
  }
}

// Example: Add a simple text property to a database page
// properties = {
//   Name: {
//     title: [
//       {
//         text: {
//           content: "Page Title"
//         }
//       }
//     ]
//   }
// }

module.exports = {
  getPage,
  queryDatabase,
  createPage,
  updatePage,
  findPageByTitle,
  appendBlocksToPage,
};
