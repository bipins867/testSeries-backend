import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';
import { logger } from '../logger';
import { config } from '../config';

/**
 * Global error handling middleware.
 * Catches all errors and returns a standardized response.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`${err.statusCode} - ${err.message}`);
  } else {
    logger.error('Unexpected error:', err);
  }

  // Validation errors — include field details
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const sequelizeErr = err as any;
    const errors = sequelizeErr.errors?.map((e: any) => ({
      field: e.path || 'unknown',
      message: e.message || 'Validation failed',
    })) || [];

    res.status(422).json({
      success: false,
      message: 'Validation error',
      errors,
    });
    return;
  }

  // Unknown errors — hide details in production
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(!config.isProduction && { debug: err.message }),
  });
}
