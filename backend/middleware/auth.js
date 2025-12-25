const { verifyToken } = require('../utils/token');
const { AppError } = require('../utils/error_handling');

/**
 * Middleware to require authentication (JWT)
 * Usage: app.use(authenticate)
 */
function authenticate(req, res, next) {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies && req.cookies.token) {
		token = req.cookies.token;
	}
	if (!token) {
		return next(new AppError('Authentication required', 401));
	}
	try {
		req.user = verifyToken(token);
		next();
	} catch (err) {
		next(new AppError('Invalid or expired token', 401));
	}
}

/**
 * Middleware for role-based access control
 * Usage: app.use(authorize('admin', 'moderator'))
 * @param {...string} roles - Allowed roles
 */
function authorize(...roles) {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return next(new AppError('Forbidden: insufficient permissions', 403));
		}
		next();
	};
}

module.exports = {
	authenticate,
	authorize
};
