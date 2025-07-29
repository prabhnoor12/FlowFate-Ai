import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';


function normalizeError(err) {
  if (!err || typeof err !== 'object') {
    return { code: 'INTERNAL_ERROR', message: String(err) };
  }
  return {
    code: err.code || err.name || 'INTERNAL_ERROR',
    message: err.message || 'Internal Server Error',
    stack: err.stack,
    ...err
  };
}

function errorHandler(err, req, res, next) {
  // Normalize error and log with context
  const errorObj = normalizeError(err);
  logger.error({
    ...errorObj,
    method: req.method,
    path: req.originalUrl,
    user: req.user?.id,
    requestId: req.headers['x-request-id'] || null,
    ip: req.ip
  });
  if (res.headersSent) {
    return next(err);
  }
  const status = errorObj.statusCode || errorObj.status || 500;
  const requestId = req.headers['x-request-id'] || null;
  const showDetails = process.env.NODE_ENV === 'development';
  sendResponse(res, {
    status: 'error',
    timestamp: new Date().toISOString(),
    requestId,
    error: {
      code: errorObj.code || 'INTERNAL_ERROR',
      message: errorObj.message || 'Internal Server Error',
      details: showDetails ? errorObj.stack : undefined
    }
  }, status);
}

export default errorHandler;
