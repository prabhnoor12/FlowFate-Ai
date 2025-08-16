// Cleanup job: deletes old logs and stale DB records
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import { addJob } from './jobQueue.js';

const prisma = new PrismaClient();
const LOGS_DIR = path.resolve(process.cwd(), 'logs');
const LOG_RETENTION_DAYS = 14;
const DB_RETENTION_DAYS = 30;

/**
 * Delete log files older than LOG_RETENTION_DAYS
 */
async function cleanupLogs() {
  const files = await fs.readdir(LOGS_DIR);
  const now = Date.now();
  for (const file of files) {
    const filePath = path.join(LOGS_DIR, file);
    const stat = await fs.stat(filePath);
    if (now - stat.mtimeMs > LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000) {
      await fs.unlink(filePath);
      logger.info(`[CleanupJob] Deleted old log: ${file}`);
    }
  }
}

/**
 * Delete DB records older than DB_RETENTION_DAYS
 */
async function cleanupDb() {
  const cutoff = new Date(Date.now() - DB_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  // Example: delete old tasks
  const deleted = await prisma.task.deleteMany({ where: { createdAt: { lt: cutoff } } });
  logger.info(`[CleanupJob] Deleted ${deleted.count} old tasks from DB`);
}

/**
 * Main cleanup job
 */
export async function runCleanupJob() {
  await cleanupLogs();
  await cleanupDb();
  logger.info('[CleanupJob] Cleanup complete');
}

// Schedule this job (example: every day at 2am)
// await addJob('cleanup', {}, { repeat: { cron: '0 2 * * *' } });
