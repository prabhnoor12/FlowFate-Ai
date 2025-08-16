// Job status/health monitoring and alerting for BullMQ jobs
import { QueueEvents } from 'bullmq';
import { redis } from '../config/redis.js';
import logger from '../utils/logger.js';

const queueName = 'main-jobs';
const queueEvents = new QueueEvents(queueName, { connection: redis });

// Listen for failed jobs
queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`[JobMonitor] Job failed: ${jobId}, reason: ${failedReason}`);
  // TODO: Send alert (email, Slack, etc.)
});

// Listen for stalled jobs
queueEvents.on('stalled', ({ jobId }) => {
  logger.warn(`[JobMonitor] Job stalled: ${jobId}`);
  // TODO: Send alert (email, Slack, etc.)
});

// Listen for completed jobs
queueEvents.on('completed', ({ jobId }) => {
  logger.info(`[JobMonitor] Job completed: ${jobId}`);
});

// Monitor queue length periodically
import { Queue } from 'bullmq';
const jobQueue = new Queue(queueName, { connection: redis });

async function monitorQueueLength() {
  const count = await jobQueue.count();
  if (count > 100) {
    logger.warn(`[JobMonitor] Queue length high: ${count}`);
    // TODO: Send alert if needed
  }
}

setInterval(monitorQueueLength, 60000); // Check every minute

// Export for testability
export { queueEvents, monitorQueueLength };
