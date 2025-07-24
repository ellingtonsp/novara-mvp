const Redis = require('ioredis');
const logger = require('./logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

// Create Redis client
let redis = null;

// Initialize Redis connection
function initializeRedis() {
  try {
    redis = new Redis(redisConfig);
    
    redis.on('connect', () => {
      logger.startup('Redis connected successfully', { 
        host: redisConfig.host, 
        port: redisConfig.port 
      });
    });
    
    redis.on('error', (error) => {
      logger.error(error, null, { 
        type: 'redis_error',
        host: redisConfig.host,
        port: redisConfig.port
      });
    });
    
    redis.on('close', () => {
      logger.warn('Redis connection closed', { 
        type: 'redis_close',
        host: redisConfig.host,
        port: redisConfig.port
      });
    });
    
    return redis;
  } catch (error) {
    logger.error(error, null, { 
      type: 'redis_init_error',
      host: redisConfig.host,
      port: redisConfig.port
    });
    return null;
  }
}

// Cache utility functions
class CacheManager {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 3600; // 1 hour
  }
  
  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.redis) return false;
      
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.redis.setex(key, ttl, serializedValue);
      
      logger.info(`Cache set: ${key}`, {
        type: 'cache_set',
        key,
        ttl,
        size: serializedValue.length
      });
      
      return true;
    } catch (error) {
      logger.error(error, null, { 
        type: 'cache_set_error',
        key,
        ttl
      });
      return false;
    }
  }
  
  // Get cache value
  async get(key) {
    try {
      if (!this.redis) return null;
      
      const value = await this.redis.get(key);
      
      if (value) {
        logger.info(`Cache hit: ${key}`, {
          type: 'cache_hit',
          key
        });
        
        // Try to parse as JSON, fallback to string
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } else {
        logger.info(`Cache miss: ${key}`, {
          type: 'cache_miss',
          key
        });
        return null;
      }
    } catch (error) {
      logger.error(error, null, { 
        type: 'cache_get_error',
        key
      });
      return null;
    }
  }
  
  // Delete cache key
  async del(key) {
    try {
      if (!this.redis) return false;
      
      const result = await this.redis.del(key);
      
      logger.info(`Cache deleted: ${key}`, {
        type: 'cache_delete',
        key,
        deleted: result > 0
      });
      
      return result > 0;
    } catch (error) {
      logger.error(error, null, { 
        type: 'cache_delete_error',
        key
      });
      return false;
    }
  }
  
  // Clear all cache
  async clear() {
    try {
      if (!this.redis) return false;
      
      await this.redis.flushdb();
      
      logger.info('Cache cleared', {
        type: 'cache_clear'
      });
      
      return true;
    } catch (error) {
      logger.error(error, null, { 
        type: 'cache_clear_error'
      });
      return false;
    }
  }
  
  // Get cache statistics
  async getStats() {
    try {
      if (!this.redis) return null;
      
      const info = await this.redis.info();
      const keys = await this.redis.dbsize();
      
      return {
        keys,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error(error, null, { 
        type: 'cache_stats_error'
      });
      return null;
    }
  }
  
  // Cache middleware for Express routes
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.redis) {
        return next();
      }
      
      try {
        // Generate cache key
        const cacheKey = keyGenerator ? keyGenerator(req) : `api:${req.method}:${req.originalUrl}`;
        
        // Check cache
        const cached = await this.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
        
        // Store original send method
        const originalSend = res.json;
        
        // Override send method to cache response
        res.json = function(data) {
          // Cache the response
          this.set(cacheKey, data, ttl);
          
          // Call original send method
          return originalSend.call(this, data);
        }.bind(this);
        
        next();
      } catch (error) {
        logger.error(error, req, { 
          type: 'cache_middleware_error'
        });
        next();
      }
    };
  }
}

// Rate limiting with Redis
class RateLimiter {
  constructor() {
    this.redis = redis;
  }
  
  // Rate limit middleware
  rateLimitMiddleware(windowMs = 15 * 60 * 1000, maxRequests = 100, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.redis) {
        return next();
      }
      
      try {
        const key = keyGenerator ? keyGenerator(req) : `ratelimit:${req.ip}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Remove old entries
        await this.redis.zremrangebyscore(key, 0, windowStart);
        
        // Count current requests
        const requestCount = await this.redis.zcard(key);
        
        if (requestCount >= maxRequests) {
          logger.security('Rate limit exceeded', {
            ip: req.ip,
            key,
            requestCount,
            maxRequests,
            windowMs
          });
          
          return res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }
        
        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
        
        // Add rate limit headers
        res.set('X-RateLimit-Limit', maxRequests);
        res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount - 1));
        res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
        
        next();
      } catch (error) {
        logger.error(error, req, { 
          type: 'rate_limit_error'
        });
        next();
      }
    };
  }
}

// Initialize cache manager and rate limiter
const cacheManager = new CacheManager();
const rateLimiter = new RateLimiter();

module.exports = {
  initializeRedis,
  cacheManager,
  rateLimiter,
  redis
}; 