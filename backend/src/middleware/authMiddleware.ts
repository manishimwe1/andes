import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';

/**
 * Middleware for API key authentication
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Missing API key',
        errorCode: 'MISSING_API_KEY'
      });
      return;
    }

    // Validate API key against environment variable
    if (apiKey !== process.env.API_KEY) {
      logger.warn('Invalid API key attempted', {
        apiKey: apiKey.substring(0, 5) + '***'
      });

      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        errorCode: 'INVALID_API_KEY'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('API key authentication error', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Middleware for request ID tracking
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware for logging requests
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
  });

  next();
}

/**
 * Middleware for error handling
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', error, {
    requestId: req.id,
    method: req.method,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    errorCode: 'INTERNAL_ERROR'
  });
}

/**
 * Middleware for handling 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    errorCode: 'NOT_FOUND',
    path: req.path
  });
}

// Add requestId property to Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
