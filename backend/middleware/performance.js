const logger = require('../utils/logger');

// Performance monitoring middleware
function performanceMiddleware(req, res, next) {
  const start = Date.now();
  
  // Add response time header
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log performance metrics
    logger.performance(`${req.method} ${req.url}`, duration, {
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
}

// Database performance monitoring
function databasePerformanceMiddleware(operation, table) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logger.database(operation, table, {
        duration: `${duration}ms`,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode
      });
    });
    
    next();
  };
}

// Airtable performance monitoring
function airtablePerformanceMiddleware(operation, table) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logger.airtable(operation, table, {
        duration: `${duration}ms`,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode
      });
    });
    
    next();
  };
}

module.exports = {
  performanceMiddleware,
  databasePerformanceMiddleware,
  airtablePerformanceMiddleware
}; 