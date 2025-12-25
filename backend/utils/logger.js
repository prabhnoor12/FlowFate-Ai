const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label', 'stack'] }),
	winston.format.printf(({ timestamp, level, message, stack, metadata }) => {
		let msg = `[${timestamp}] ${level}: ${message}`;
		if (stack) msg += `\n${stack}`;
		if (metadata && Object.keys(metadata).length) msg += `\nMeta: ${JSON.stringify(metadata)}`;
		return msg;
	})
);

// Set up transports based on environment
const transports = [];
if (process.env.NODE_ENV !== 'production') {
	transports.push(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				logFormat
			)
		})
	);
} else {
	transports.push(
		new DailyRotateFile({
			filename: path.join(__dirname, '../logs', 'app-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			level: 'info',
			format: logFormat
		}),
		new DailyRotateFile({
			filename: path.join(__dirname, '../logs', 'error-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '30d',
			level: 'error',
			format: logFormat
		})
	);
}

// Create logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
	format: logFormat,
	transports,
	exceptionHandlers: [
		new winston.transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') })
	],
	rejectionHandlers: [
		new winston.transports.File({ filename: path.join(__dirname, '../logs/rejections.log') })
	]
});

// Stream for morgan HTTP request logging
logger.stream = {
	write: (message) => logger.info(message.trim())
};

module.exports = logger;
