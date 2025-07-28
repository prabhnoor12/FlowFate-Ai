// Configuration settings for FlowMate AI
export default {
  // Add configuration options here
  notionSync: {
    pollingIntervalMs: parseInt(process.env.NOTION_SYNC_POLL_INTERVAL_MS, 10) || 60000, // 1 min default
    maxRetries: parseInt(process.env.NOTION_SYNC_MAX_RETRIES, 10) || 3,
    retryDelayMs: parseInt(process.env.NOTION_SYNC_RETRY_DELAY_MS, 10) || 2000,
    pageSize: parseInt(process.env.NOTION_SYNC_PAGE_SIZE, 10) || 50,
  },
};
