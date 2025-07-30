/**
 * Configuration Module
 * Centralizes all configuration settings
 */

require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 9002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: '30d'
  },
  
  // Database Configuration
  database: {
    usePostgres: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql'),
    useSchemaV2: process.env.USE_SCHEMA_V2 === 'true',
    postgresUrl: process.env.DATABASE_URL,
    localDbPath: process.env.LOCAL_DB_PATH || './data/novara-local.db'
  },
  
  // Airtable Configuration
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_KEY || process.env.API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID || process.env.BASE_ID,
    baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || process.env.BASE_ID}`
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL,
    ttl: 300 // 5 minutes default
  },
  
  // Sentry Configuration
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 
            (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://app.novara.team'),
    credentials: true
  },
  
  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    authWindowMs: 5 * 60 * 1000, // 5 minutes
    authMaxRequests: 10
  }
};

// Validate critical configuration
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
  console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!');
}

if (!config.airtable.apiKey && !config.database.usePostgres) {
  console.warn('⚠️  WARNING: No database configured. Set either DATABASE_URL or AIRTABLE_API_KEY');
}

module.exports = config;