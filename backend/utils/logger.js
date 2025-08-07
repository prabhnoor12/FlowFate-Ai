// Winston logger setup
import winston from 'winston';
import 'winston-daily-rotate-file';

const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    fatal: 'red',
    error: 'magenta',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
  }
};


// Determine log file path and format based on environment
const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || 'logs';
const logFilePattern = `${logDir}/app-%DATE%.log`;

const consoleFormat = isProduction
  ? winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaString}`;
      })
    );

const transports = [
  new winston.transports.Console({
    format: consoleFormat
  }),
  new winston.transports.DailyRotateFile({
    filename: logFilePattern,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];


/**
 * Winston logger instance with custom levels, colors, and context support.
 * - Pretty console output in development, JSON in production.
 * - Daily rotating file logs.
 * - Supports context (requestId, traceId, user, etc).
 * - Exposes async flush for graceful shutdown.
 */
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

winston.addColors(customLevels.colors);


/**
 * Returns a logger with context merged into all log calls.
 * @param {object} context - Context to include (e.g., requestId, userId)
 * @returns {object} Logger methods with context
 */
logger.withContext = (context = {}) => {
  // Defensive: always merge meta as object
  const mergeMeta = (meta) => ({ ...context, ...(meta && typeof meta === 'object' ? meta : {}) });
  return {
    info: (msg, meta) => logger.info(msg, mergeMeta(meta)),
    error: (msg, meta) => logger.error(msg, mergeMeta(meta)),
    warn: (msg, meta) => logger.warn(msg, mergeMeta(meta)),
    debug: (msg, meta) => logger.debug(msg, mergeMeta(meta)),
    fatal: (msg, meta) => logger.log('fatal', msg, mergeMeta(meta)),
    http: (msg, meta) => logger.http(msg, mergeMeta(meta))
  };
};

/**
 * Flushes all logger transports (useful for graceful shutdown).
 * @returns {Promise<void>}
 */
logger.flush = async () => {
  // Wait for all transports to finish
  await Promise.all(
    logger.transports.map(t =>
      new Promise(resolve => {
        if (typeof t.flush === 'function') {
          t.flush();
        }
        t.on('finish', resolve);
        t.end();
      })
    )
  );
};

/**
 * Logs an uncaught exception and exits the process.
 */
logger.handleUncaught = () => {
  process.on('uncaughtException', (err) => {
    logger.fatal('Uncaught Exception', { error: err });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal('Unhandled Rejection', { reason });
    process.exit(1);
  });
};


export default logger;
