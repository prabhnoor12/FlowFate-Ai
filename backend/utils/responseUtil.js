import logger from './logger.js';

/**
 * Send a consistent API response with logging and error masking
 * @param {Object} res - Express response object
 * @param {Object} payload - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} [options] - Options: maskError, meta
 */
export default function sendResponse(res, payload, statusCode = 200, options = {}) {
  // Mask sensitive error details in production
  if (payload?.status === 'error' && process.env.NODE_ENV === 'production' && options.maskError !== false) {
    if (payload.error?.details) {
      payload.error.details = 'See logs for details.';
    }
  }
  // Add default structure if missing
  if (!payload.timestamp) payload.timestamp = new Date().toISOString();
  if (!payload.status) payload.status = statusCode < 400 ? 'success' : 'error';
  if (options.meta) payload.meta = options.meta;
  logger.http('API Response', { statusCode, payload });
  res.status(statusCode).json(payload);
}
