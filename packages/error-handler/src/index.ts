/**
 * @aether/error-handler - Error Handling Middleware
 * 
 * Provides centralized error handling middleware for Express applications.
 * Catches and formats errors consistently.
 */

export interface ErrorHandlerConfig {
  logErrors?: boolean;
  sendStack?: boolean;
  customHandlers?: Record<string, (error: any, req: any, res: any) => void>;
  defaultHandler?: (error: any, req: any, res: any) => void;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export function errorHandler(config: ErrorHandlerConfig = {}) {
  const {
    logErrors = true,
    sendStack = process.env.NODE_ENV === 'development',
    customHandlers = {},
    defaultHandler
  } = config;

  return function (error: any, req: any, res: any, next: any) {
    // Log error
    if (logErrors) {
      console.error('Error:', error);
    }

    // Check for custom handler
    const customHandler = customHandlers[error.name] || customHandlers[error.constructor.name];
    if (customHandler) {
      return customHandler(error, req, res);
    }

    // Use default handler if provided
    if (defaultHandler) {
      return defaultHandler(error, req, res);
    }

    // Default error handling
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    const response: any = {
      error: {
        message,
        status: statusCode
      }
    };

    // Add stack trace in development
    if (sendStack && error.stack) {
      response.error.stack = error.stack;
    }

    // Add validation errors if present
    if (error.errors) {
      response.error.errors = error.errors;
    }

    res.status(statusCode).json(response);
  };
}

// Async error wrapper
export function asyncHandler(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Pre-configured error handlers
export const standardErrorHandler = errorHandler({
  logErrors: true,
  sendStack: false
});

export const developmentErrorHandler = errorHandler({
  logErrors: true,
  sendStack: true
});