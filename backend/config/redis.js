// Redis configuration and caching utility
// Dependencies: ioredis (install with `npm install ioredis`)

const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

redis.on('connect', () => {
  logger && logger.info
    ? logger.info('Connected to Redis server.')
    : console.log('Connected to Redis server.');
});
redis.on('error', (err) => {
  logger && logger.error
    ? logger.error(`Redis error: ${err.message}`)
    : console.error(`Redis error: ${err.message}`);
});

// Set cache with optional expiration (in seconds)
async function setCache(key, value, expireSeconds = null) {
  try {
    if (expireSeconds) {
      await redis.set(key, JSON.stringify(value), 'EX', expireSeconds);
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  } catch (err) {
    logger && logger.error
      ? logger.error(`Redis setCache error: ${err.message}`)
      : console.error(`Redis setCache error: ${err.message}`);
    throw err;
  }
}

// Get cache by key
async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger && logger.error
      ? logger.error(`Redis getCache error: ${err.message}`)
      : console.error(`Redis getCache error: ${err.message}`);
    throw err;
  }
}

// Delete cache by key
async function delCache(key) {
  try {
    await redis.del(key);
  } catch (err) {
    logger && logger.error
      ? logger.error(`Redis delCache error: ${err.message}`)
      : console.error(`Redis delCache error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  redis,
  setCache,
  getCache,
  delCache,
};
