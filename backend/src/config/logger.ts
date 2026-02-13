import winston, { Logger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0
        ? JSON.stringify(meta, null, 2)
        : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger: Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'crypto-deposit-backend' },
  transports: [
    // Error logs
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // All logs
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0
              ? ` ${JSON.stringify(meta, null, 2)}`
              : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  );
}

export default logger;

// Convenience methods
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
  logger.error(message, { ...errorData, ...meta });
};

export const logWarning = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};
