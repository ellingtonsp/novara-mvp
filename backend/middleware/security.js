const helmet = require('helmet');
const logger = require('../utils/logger');

// Enhanced security headers configuration
const securityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://www.googletagmanager.com", 
        "https://www.google-analytics.com",
        "https://va.vercel-scripts.com",
        "https://vercel.live"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "https://www.google-analytics.com",
        "https://stats.g.doubleclick.net"
      ],
      connectSrc: [
        "'self'", 
        "https://www.google-analytics.com", 
        "https://analytics.google.com", 
        "https://stats.g.doubleclick.net",
        "https://api.airtable.com",
        "https://*.up.railway.app",
        "https://*.vercel.app"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      prefetchSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // Cross-Origin settings
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect CT
  expectCt: { enforce: true, maxAge: 30 },
  
  // Frameguard
  frameguard: { action: "deny" },
  
  // Hide Powered By
  hidePoweredBy: true,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Permissions Policy
  permissionsPolicy: {
    directives: {
      geolocation: ["'self'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
      ambientLightSensor: ["'none'"],
      autoplay: ["'none'"],
      encryptedMedia: ["'none'"],
      fullscreen: ["'self'"],
      pictureInPicture: ["'none'"],
      syncXhr: ["'none'"],
      midi: ["'none'"],
      publickeyCredentialsGet: ["'none'"],
      screenWakeLock: ["'none'"],
      webShare: ["'none'"],
      xrSpatialTracking: ["'none'"]
    }
  },
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // XSS Protection
  xssFilter: true
};

// Security middleware factory
function createSecurityMiddleware() {
  return helmet(securityConfig);
}

// Additional security headers middleware
function additionalSecurityHeaders(req, res, next) {
  // Remove server information
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=(), sync-xhr=(), midi=(), publickey-credentials-get=(), screen-wake-lock=(), web-share=(), xr-spatial-tracking=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  });
  
  next();
}

// Request validation middleware
function validateRequest(req, res, next) {
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-forwarded-proto',
    'x-forwarded-host'
  ];
  
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => 
    req.headers[header] && !isValidHeaderValue(req.headers[header])
  );
  
  if (hasSuspiciousHeaders) {
    logger.security('Suspicious headers detected', {
      headers: req.headers,
      ip: req.ip,
      url: req.url
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid request headers'
    });
  }
  
  // Check for suspicious user agents
  const userAgent = req.get('User-Agent');
  const suspiciousUserAgents = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python',
    'java',
    'perl'
  ];
  
  if (userAgent && suspiciousUserAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  )) {
    logger.security('Suspicious user agent detected', {
      userAgent,
      ip: req.ip,
      url: req.url
    });
  }
  
  next();
}

// Validate header values
function isValidHeaderValue(value) {
  if (typeof value !== 'string') return false;
  
  // Check for common injection patterns
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /onclick/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  return !injectionPatterns.some(pattern => pattern.test(value));
}

// API key validation middleware
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }
  
  // Validate API key format (basic validation)
  if (!/^[a-zA-Z0-9]{32,64}$/.test(apiKey)) {
    logger.security('Invalid API key format', {
      ip: req.ip,
      url: req.url,
      apiKeyLength: apiKey.length
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid API key format'
    });
  }
  
  // TODO: Add actual API key validation against database
  // For now, we'll just log the usage
  logger.info('API key used', {
    type: 'api_key_usage',
    ip: req.ip,
    url: req.url,
    apiKeyLength: apiKey.length
  });
  
  next();
}

// Request size limiting
function limitRequestSize(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (contentLength && contentLength > parseSize(maxSize)) {
      logger.security('Request too large', {
        ip: req.ip,
        url: req.url,
        contentLength,
        maxSize
      });
      
      return res.status(413).json({
        success: false,
        error: 'Request entity too large'
      });
    }
    
    next();
  };
}

// Parse size string (e.g., '10mb' -> 10485760)
function parseSize(size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
  if (!match) return 1024 * 1024; // Default 1MB
  
  const [, value, unit] = match;
  return parseInt(value) * (units[unit] || 1);
}

// Security monitoring middleware
function securityMonitoring(req, res, next) {
  const startTime = Date.now();
  
  // Monitor for potential security issues
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      logger.security('HTTP error response', {
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration
      });
    }
    
    // Log slow requests (potential DoS)
    if (duration > 5000) {
      logger.security('Slow request detected', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        duration,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
}

module.exports = {
  createSecurityMiddleware,
  additionalSecurityHeaders,
  validateRequest,
  validateApiKey,
  limitRequestSize,
  securityMonitoring
}; 