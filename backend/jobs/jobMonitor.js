// Job status/health monitoring and alerting for BullMQ jobs

import { QueueEvents, Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import logger from '../utils/logger.js';
import { sendMail } from '../utils/mailer.js';

const monitoredQueues = [
  { name: 'main-jobs', alertThreshold: 100 },
  { name: 'todos', alertThreshold: 50 }
];

function sendAlert(subject, message) {
  logger.warn(`[JobMonitor][ALERT] ${subject}: ${message}`);
  // Send email alert (adjust recipient as needed)
  sendMail({
    to: process.env.ALERT_EMAIL || 'admin@example.com',
    subject: `[JobMonitor] ${subject}`,
    text: message
  }).catch(err => logger.error(`[JobMonitor] Failed to send alert email: ${err.message}`));
}

const queueEventsMap = {};
const queueMap = {};
for (const { name } of monitoredQueues) {
  const events = new QueueEvents(name, { connection: redis });
  queueEventsMap[name] = events;
  queueMap[name] = new Queue(name, { connection: redis });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[JobMonitor][${name}] Job failed: ${jobId}, reason: ${failedReason}`);
    sendAlert(`Job failed in ${name}`, `Job ID: ${jobId}\nReason: ${failedReason}`);
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn(`[JobMonitor][${name}] Job stalled: ${jobId}`);
    sendAlert(`Job stalled in ${name}`, `Job ID: ${jobId}`);
  });

  events.on('completed', ({ jobId }) => {
    logger.info(`[JobMonitor][${name}] Job completed: ${jobId}`);
  });
}

async function monitorQueueLength() {
  for (const { name, alertThreshold } of monitoredQueues) {
    try {
      const count = await queueMap[name].count();
      if (count > alertThreshold) {
        logger.warn(`[JobMonitor][${name}] Queue length high: ${count}`);
        sendAlert(`Queue length high in ${name}`, `Current length: ${count}`);
      }
    } catch (err) {
      logger.error(`[JobMonitor][${name}] Failed to check queue length: ${err.message}`);
    }
  }
}

setInterval(monitorQueueLength, 60000); // Check every minute

// Export for testability
export { queueEventsMap, monitorQueueLength };
