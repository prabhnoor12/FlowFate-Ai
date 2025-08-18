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
 * Delete log files older than LOG_RETENTION_DAYS, with error handling
 */
async function cleanupLogs() {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const now = Date.now();
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(LOGS_DIR, file);
      try {
        const stat = await fs.stat(filePath);
        if (now - stat.mtimeMs > LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000) {
          await fs.unlink(filePath);
          logger.info(`[CleanupJob] Deleted old log: ${file}`);
          deletedCount++;
        }
      } catch (err) {
        logger.warn(`[CleanupJob] Could not process log file: ${file} - ${err.message}`);
      }
    }
    logger.info(`[CleanupJob] Log cleanup complete. Deleted ${deletedCount} old log files.`);
  } catch (err) {
    logger.error(`[CleanupJob] Failed to clean up logs: ${err.message}`);
  }
}


/**
 * Delete DB records older than DB_RETENTION_DAYS, with error handling and extensibility
 */
async function cleanupDb() {
  const cutoff = new Date(Date.now() - DB_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;
  try {
    // Clean up old tasks
    const deletedTasks = await prisma.task.deleteMany({ where: { createdAt: { lt: cutoff } } });
    logger.info(`[CleanupJob] Deleted ${deletedTasks.count} old tasks from DB`);
    totalDeleted += deletedTasks.count;
  } catch (err) {
    logger.error(`[CleanupJob] Failed to delete old tasks: ${err.message}`);
  }
  try {
    // Clean up old automations (example, adjust field as needed)
    if (prisma.automation) {
      const deletedAutomations = await prisma.automation.deleteMany({ where: { createdAt: { lt: cutoff } } });
      logger.info(`[CleanupJob] Deleted ${deletedAutomations.count} old automations from DB`);
      totalDeleted += deletedAutomations.count;
    }
  } catch (err) {
    logger.error(`[CleanupJob] Failed to delete old automations: ${err.message}`);
  }
  try {
    // Clean up old notifications (example, adjust field as needed)
    if (prisma.notification) {
      const deletedNotifications = await prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });
      logger.info(`[CleanupJob] Deleted ${deletedNotifications.count} old notifications from DB`);
      totalDeleted += deletedNotifications.count;
    }
  } catch (err) {
    logger.error(`[CleanupJob] Failed to delete old notifications: ${err.message}`);
  }
  logger.info(`[CleanupJob] DB cleanup complete. Total records deleted: ${totalDeleted}`);
}


/**
 * Main cleanup job with error handling
 */
export async function runCleanupJob() {
  logger.info('[CleanupJob] Starting cleanup job...');
  try {
    await cleanupLogs();
  } catch (err) {
    logger.error(`[CleanupJob] Log cleanup failed: ${err.message}`);
  }
  try {
    await cleanupDb();
  } catch (err) {
    logger.error(`[CleanupJob] DB cleanup failed: ${err.message}`);
  }
  logger.info('[CleanupJob] Cleanup job finished.');
}

// Schedule this job (example: every day at 2am)
// await addJob('cleanup', {}, { repeat: { cron: '0 2 * * *' } });
