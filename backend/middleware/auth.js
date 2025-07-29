// Auth middleware for user authentication (ESM)
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import sendResponse from '../utils/responseUtil.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export default auth;

/**
 * Express middleware to authenticate requests using JWT in the Authorization header.
 * Adds user info to req.user if valid, else returns a consistent error response.
 * Supports RBAC and user status checks.
 * Usage: app.use('/api/admin', auth(['admin']));
 */
export function auth(roles = []) {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || null;
    let token;
    // Support token in Authorization header or cookie
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      logger.warn(`[Auth] No token provided. requestId=${requestId} ip=${req.ip}`);
      return sendResponse(res, {
        status: 'error',
        timestamp: new Date().toISOString(),
        requestId,
        error: { code: 'AUTH_TOKEN', message: 'No authentication token provided' }
      }, 401);
    }
    try {
      const user = jwt.verify(token, JWT_SECRET, {
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER
      });
      // User status check
      if (user.status && user.status !== 'active') {
        logger.warn(`[Auth] Inactive or banned user. userId=${user.id} requestId=${requestId}`);
        return sendResponse(res, {
          status: 'error',
          timestamp: new Date().toISOString(),
          requestId,
          error: { code: 'USER_STATUS', message: 'User account is not active' }
        }, 403);
      }
      // RBAC check
      if (roles.length && (!user.role || !roles.includes(user.role))) {
        logger.warn(`[Auth] Forbidden: role=${user.role} required=${roles} userId=${user.id} requestId=${requestId}`);
        return sendResponse(res, {
          status: 'error',
          timestamp: new Date().toISOString(),
          requestId,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
        }, 403);
      }
      req.user = user;
      next();
    } catch (error) {
      logger.warn(`[Auth] Invalid or expired token. requestId=${requestId} error=${error.message}`);
      let message = 'Invalid or expired token';
      let code = 'TOKEN_INVALID';
      if (error.name === 'TokenExpiredError') {
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
      }
      return sendResponse(res, {
        status: 'error',
        timestamp: new Date().toISOString(),
        requestId,
        error: { code, message }
      }, 401);
    }
  };
}
