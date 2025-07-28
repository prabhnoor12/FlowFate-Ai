import logger from '../utils/logger.js';
import crypto from 'crypto';

function getTraceId(req) {
  return req.headers['x-trace-id'] || crypto.randomUUID();
}

function getGeoIp(ip) {
  // Stub: integrate with geo-IP service if needed
  return null;
}

export default function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || null;
  const traceId = getTraceId(req);
  const geoIp = getGeoIp(req.ip);
  let reqSize = req.headers['content-length'] || 0;
  let resSize = 0;
  const chunks = [];
  const origWrite = res.write;
  const origEnd = res.end;
  res.write = function(chunk, ...args) {
    chunks.push(chunk);
    origWrite.apply(res, [chunk, ...args]);
  };
  res.end = function(chunk, ...args) {
    if (chunk) chunks.push(chunk);
    origEnd.apply(res, [chunk, ...args]);
  };
  res.on('finish', () => {
    // Only use Buffer.concat if all chunks are Buffer or Uint8Array
    if (chunks.length > 0 && chunks.every(chunk => Buffer.isBuffer(chunk) || chunk instanceof Uint8Array)) {
      resSize = Buffer.concat(chunks).length;
    } else {
      // For string chunks (e.g., static HTML), join and get length
      resSize = chunks.map(chunk => typeof chunk === 'string' ? Buffer.byteLength(chunk, 'utf8') : chunk.length).reduce((a, b) => a + b, 0);
    }
    const duration = Date.now() - start;
    logger.info({
      event: 'Request',
      method: req.method,
      path: req.originalUrl,
      user: req.user?.id,
      requestId,
      traceId,
      ip: req.ip,
      geoIp,
      status: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      reqSize: Number(reqSize),
      resSize
    });
    // Flag suspicious requests (e.g., 401, 403, 429)
    if ([401, 403, 429].includes(res.statusCode)) {
      logger.warn({
        event: 'SuspiciousRequest',
        method: req.method,
        path: req.originalUrl,
        user: req.user?.id,
        requestId,
        traceId,
        ip: req.ip,
        geoIp,
        status: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        reqSize: Number(reqSize),
        resSize
      });
    }
  });
  res.on('error', (err) => {
    logger.error({
      event: 'ResponseError',
      method: req.method,
      path: req.originalUrl,
      user: req.user?.id,
      requestId,
      traceId,
      ip: req.ip,
      geoIp,
      error: err.message
    });
  });
  next();
}
