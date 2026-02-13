import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '@/config/logger';

/**
 * Validation for address generation request
 */
export const validateAddressGeneration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    userId: Joi.string().required().min(1),
    email: Joi.string().email().required(),
    networks: Joi.array()
      .items(Joi.string().valid('ethereum', 'bsc', 'polygon', 'tron'))
      .min(1)
      .required()
  });

  const { error, value } = schema.validate(req.body, {
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    logger.warn('Validation error', {
      path: req.path,
      errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
    return;
  }

  req.body = value;
  next();
};

/**
 * Validation for address verification request
 */
export const validateAddressVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    address: Joi.string().required().min(1),
    userId: Joi.string().required().min(1),
    network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'tron').required()
  });

  const { error, value } = schema.validate(req.body, {
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
    return;
  }

  req.body = value;
  next();
};

/**
 * Validation for deposit confirmation check
 */
export const validateConfirmationCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    depositId: Joi.string().required(),
    txHash: Joi.string().required(),
    network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'tron').required()
  });

  const { error, value } = schema.validate(req.body, {
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
    return;
  }

  req.body = value;
  next();
};

/**
 * Generic validation middleware factory
 */
export function createValidationMiddleware(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
      return;
    }

    req.body = value;
    next();
  };
}
