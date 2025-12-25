// Use Winston for logging
const winston = require('winston');

const logger = winston.createLogger({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			)
		})
	]
});

// Enhanced Custom Error class for application-specific errors
class AppError extends Error {
	constructor(message, statusCode, details = null) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

// Improved Express error-handling middleware
function errorHandler(err, req, res, next) {
	let { statusCode, message, details } = err;
	statusCode = statusCode || 500;
	message = message || 'Internal Server Error';
	details = details || null;

	// Winston logging
	logger.error('[Error]', {
		message,
		statusCode,
		stack: err.stack,
		details,
		url: req.originalUrl,
		method: req.method,
		time: new Date().toISOString()
	});

	// Hide stack trace and details in production
	const response = {
		status: err.status || 'error',
		message
	};
	if (details && process.env.NODE_ENV !== 'production') {
		response.details = details;
	}
	if (process.env.NODE_ENV !== 'production') {
		response.stack = err.stack;
	}

	res.status(statusCode).json(response);
}

// Utility to catch async errors in routes (with type check)
const catchAsync = fn => {
	if (typeof fn !== 'function') throw new TypeError('catchAsync expects a function');
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

// Utility to handle uncaught exceptions and unhandled rejections
function setupGlobalErrorHandlers() {
	process.on('uncaughtException', err => {
		logger.error('Uncaught Exception:', err);
		process.exit(1);
	});
	process.on('unhandledRejection', err => {
		logger.error('Unhandled Rejection:', err);
		process.exit(1);
	});
}

module.exports = {
	AppError,
	errorHandler,
	catchAsync,
	setupGlobalErrorHandlers,
	logger
};
