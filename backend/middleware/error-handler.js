/**
 * Error Handling Middleware
 */

const Sentry = require('@sentry/node');

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  // Log error details
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.email
  });

  // Send error to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      user: req.user ? { email: req.user.email } : undefined,
      extra: {
        url: req.url,
        method: req.method
      }
    });
  }

  // Send appropriate error response
  const statusCode = err.statusCode || 500;
  const message = err.userMessage || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, userMessage = null) {
    super(message);
    this.statusCode = statusCode;
    this.userMessage = userMessage || message;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};