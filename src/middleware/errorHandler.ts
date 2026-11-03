import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred on the server.';
  let details: any[] = [];

  // Known Application Errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || [];
  }
  // PostgreSQL Database Errors
  else if (err?.code) {
    // 23505: Unique constraint violation
    if (err.code === '23505') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      message = 'A record with these unique details already exists.';
      if (err.detail) details.push(err.detail);
    }
    // 23514: Check constraint violation (e.g., transition state machine or insufficient stock)
    else if (err.code === '23514') {
      statusCode = 422;
      code = 'BUSINESS_RULE_VIOLATION';
      message = err.message || 'The operation violates a business integrity rule.';
      // Clean up PostgreSQL exception prefix if present
      if (message.startsWith('ERROR: ')) {
        message = message.replace(/^ERROR:\s*/, '');
      }
    }
    // 23503: Foreign key violation
    else if (err.code === '23503') {
      statusCode = 400;
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'The operation references a record that does not exist or cannot be removed.';
    }
    // 22P02: Invalid text representation (e.g. invalid UUID format)
    else if (err.code === '22P02') {
      statusCode = 400;
      code = 'INVALID_INPUT_SYNTAX';
      message = 'Invalid format for one or more parameters (e.g. invalid UUID).';
    }
    else {
      logger.error('Unhandled PostgreSQL Error', err);
    }
  }
  // JSON Body Parser Syntax Error
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body.';
  }
  // Unknown generic errors
  else {
    logger.error('Unhandled Application Exception', err);
    if (env.NODE_ENV !== 'production') {
      message = err?.message || message;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 ? { details } : {}),
    },
  });
};
