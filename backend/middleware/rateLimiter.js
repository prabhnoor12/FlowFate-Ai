import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Custom key generator: use user ID if authenticated, else IP
function getKey(req) {
  return req.user?.id || req.ip;
}

// Dynamic max requests based on route (e.g., stricter for /api/auth)
function getMax(req) {
  if (req.originalUrl.startsWith('/api/auth')) return 10; // Stricter for auth
  return 50;
}

// Enhanced rate limiter: logs events, dynamic limits, improved error response
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: (req, res) => getMax(req),
  keyGenerator: getKey,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  handler: (req, res, next, options) => {
    logger.warn(`[RateLimit] Blocked: key=${getKey(req)} path=${req.originalUrl} ip=${req.ip}`);
    res.status(options.statusCode).json({
      status: 'error',
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000),
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      }
    });
  },
  message: undefined // Use handler for custom response
});

export default limiter;
