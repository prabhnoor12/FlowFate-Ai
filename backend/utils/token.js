const jwt = require('jsonwebtoken');
const { AppError } = require('./error_handling');

// Secret and options should be set via environment variables for security
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in the token
 * @param {Object} [options] - Optional jwt.sign options
 * @returns {string} JWT token
 */
function generateToken(payload, options = {}) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @param {Object} [options] - Optional jwt.verify options
 * @returns {Object} Decoded payload
 * @throws {AppError} If token is invalid or expired
 */
function verifyToken(token, options = {}) {
	try {
		return jwt.verify(token, JWT_SECRET, options);
	} catch (err) {
		throw new AppError('Invalid or expired token', 401, err.message);
	}
}

/**
 * Middleware to protect routes (Express)
 * Usage: app.use(protectRoute)
 */
function protectRoute(req, res, next) {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies && req.cookies.token) {
		token = req.cookies.token;
	}
	if (!token) {
		return next(new AppError('No token provided', 401));
	}
	try {
		req.user = verifyToken(token);
		next();
	} catch (err) {
		next(err);
	}
}

module.exports = {
	generateToken,
	verifyToken,
	protectRoute
};
