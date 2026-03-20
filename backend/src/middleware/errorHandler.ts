import { Request, Response, NextFunction } from 'express';
import { errorEmitter } from '../utils/errorEmitter';

export interface AppError extends Error {
  statusCode?: number;
  errorName?: string;
  isOperational?: boolean;
}

/**
 * Create a custom error with status code
 */
export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.errorName = getErrorName(statusCode);
  error.isOperational = true;
  return error;
};

/**
 * Return the error name based on the status code
 */
const getErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    default: return 'Error';
  }
};

/**
 * Handler for unhandled errors
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle unhandled promise rejections
  // Process is a native Node.js EventEmitter that emits events related to the running process
  // Register a listener for the 'unhandledRejection' event, which is emitted when a Promise is rejected without an error handler
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = new Error(`Unhandled Rejection: ${reason}`);
    errorEmitter.emitCriticalError(error, {
      path: 'global',
      method: 'unhandledRejection'
    });
    
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Graceful shutdown
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    errorEmitter.emitCriticalError(error, {
      path: 'global',
      method: 'uncaughtException'
    });
    
    console.error('Uncaught Exception:', error);
    // Graceful shutdown
    process.exit(1);
  });
};

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Main error handler middleware
 */
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Specific error handling
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low';
  
  const errorContext = {
    userId: req.user?.userId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    severity: severity as 'low' | 'medium' | 'high'
  };

  errorEmitter.emitError(err, errorContext);

  // Response
  const response: any = {
    error: getErrorName(statusCode),
    message: message,
    details: {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  };

  // Add request ID if present
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(response);
};

/**
 * Wrapper for async functions that automatically catches errors
 * Returns a middleware that forwards errors to next(err)
 */
export const asyncHandler = (fn: Function) => {
  // Returns a middleware that handles errors
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
