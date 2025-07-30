/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false, // Disable trust proxy validation for Railway
  }
});

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimiting.authWindowMs,
  max: config.rateLimiting.authMaxRequests,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: {
    trustProxy: false, // Disable trust proxy validation for Railway
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};