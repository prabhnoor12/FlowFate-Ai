// Enhanced Redis client configuration for FlowFate-AI backend
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://default:l4A1nIzglzrhpyXdVn1HBELQOBtrMx5x@redis-19087.c85.us-east-1-2.ec2.redns.redis-cloud.com:19087';
const redisOptions = {
  maxRetriesPerRequest: null
};

// Support REDIS_PASSWORD env var if present
if (process.env.REDIS_PASSWORD) {
  redisOptions.password = process.env.REDIS_PASSWORD;
}

const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => {
  console.log('[Redis] Connected');
});
redis.on('ready', () => {
  console.log('[Redis] Ready for commands');
});
redis.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...');
});
redis.on('end', () => {
  console.warn('[Redis] Connection closed');
});
redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await redis.quit();
    console.log('[Redis] Connection closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('[Redis] Error during shutdown:', err);
    process.exit(1);
  }
});

// Export a getter for testability
export function getRedisClient() {
  return redis;
}

export default redis;
