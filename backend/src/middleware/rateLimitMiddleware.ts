import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '@/config/logger';

/**
 * Rate limiter for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter for address generation endpoints
 */
export const addressGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: 'Too many address generation requests',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if available, otherwise by IP
    return (req.body.userId || req.ip) as string;
  }
});

/**
 * Rate limiter for deposit checking
 */
export const depositCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  skip: (req: Request) => {
    // Skip rate limiting for admin requests
    return req.headers['x-admin'] === 'true';
  }
});

/**
 * Rate limiter for login attempts
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});
