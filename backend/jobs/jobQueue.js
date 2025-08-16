// Centralized job queue management using BullMQ
import { Queue, QueueScheduler } from 'bullmq';
import { redis } from '../config/redis.js';

// Create a named queue for background jobs
const jobQueue = new Queue('main-jobs', { connection: redis });
const jobScheduler = new QueueScheduler('main-jobs', { connection: redis });

// Helper to add a job with options (retries, delay, etc.)
export async function addJob(name, data, opts = {}) {
  return jobQueue.add(name, data, opts);
}

// Helper to get queue instance (for workers)
export function getJobQueue() {
  return jobQueue;
}

// Helper to get scheduler instance
export function getJobScheduler() {
  return jobScheduler;
}

// Example usage:
// await addJob('cleanup', { days: 30 }, { attempts: 3, backoff: 60000 });

export default jobQueue;
