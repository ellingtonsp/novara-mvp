const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: 'novara-api',
      environment: process.env.NODE_ENV || 'development'
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { 
    service: 'novara-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    }),
    
    // File transport for errors
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add request logging middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper functions for different log levels
logger.startup = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'startup' });
};

logger.request = (req, message, meta = {}) => {
  logger.info(message, {
    ...meta,
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

logger.response = (req, res, message, meta = {}) => {
  logger.info(message, {
    ...meta,
    type: 'response',
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: res.get('X-Response-Time')
  });
};

logger.error = (error, req = null, meta = {}) => {
  const errorMeta = {
    ...meta,
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  };
  
  if (req) {
    errorMeta.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
  }
  
  logger.error(error.message, errorMeta);
};

logger.performance = (operation, duration, meta = {}) => {
  logger.info(`${operation} completed`, {
    ...meta,
    type: 'performance',
    operation,
    duration: `${duration}ms`
  });
};

logger.security = (event, meta = {}) => {
  logger.warn(`Security event: ${event}`, {
    ...meta,
    type: 'security',
    event
  });
};

logger.database = (operation, table, meta = {}) => {
  logger.info(`Database ${operation} on ${table}`, {
    ...meta,
    type: 'database',
    operation,
    table
  });
};

logger.airtable = (operation, table, meta = {}) => {
  logger.info(`Airtable ${operation} on ${table}`, {
    ...meta,
    type: 'airtable',
    operation,
    table
  });
};

module.exports = logger; 