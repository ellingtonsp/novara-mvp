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

// Enhanced check-in endpoint - DEVELOPMENT ONLY
const { authenticateToken } = require('./middleware/auth');
const { asyncHandler, AppError } = require('./middleware/error-handler');

app.post('/api/daily-checkin-enhanced', authenticateToken, asyncHandler(async (req, res) => {
  console.log('📝 Enhanced daily check-in submission received:', req.body);
  const checkinData = req.body;
  console.log('Received checkinData:', checkinData);

  // Validation - ensure required fields are present
  if (!checkinData.mood_today || !checkinData.confidence_today) {
    console.error('❌ Missing required fields');
    throw new AppError('Missing required fields: mood_today and confidence_today are required', 400);
  }

  // Validate confidence_today is between 1-10
  if (checkinData.confidence_today < 1 || checkinData.confidence_today > 10) {
    console.error('❌ Invalid confidence rating');
    throw new AppError('confidence_today must be between 1 and 10', 400);
  }

  // Find user
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  console.log('✅ Found user record:', user.id);

  // Check for existing check-in today
  const existingCheckin = await checkinService.findByUserAndDate(
    user.id, 
    checkinData.date_submitted || new Date().toISOString().split('T')[0]
  );

  if (existingCheckin) {
    console.log('⚠️ Check-in already exists for today');
    return res.status(409).json({
      success: false,
      error: 'You have already submitted a check-in for today. Please try again tomorrow.',
      existing_checkin: {
        id: existingCheckin.id,
        mood_today: existingCheckin.mood_today,
        confidence_today: existingCheckin.confidence_today,
        date_submitted: existingCheckin.date_submitted
      }
    });
  }

  // Process any cycle stage update if provided
  if (checkinData.cycle_stage_update && checkinData.cycle_stage_update !== 'no_change') {
    console.log('🔄 Updating user cycle stage:', checkinData.cycle_stage_update);
    await userService.update(user.id, {
      cycle_stage: checkinData.cycle_stage_update,
      cycle_stage_updated: new Date().toISOString()
    });
  }

  // Prepare enhanced check-in data with all fields
  const enhancedCheckinData = {
    user_id: user.id,
    mood_today: checkinData.mood_today,
    confidence_today: parseInt(checkinData.confidence_today),
    date_submitted: checkinData.date_submitted || new Date().toISOString().split('T')[0],
    user_note: checkinData.user_note,
    primary_concern_today: checkinData.primary_concern_today,
    medication_taken: checkinData.medication_taken,
    
    // Enhanced fields
    journey_reflection_today: checkinData.journey_reflection_today,
    medication_confidence_today: checkinData.medication_confidence_today,
    medication_readiness_today: checkinData.medication_readiness_today,
    financial_confidence_today: checkinData.financial_confidence_today,
    journey_confidence_today: checkinData.journey_confidence_today,
    medication_concern_today: checkinData.medication_concern_today,
    medication_momentum: checkinData.medication_momentum,
    medication_preparation_concern: checkinData.medication_preparation_concern,
    financial_concern_today: checkinData.financial_concern_today,
    financial_momentum: checkinData.financial_momentum,
    journey_readiness_today: checkinData.journey_readiness_today,
    journey_momentum: checkinData.journey_momentum,
    
    // PHQ-4 fields if provided
    phq4_feeling_nervous: checkinData.phq4_feeling_nervous,
    phq4_stop_worrying: checkinData.phq4_stop_worrying,
    phq4_little_interest: checkinData.phq4_little_interest,
    phq4_feeling_down: checkinData.phq4_feeling_down,
    
    // Additional tracking fields
    symptom_tracking: checkinData.symptom_tracking,
    cycle_day: checkinData.cycle_day,
    
    // Metadata
    checkin_type: 'enhanced',
    dimension_focus: checkinData.dimension_focus
  };

  // Remove undefined fields
  Object.keys(enhancedCheckinData).forEach(key => {
    if (enhancedCheckinData[key] === undefined) {
      delete enhancedCheckinData[key];
    }
  });

  // Create the enhanced check-in
  const result = await checkinService.create(enhancedCheckinData);
  console.log('✅ Enhanced daily check-in saved successfully:', result.id);

  // Build response
  const responseData = {
    success: true,
    checkin: {
      id: result.id,
      ...result.fields || result,
      checkin_type: 'enhanced',
      created_at: result.created_at || new Date().toISOString()
    },
    message: 'Enhanced check-in completed successfully! 🌟'
  };

  // Add sentiment analysis if provided
  if (checkinData.sentiment_analysis) {
    responseData.sentiment_analysis = checkinData.sentiment_analysis;
  }

  res.status(201).json(responseData);
}));

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
  console.error('Uncaught Exception:', error);
  logger.error(`Uncaught Exception: ${error.message}`, { 
    type: 'uncaughtException',
    stack: error.stack 
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logger.error(`Unhandled Rejection: ${reason}`, { 
    type: 'unhandledRejection',
    promise: promise.toString()
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