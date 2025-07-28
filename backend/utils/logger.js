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

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
    format: winston.format.json()
  })
];

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});

winston.addColors(customLevels.colors);

// Utility: log with requestId/traceId
logger.withContext = (context = {}) => {
  return {
    info: (msg, meta) => logger.info(msg, { ...context, ...meta }),
    error: (msg, meta) => logger.error(msg, { ...context, ...meta }),
    warn: (msg, meta) => logger.warn(msg, { ...context, ...meta }),
    debug: (msg, meta) => logger.debug(msg, { ...context, ...meta }),
    fatal: (msg, meta) => logger.log('fatal', msg, { ...context, ...meta }),
    http: (msg, meta) => logger.http(msg, { ...context, ...meta })
  };
};

export default logger;
