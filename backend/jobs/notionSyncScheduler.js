// Notion Sync Scheduler: Runs the Notion sync job on a schedule using node-cron
import cron from 'node-cron';
import { runNotionSyncJob } from './notionSyncJob.js';
import logger from '../utils/logger.js';

// Run every 5 minutes (adjust as needed)
cron.schedule('*/5 * * * *', async () => {
  logger.info('[Scheduler] Triggering Notion sync job');
  await runNotionSyncJob();
});

logger.info('[Scheduler] Notion sync scheduler started');
