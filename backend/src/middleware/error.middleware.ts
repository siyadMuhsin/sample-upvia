import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.util';
import { sendError } from '../utils/response.util';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    sendError(res, `A record with this ${field} already exists.`, 409, 'DUPLICATE_KEY');
    return;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 'Database validation error', 400, 'MONGOOSE_VALIDATION', errors);
    return;
  }

  console.error('[Unhandled Error]:', err);
  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
