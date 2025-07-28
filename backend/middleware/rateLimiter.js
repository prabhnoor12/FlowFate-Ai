import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Custom key generator: use user ID if authenticated, else IP
function getKey(req) {
  return req.user?.id || req.ip;
}

// Enhanced rate limiter: stricter defaults, logs events, customizable per route
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 requests per window per key
  keyGenerator: getKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`[RateLimit] Blocked: key=${getKey(req)} path=${req.originalUrl}`);
    res.status(options.statusCode).json({
      status: 'error',
      error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' }
    });
  },
  message: undefined // Use handler for custom response
});

export default limiter;
