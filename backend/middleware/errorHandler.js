import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';

function errorHandler(err, req, res, next) {
  // Log request context for traceability
  logger.error({
    error: err,
    method: req.method,
    path: req.originalUrl,
    user: req.user?.id,
    requestId: req.headers['x-request-id'] || null,
    ip: req.ip
  });
  if (res.headersSent) {
    return next(err);
  }
  const status = err.statusCode || err.status || 500;
  const requestId = req.headers['x-request-id'] || null;
  // Mask sensitive details in production
  const showDetails = process.env.NODE_ENV === 'development';
  sendResponse(res, {
    status: 'error',
    timestamp: new Date().toISOString(),
    requestId,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal Server Error',
      details: showDetails ? err.stack : undefined
    }
  }, status);
}

export default errorHandler;
