/**
 * Middleware for handling errors across the application
 */

// Error handler for 404 - Not Found
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });
  
  // Handle specific error types
  let message = err.message;
  let errors = null;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErrors = {};
    Object.keys(err.errors).forEach(key => {
      validationErrors[key] = err.errors[key].message;
    });
    errors = validationErrors;
    message = 'Validation failed';
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists. Please use a different value.`;
  }
  
  // Mongoose cast error
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors are handled in auth middleware, but just in case
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  notFound,
  errorHandler
};
