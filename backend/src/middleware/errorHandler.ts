import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom API error class with status code and optional details.
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Enterprise Global Error Handler Middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled Custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // 2. Zod Schema Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // 3. Prisma Unique Constraint
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target || 'field';
    res.status(409).json({
      error: `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`,
    });
    return;
  }

  // 4. Prisma Record Not Found
  if ((err as any).code === 'P2025') {
    res.status(404).json({
      error: 'The requested resource could not be found.',
    });
    return;
  }

  console.error('💥 Unhandled Server Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error occurred while processing your request.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
