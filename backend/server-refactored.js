/**
 * Novara API Server - Refactored
 * Clean, modular architecture
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Sentry = require('@sentry/node');

// Configuration
const config = require('./config');
const { initializeDatabase } = require('./config/database');

// Middleware
const { errorHandler } = require('./middleware/error-handler');
const { apiLimiter } = require('./middleware/rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const checkinRoutes = require('./routes/checkins');
const userRoutes = require('./routes/users');
const insightRoutes = require('./routes/insights');
const healthRoutes = require('./routes/health');
const v2Routes = require('./routes/v2');

// Services
const userService = require('./services/user-service');
const checkinService = require('./services/checkin-service');
const insightsService = require('./services/insights-service');

// Utilities
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Initialize Sentry if configured
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: 0.1,
  });
  
  // Sentry request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS configuration
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
app.use('/api/', apiLimiter);

// Trust proxy for accurate IPs
app.set('trust proxy', true);

// Initialize database and services
async function initializeServices() {
  try {
    logger.startup('🚀 Initializing Novara API Server...');
    
    // Initialize database
    initializeDatabase();
    
    // Initialize services
    await userService.initialize();
    await checkinService.initialize();
    await insightsService.initialize();
    
    logger.startup('✅ All services initialized successfully');
  } catch (error) {
    logger.error(error, null, { phase: 'initialization' });
    process.exit(1);
  }
}

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: config.nodeEnv,
    version: '2.0.0', // Updated version for refactored code
    startup: 'ready'
  });
});

app.get('/api/health/detailed', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: config.nodeEnv,
    version: '2.0.0',
    checks: {
      database: config.database.usePostgres ? 'postgresql' : 
                config.airtable.apiKey ? 'airtable' : 'sqlite',
      schemaV2: config.database.useSchemaV2 ? 'enabled' : 'disabled',
      jwt: config.jwt.secret !== 'your-super-secret-jwt-key-change-this-in-production' ? 
           'configured' : 'default',
      sentry: config.sentry.dsn ? 'configured' : 'disabled',
      redis: config.redis.url ? 'configured' : 'disabled'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Novara API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      checkins: '/api/checkins/*',
      insights: '/api/insights/*',
      v2: '/api/v2/*'
    },
    docs: 'https://github.com/ellingtonsp/novara-mvp',
    version: '2.0.0'
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/users', userRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/v2', v2Routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Sentry error handler (must be before other error handlers)
if (config.sentry.dsn) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await initializeServices();
  
  const port = config.port;
  app.listen(port, () => {
    logger.startup(`🚀 Novara API Server running on port ${port}`);
    logger.startup(`📍 Environment: ${config.nodeEnv}`);
    logger.startup(`🗄️  Database: ${config.database.usePostgres ? 'PostgreSQL' : 
                    config.airtable.apiKey ? 'Airtable' : 'SQLite'}`);
    logger.startup(`🔧 Schema V2: ${config.database.useSchemaV2 ? 'Enabled' : 'Disabled'}`);
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error(error, null, { type: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(new Error(`Unhandled Rejection: ${reason}`), null, { 
    type: 'unhandledRejection',
    promise 
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  logger.error(error, null, { phase: 'startup' });
  process.exit(1);
});

module.exports = app;