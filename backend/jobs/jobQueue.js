
// Centralized, production-grade job queue management using BullMQ
import { Queue, QueueScheduler, QueueEvents } from 'bullmq';
import { redis } from '../config/redis.js';
import logger from '../utils/logger.js';

// Configurable queues
const QUEUE_CONFIGS = {
  'main-jobs': { defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 60000 }, removeOnComplete: 100, removeOnFail: 100 } },
  'todos': { defaultJobOptions: { attempts: 2, backoff: { type: 'fixed', delay: 30000 }, removeOnComplete: 50, removeOnFail: 50 } }
};

const queues = {};
const schedulers = {};
const events = {};

// Create and register all queues, schedulers, and event listeners
for (const [queueName, config] of Object.entries(QUEUE_CONFIGS)) {
  queues[queueName] = new Queue(queueName, { connection: redis, ...config });
  schedulers[queueName] = new QueueScheduler(queueName, { connection: redis });
  events[queueName] = new QueueEvents(queueName, { connection: redis });

  // Event logging
  events[queueName].on('completed', ({ jobId }) => {
    logger.info(`[JobQueue][${queueName}] Job completed: ${jobId}`);
  });
  events[queueName].on('failed', ({ jobId, failedReason }) => {
    logger.error(`[JobQueue][${queueName}] Job failed: ${jobId}, reason: ${failedReason}`);
  });
  events[queueName].on('waiting', ({ jobId }) => {
    logger.info(`[JobQueue][${queueName}] Job waiting: ${jobId}`);
  });
}

// Helper to add a job to any queue
export async function addJob(queueName, name, data, opts = {}) {
  if (!queues[queueName]) throw new Error(`Queue not found: ${queueName}`);
  // Merge default options
  const jobOpts = { ...QUEUE_CONFIGS[queueName].defaultJobOptions, ...opts };
  try {
    const job = await queues[queueName].add(name, data, jobOpts);
    logger.info(`[JobQueue][${queueName}] Job added: ${job.id}, name: ${name}`);
    return job;
  } catch (err) {
    logger.error(`[JobQueue][${queueName}] Failed to add job: ${err.message}`);
    throw err;
  }
}

// Get queue/scheduler/events by name
export function getQueue(queueName = 'main-jobs') {
  return queues[queueName];
}
export function getScheduler(queueName = 'main-jobs') {
  return schedulers[queueName];
}
export function getQueueEvents(queueName = 'main-jobs') {
  return events[queueName];
}

// Graceful shutdown
export async function shutdownQueues() {
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
  for (const scheduler of Object.values(schedulers)) {
    await scheduler.close();
  }
  for (const event of Object.values(events)) {
    await event.close();
  }
  logger.info('[JobQueue] All queues and schedulers shut down.');
}

// Example usage:
// await addJob('main-jobs', 'cleanup', { days: 30 }, { attempts: 3 });

export default queues['main-jobs'];
