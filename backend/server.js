// Novara Complete API Server with JWT Authentication + Daily Insight Engine v1
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { performanceMiddleware } = require('./middleware/performance');
const { 
  createSecurityMiddleware, 
  additionalSecurityHeaders, 
  validateRequest, 
  limitRequestSize,
  securityMonitoring 
} = require('./middleware/security');
const { initializeRedis, cacheManager, rateLimiter } = require('./utils/cache');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Initialize Sentry only if DSN is available
let Sentry = null;
let sentryEnabled = false;

if (process.env.SENTRY_DSN) {
  try {
    Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
    sentryEnabled = true;
    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Sentry:', error.message);
    Sentry = null;
    sentryEnabled = false;
  }
} else {
  logger.info('Sentry DSN not configured, skipping Sentry initialization');
}

// Initialize Redis
initializeRedis();

// Import startup utilities
const { markAppReady } = require('./startup');

// Override NODE_ENV for staging environment if RAILWAY_ENVIRONMENT is set to staging
if (process.env.RAILWAY_ENVIRONMENT === 'staging') {
  process.env.NODE_ENV = 'staging';
}

// Ensure port uses process.env.PORT in production with safe parsing and fallback, plus diagnostic logging
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : (process.env.NODE_ENV === 'production' ? 8080 : (process.env.NODE_ENV === 'development' ? 3002 : 3000));
if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
  console.warn('⚠️ PORT not set in production - falling back to 8080, but this may cause 502 errors');
}
logger.startup(`Starting server on port ${port}`, {
  port,
  envPort: process.env.PORT || 'not set',
  nodeEnv: process.env.NODE_ENV || 'not set'
});

// Validate PORT is a valid integer (more lenient in development)
if (process.env.PORT) {
  const portNum = parseInt(process.env.PORT, 10);
  if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Invalid PORT value: ${process.env.PORT}. Must be an integer between 0 and 65535.`);
      process.exit(1);
    } else {
      console.warn(`Invalid PORT value: ${process.env.PORT}. Using default port ${port}.`);
      // Don't exit in development, just use default port
    }
  }
}

// JWT Secret - make sure to set this in your Railway environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Trust Railway proxy - conditional for staging
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
} else {
  app.set('trust proxy', 1); // More restrictive for staging
}

// Configure rate limiting to work with trust proxy
// Temporarily disabled for Railway deployment due to trust proxy issues
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for staging
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and internal Railway requests
    return req.path === '/api/health' || req.get('User-Agent')?.includes('RailwayHealthCheck');
  }
});

// Enhanced security middleware
app.use(createSecurityMiddleware());
app.use(additionalSecurityHeaders);
app.use(validateRequest);
app.use(limitRequestSize('10mb'));
app.use(securityMonitoring);

// Rate limiting configured above with trustProxy

// Add Sentry middleware only if Sentry is initialized
if (sentryEnabled && Sentry && Sentry.Handlers) {
  app.use(Sentry.Handlers.requestHandler());
}

// Add performance monitoring
app.use(performanceMiddleware);

// Apply rate limiting to all routes
app.use(limiter);

// Apply Redis-based rate limiting for additional protection
app.use(rateLimiter.rateLimitMiddleware(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
});

// General rate limiting for API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Logging middleware
app.use(morgan('combined', {
  stream: logger.stream
}));

// CORS - Environment-aware origin configuration
const allowedOrigins = [
  'http://localhost:3000',  // Frontend development
  'http://localhost:4200',  // Stable frontend port
  'https://novara-mvp.vercel.app', // Production frontend
  'https://novara-mvp-staging.vercel.app', // Staging frontend
  'https://novara-mvp-git-staging-novara-fertility.vercel.app', // Vercel staging frontend
  'https://novara-1txlqsq5z-novara-fertility.vercel.app', // Current Vercel staging frontend
];

// Add development origins in non-production environments
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',  // Legacy Vite dev server
    'http://localhost:3001',  // Alternative frontend port
    'http://localhost:4200'   // Stable frontend port (ensure it's always included)
  );
  
  // Add Vercel staging URL pattern for dynamic deployments
  allowedOrigins.push(/^https:\/\/novara-.*-novara-fertility\.vercel\.app$/);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add error handling for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Malformed JSON request:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format',
      details: 'Request body contains malformed JSON'
    });
  }
  next(err);
});

// Request logging middleware (if performance monitoring is disabled)
if (!process.env.DISABLE_PERFORMANCE_MONITORING) {
  app.use(performanceMiddleware);
}

// Rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/', generalLimiter);

// Database Configuration - Unified local/production adapter
const { databaseAdapter, airtableRequest, findUserByEmail } = require('./database/database-factory');

// Legacy Airtable config for production fallback
const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
  }
};

// Log database mode on startup
logger.startup(databaseAdapter.isUsingLocalDatabase() ? 
  'Running with SQLite local database' : 
  'Running with Airtable production database', {
    databaseType: databaseAdapter.isUsingLocalDatabase() ? 'sqlite' : 'airtable'
  });

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

// Generate JWT Token
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      nickname: user.nickname 
    },
    JWT_SECRET,
    { expiresIn: '90d' } // Token expires in 90 days (extended for better UX)
  );
}

// ============================================================================
// DAILY INSIGHT ENGINE v1 - PATTERN ANALYSIS & INSIGHT GENERATION
// ============================================================================

// Helper Functions for Pattern Analysis
function countConsecutivePattern(moodHistory, type) {
  let count = 0;
  for (const day of moodHistory) {
    if ((type === 'positive' && day.positive > day.challenging) ||
        (type === 'challenging' && day.challenging > day.positive)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function countConfidenceStreak(checkins) {
  let streak = 0;
  let previousConfidence = null;
  
  for (const checkin of checkins) {
    if (previousConfidence === null || checkin.confidence_today >= previousConfidence) {
      streak++;
      previousConfidence = checkin.confidence_today;
    } else {
      break;
    }
  }
  return streak;
}

function calculateVolatility(scores) {
  if (scores.length < 2) return 0;
  
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

// Mood Trend Analysis
function analyzeMoodTrend(checkins) {
  const moodCategories = {
    positive: ['hopeful', 'excited', 'grateful'],
    challenging: ['anxious', 'worried', 'overwhelmed', 'frustrated'],
    neutral: ['tired']
  };

  const moodHistory = checkins.map(checkin => {
    const moods = checkin.mood_today.split(', ').map(m => m.trim().toLowerCase());
    const positiveCount = moods.filter(m => moodCategories.positive.includes(m)).length;
    const challengingCount = moods.filter(m => moodCategories.challenging.includes(m)).length;
    
    return {
      date: checkin.date_submitted,
      positive: positiveCount,
      challenging: challengingCount,
      total: moods.length
    };
  });

  // Calculate trend direction
  const recent3 = moodHistory.slice(0, 3);
  const older3 = moodHistory.slice(3, 6);

  const recentPositive = recent3.reduce((sum, day) => sum + day.positive, 0);
  const olderPositive = older3.reduce((sum, day) => sum + day.positive, 0);
  const recentChallenging = recent3.reduce((sum, day) => sum + day.challenging, 0);
  const olderChallenging = older3.reduce((sum, day) => sum + day.challenging, 0);

  return {
    direction: recentPositive > olderPositive ? 'improving' : 
               recentChallenging > olderChallenging ? 'challenging' : 'stable',
    recent_positive_ratio: recent3.length > 0 ? recentPositive / (recent3.length * 2) : 0,
    recent_challenging_ratio: recent3.length > 0 ? recentChallenging / (recent3.length * 2) : 0,
    consecutive_positive: countConsecutivePattern(moodHistory, 'positive'),
    consecutive_challenging: countConsecutivePattern(moodHistory, 'challenging'),
    emotional_range: moodHistory[0]?.total || 1
  };
}

// Confidence Trend Analysis
function analyzeConfidenceTrend(checkins) {
  const confidenceScores = checkins.map(c => c.confidence_today);
  const recentAvg = confidenceScores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, confidenceScores.length);
  const overallAvg = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
  
  const trend = recentAvg > overallAvg + 1 ? 'rising' : 
                recentAvg < overallAvg - 1 ? 'declining' : 'stable';

  return {
    trend,
    recent_average: Math.round(recentAvg * 10) / 10,
    overall_average: Math.round(overallAvg * 10) / 10,
    current_level: confidenceScores[0],
    lowest_point: Math.min(...confidenceScores),
    highest_point: Math.max(...confidenceScores),
    volatility: calculateVolatility(confidenceScores)
  };
}

// Concern Pattern Analysis
function analyzeConcernPatterns(checkins) {
  const concerns = checkins
    .map(c => c.primary_concern_today)
    .filter(c => c && c.trim() !== '');

  const concernCounts = {};
  concerns.forEach(concern => {
    concernCounts[concern] = (concernCounts[concern] || 0) + 1;
  });

  const topConcern = Object.entries(concernCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    has_concerns: concerns.length > 0,
    concern_frequency: concerns.length / checkins.length,
    top_concern: topConcern?.[0],
    top_concern_count: topConcern?.[1] || 0,
    unique_concerns: Object.keys(concernCounts).length,
    recent_concern: checkins[0]?.primary_concern_today
  };
}

// Streak Pattern Analysis
function analyzeStreakPatterns(checkins) {
  const confidenceStreak = countConfidenceStreak(checkins);
  const checkInStreak = checkins.length; // Simple: they have this many days checked in
  
  return {
    confidence_streak: confidenceStreak,
    checkin_streak: checkInStreak,
    consistency: checkInStreak >= 3 ? 'high' : checkInStreak >= 2 ? 'medium' : 'new'
  };
}

// Emotional Range Analysis
function analyzeEmotionalRange(checkins) {
  const allMoods = checkins
    .map(c => c.mood_today.split(', ').map(m => m.trim().toLowerCase()))
    .flat();
  
  const uniqueMoods = [...new Set(allMoods)];
  const avgMoodsPerDay = allMoods.length / checkins.length;

  return {
    emotional_vocabulary: uniqueMoods.length,
    average_moods_per_day: Math.round(avgMoodsPerDay * 10) / 10,
    complexity: avgMoodsPerDay > 2 ? 'complex' : avgMoodsPerDay > 1.5 ? 'moderate' : 'simple'
  };
}

// Pattern Analysis Engine
function analyzeUserPatterns(checkins, user) {
  const patterns = {
    mood_trend: analyzeMoodTrend(checkins),
    confidence_trend: analyzeConfidenceTrend(checkins),
    concern_frequency: analyzeConcernPatterns(checkins),
    streak_patterns: analyzeStreakPatterns(checkins),
    emotional_complexity: analyzeEmotionalRange(checkins)
  };

  return patterns;
}

// Smart Insight Selection Engine
function selectBestInsight(patterns, checkins, user) {
  const insights = [];

  // Confidence Insights (High Priority)
  if (patterns.confidence_trend.trend === 'rising' && patterns.confidence_trend.recent_average >= 7) {
    insights.push({
      type: 'confidence_rising',
      title: 'Your confidence is growing!',
      message: `Your confidence has been steadily rising - you've gone from an average of ${patterns.confidence_trend.overall_average} to ${patterns.confidence_trend.recent_average} recently. That growth is real and meaningful.`,
      confidence: 0.95,
      priority: 9
    });
  }

  if (patterns.confidence_trend.trend === 'declining' && patterns.confidence_trend.recent_average <= 4) {
    insights.push({
      type: 'confidence_support',
      title: 'You\'re navigating a tough patch',
      message: `Your confidence has dipped recently, and that's completely understandable on this journey. Remember, low confidence days don't define your outcome.`,
      confidence: 0.9,
      priority: 8
    });
  }

  // Mood Pattern Insights
  if (patterns.mood_trend.consecutive_positive >= 3) {
    insights.push({
      type: 'positive_streak',
      title: 'What a beautiful streak!',
      message: `You've had ${patterns.mood_trend.consecutive_positive} consecutive days with positive feelings. Your resilience and hope are shining through.`,
      confidence: 0.92,
      priority: 8
    });
  }

  if (patterns.mood_trend.consecutive_challenging >= 3) {
    insights.push({
      type: 'challenging_support',
      title: 'You\'re not alone in this',
      message: `The past few days have felt heavy - anxiety, overwhelm, and worry are all normal parts of this process. These feelings will shift.`,
      confidence: 0.88,
      priority: 9
    });
  }

  // Emotional Complexity Insights
  if (patterns.emotional_complexity.complexity === 'complex' && patterns.emotional_complexity.average_moods_per_day > 2.5) {
    insights.push({
      type: 'emotional_awareness',
      title: 'Your emotional awareness is remarkable',
      message: `You're experiencing an average of ${patterns.emotional_complexity.average_moods_per_day} different feelings each day. This emotional richness shows incredible self-awareness.`,
      confidence: 0.85,
      priority: 6
    });
  }

  // Concern Pattern Insights
  if (patterns.concern_frequency.top_concern && patterns.concern_frequency.top_concern_count >= 3) {
    const concernInsights = {
      'Financial stress': 'The financial aspect weighs heavily on many people in this journey. You\'re not alone in this worry.',
      'Medication side effects': 'Medication concerns are so common - your body is doing remarkable work right now.',
      'Appointment outcomes': 'The waiting and uncertainty around appointments can feel overwhelming. Each appointment is one step forward.',
      'Family pressure': 'Family dynamics during IVF can be complex. Setting boundaries for your emotional wellbeing is important.'
    };

    const concernMessage = concernInsights[patterns.concern_frequency.top_concern] || 
                          `${patterns.concern_frequency.top_concern} has been on your mind lately. It's natural to focus on what matters most to you.`;

    insights.push({
      type: 'concern_pattern',
      title: 'Acknowledging your concerns',
      message: concernMessage,
      confidence: 0.87,
      priority: 7
    });
  }

  // Consistency Insights
  if (patterns.streak_patterns.checkin_streak >= 5) {
    insights.push({
      type: 'consistency_celebration',
      title: 'Your consistency is powerful',
      message: `${patterns.streak_patterns.checkin_streak} days of checking in with yourself! This daily practice of self-awareness is building something beautiful.`,
      confidence: 0.83,
      priority: 5
    });
  }

  // Stability Insights
  if (patterns.confidence_trend.volatility < 1.5 && patterns.confidence_trend.overall_average >= 6) {
    insights.push({
      type: 'steady_strength',
      title: 'Your steady strength is remarkable',
      message: `Your confidence has remained steady around ${patterns.confidence_trend.overall_average}/10. This emotional stability is a real strength during IVF.`,
      confidence: 0.8,
      priority: 4
    });
  }

  // Fallback insights for edge cases
  if (insights.length === 0) {
    insights.push({
      type: 'general_support',
      title: 'Thank you for checking in',
      message: 'Every day you show up for yourself on this journey matters. We see your courage and commitment.',
      confidence: 0.75,
      priority: 3
    });
  }

  // Return highest priority insight
  return insights.sort((a, b) => b.priority - a.priority)[0];
}

// Advanced Insight Generation Engine - TRULY PERSONALIZED
function generateDailyInsights(checkins, user) {
  // Always use user's onboarding data for personalization
  const onboardingData = {
    confidence_meds: user.confidence_meds || 5,
    confidence_costs: user.confidence_costs || 5, 
    confidence_overall: user.confidence_overall || 5,
    primary_need: user.primary_need,
    top_concern: user.top_concern,
    cycle_stage: user.cycle_stage,
    nickname: user.nickname
  };
  
  console.log('🧠 Generating personalized dashboard insight for:', user.nickname || user.email);
  console.log('📊 User profile:', onboardingData);
  console.log('📈 Recent check-ins:', checkins?.length || 0);

  // NEW USERS (No check-ins yet) - Use onboarding data
  if (!checkins || checkins.length === 0) {
    return generateWelcomeInsightFromOnboarding(onboardingData, user);
  }

  // RETURNING USERS - Combine onboarding + check-in patterns  
  const analysis = analyzeUserPatternsWithContext(checkins, onboardingData, user);
  return generateContextualInsight(analysis, checkins, user);
}

// Generate personalized welcome for new users based on their onboarding
function generateWelcomeInsightFromOnboarding(data, user) {
  const { confidence_meds, confidence_costs, confidence_overall, primary_need, top_concern, cycle_stage } = data;
  const name = user.nickname || user.email.split('@')[0];
  
  // Identify their biggest concern area
  const concerns = [
    { area: 'medications', confidence: confidence_meds, threshold: 4 },
    { area: 'costs', confidence: confidence_costs, threshold: 4 },
    { area: 'overall', confidence: confidence_overall, threshold: 4 }
  ];
  
  const lowConfidenceAreas = concerns.filter(c => c.confidence <= c.threshold);
  const avgConfidence = (confidence_meds + confidence_costs + confidence_overall) / 3;
  
  // PRIORITY 1: SPECIFIC CONCERN + LOW CONFIDENCE MATCH
  // If their top concern matches a low confidence area, prioritize that specific support
  if (top_concern && top_concern.trim() !== '') {
    const concernLower = top_concern.toLowerCase();
    
    // Medication concern + low medication confidence
    if (concernLower.includes('medication') && confidence_meds <= 4) {
      return {
        type: 'focused_support',
        title: `${name}, let's tackle the medication uncertainty together`,
        message: `I see medication protocols feel uncertain right now (you rated confidence at ${confidence_meds}/10). This is incredibly common—the medical side can feel overwhelming before you have all the details. Plus, "${top_concern}" weighs on your mind—let's address that specific worry. How are you feeling today?`,
        confidence: 0.9
      };
    }
    
    // Financial concern + low cost confidence  
    if ((concernLower.includes('financial') || concernLower.includes('cost') || concernLower.includes('money')) && confidence_costs <= 4) {
      return {
        type: 'focused_support', 
        title: `${name}, your financial concerns make complete sense`,
        message: `You rated financial confidence at ${confidence_costs}/10, and honestly, that's realistic. IVF costs can feel overwhelming, but there are ways to approach this step by step. Plus, "${top_concern}" weighs on your mind—let's address that specific worry. How are you feeling today?`,
        confidence: 0.9
      };
    }
  }
  
  // HIGH CONFIDENCE - Acknowledge their strength, offer specific support
  if (avgConfidence >= 6.5) {
    let message = `Welcome back, ${name}! Your confidence levels from onboarding show real strength in approaching IVF.`;
    
    if (top_concern && top_concern.trim() !== '') {
      message += ` I noticed you mentioned "${top_concern}" as a concern. Even when we feel confident overall, specific worries are completely normal.`;
    }
    
    if (primary_need === 'emotional_support') {
      message += ` Since emotional support is important to you, remember: having confidence doesn't mean doing this alone.`;
    } else if (primary_need === 'financial_planning') {
      message += ` With financial planning being a priority, your confidence suggests you're ready to tackle the practical steps ahead.`;
    }
    
    return {
      type: 'confident_welcome',
      title: `You're approaching this with real strength, ${name}`,
      message: message + ` How are you feeling today?`,
      confidence: 0.9
    };
  }
  
  // SINGLE LOW CONFIDENCE AREA - Address specific areas
  if (lowConfidenceAreas.length === 1) {
    const concernArea = lowConfidenceAreas[0].area;
    let title, message;
    
    if (concernArea === 'medications') {
      title = `${name}, let's tackle the medication uncertainty together`;
      message = `I see medication protocols feel uncertain right now (you rated confidence at ${confidence_meds}/10). This is incredibly common—the medical side can feel overwhelming before you have all the details.`;
    } else if (concernArea === 'costs') {
      title = `${name}, your financial concerns make complete sense`;
      message = `You rated financial confidence at ${confidence_costs}/10, and honestly, that's realistic. IVF costs can feel overwhelming, but there are ways to approach this step by step.`;
    } else {
      title = `${name}, it's okay to feel uncertain about the journey ahead`;
      message = `Your overall confidence is at ${confidence_overall}/10 right now, which shows you're being honest about how big this feels. That self-awareness is actually a strength.`;
    }
    
    if (top_concern && top_concern.trim() !== '') {
      message += ` Plus, "${top_concern}" weighs on your mind—let's address that specific worry.`;
    }
    
    return {
      type: 'focused_support',
      title,
      message: message + ` How are you feeling today?`,
      confidence: 0.85
    };
  }
  
  // LOW CONFIDENCE OVERALL - Gentle, comprehensive support
  if (avgConfidence <= 4) {
    let message = `${name}, thank you for being so honest in your onboarding. `;
    
    if (lowConfidenceAreas.length >= 2) {
      message += `Feeling uncertain about multiple aspects—medications, costs, the overall journey—is completely normal when starting IVF. `;
    }
    
    if (top_concern && top_concern.trim() !== '') {
      message += `"${top_concern}" weighs heavily, and that makes perfect sense. `;
    }
    
    message += `You don't have to figure everything out at once. Let's start with how you're feeling right now, today.`;
    
    return {
      type: 'gentle_support', 
      title: `${name}, you're not alone in feeling uncertain`,
      message,
      confidence: 0.9
    };
  }
  
  // DEFAULT - Balanced approach
  return {
    type: 'balanced_welcome',
    title: `Welcome back, ${name}`,
    message: `Based on your onboarding, you're approaching IVF with a realistic mix of confidence and natural concerns. ${top_concern ? `"${top_concern}" is on your mind, ` : ''}and that's exactly the kind of honest self-assessment that helps. How are you feeling today?`,
    confidence: 0.8
  };
}

// Analyze patterns for returning users (combining onboarding + check-ins)
function analyzeUserPatternsWithContext(checkins, onboardingData, user) {
  if (!checkins || checkins.length === 0) return null;
  
  const recent = checkins.slice(0, 3); // Last 3 check-ins
  const name = user.nickname || user.email.split('@')[0];
  
  // Analyze mood evolution
  const moods = recent.map(c => c.mood_today).filter(Boolean);
  const confidences = recent.map(c => c.confidence_today).filter(c => c !== undefined);
  const concerns = recent.map(c => c.primary_concern_today).filter(Boolean);
  
  // CM-01: Extract sentiment analysis data
  const sentiments = recent.map(c => ({
    sentiment: c.sentiment,
    confidence: c.sentiment_confidence,
    date: c.date_submitted
  })).filter(s => s.sentiment);
  
  return {
    recent_moods: moods,
    recent_confidences: confidences,
    recent_concerns: concerns,
    recent_sentiments: sentiments, // CM-01: Include sentiment data
    latest_checkin: recent[0],
    avg_recent_confidence: confidences.length > 0 ? confidences.reduce((a,b) => a+b) / confidences.length : null,
    onboarding: onboardingData,
    name,
    checkin_count: checkins.length
  };
}

// Generate contextual insight for returning users
function generateContextualInsight(analysis, checkins, user) {
  if (!analysis || !analysis.latest_checkin) {
    return generateWelcomeInsightFromOnboarding(analysis.onboarding, user);
  }
  
  const { latest_checkin, recent_moods, recent_confidences, recent_concerns, recent_sentiments, onboarding, name, avg_recent_confidence } = analysis;
  const { confidence_meds, confidence_costs, top_concern: onboarding_concern } = onboarding;
  
  // CM-01: PRIORITY - Sentiment-based copy variants
  if (recent_sentiments && recent_sentiments.length > 0) {
    const latest_sentiment = recent_sentiments[0];
    
    if (latest_sentiment.sentiment === 'positive' && latest_sentiment.confidence >= 0.7) {
      return {
        type: 'positive_sentiment_celebration',
        title: `${name}, your positive energy is shining through! 🎉`,
        message: `I can feel the hope and strength in your recent check-in. ${latest_checkin.journey_reflection_today ? `"${latest_checkin.journey_reflection_today}" ` : ''}Those positive feelings are real and deserve to be celebrated. This journey has hard moments, but today isn't one of them.`,
        confidence: 0.95
      };
    }
    
    if (latest_sentiment.sentiment === 'negative' && latest_sentiment.confidence >= 0.7) {
      const supportMessage = latest_checkin.journey_reflection_today 
        ? `"${latest_checkin.journey_reflection_today}" - I hear you. ` 
        : '';
      
      return {
        type: 'negative_sentiment_support',
        title: `${name}, tough days are part of this journey`,
        message: `${supportMessage}The frustration and tiredness you're feeling today are completely valid. IVF asks so much of us - physically, emotionally, financially. ${latest_checkin.medication_concern_today ? `Being "tired of side effects" is incredibly understandable. ` : ''}You're not alone in feeling this way, and these difficult feelings don't diminish your strength.`,
        confidence: 0.92
      };
    }
    
    if (latest_sentiment.sentiment === 'neutral' && latest_sentiment.confidence >= 0.5) {
      return {
        type: 'neutral_sentiment_acknowledgment', 
        title: `${name}, steady and thoughtful`,
        message: `Your recent check-in shows you're taking a measured approach to how you're feeling. ${latest_checkin.journey_reflection_today ? `"${latest_checkin.journey_reflection_today}" ` : ''}Sometimes neutral is exactly where we need to be - not forcing positivity, not overwhelmed by worry, just present with the process.`,
        confidence: 0.85
      };
    }
  }
  
  console.log('📊 Analyzing returning user patterns:', {
    latest_mood: latest_checkin.mood_today,
    latest_confidence: latest_checkin.confidence_today,
    avg_confidence: avg_recent_confidence,
    onboarding_concern,
    recent_concerns
  });
  
  // PATTERN: Recent concern matches onboarding concern
  if (latest_checkin.primary_concern_today && onboarding_concern && 
      latest_checkin.primary_concern_today.toLowerCase().includes(onboarding_concern.toLowerCase().split(' ')[0])) {
    return {
      type: 'persistent_concern_support',
      title: `${name}, I see "${onboarding_concern}" is still on your mind`,
      message: `This was important to you from the start, and it came up again today. That consistency tells me this isn't just a passing worry—it's something worth addressing directly. Your recent check-ins show you're being thoughtful about tracking what matters most.`,
      confidence: 0.9
    };
  }
  
  // PATTERN: Confidence improving over time
  if (recent_confidences.length >= 2) {
    const confidence_trend = recent_confidences[0] - recent_confidences[recent_confidences.length - 1];
    if (confidence_trend >= 2) {
      return {
        type: 'confidence_growth',
        title: `${name}, your confidence is growing—I can see it`,
        message: `Looking at your recent check-ins, your confidence has climbed from ${recent_confidences[recent_confidences.length - 1]} to ${recent_confidences[0]}. That's not just numbers—that's you building real strength through this process. How does that growth feel?`,
        confidence: 0.95
      };
    }
  }
  
  // PATTERN: Mixed emotions (common IVF experience)
  if (latest_checkin.mood_today && latest_checkin.mood_today.includes(',')) {
    const emotions = latest_checkin.mood_today.split(',').map(e => e.trim());
    if (emotions.length >= 2) {
      return {
        type: 'emotional_complexity',
        title: `${name}, feeling ${emotions[0]} and ${emotions[1]} makes complete sense`,
        message: `IVF brings up complex emotions—it's normal to feel multiple things at once. ${latest_checkin.primary_concern_today ? `"${latest_checkin.primary_concern_today}" weighs on you today, ` : ''}and holding space for all these feelings is part of the journey.`,
        confidence: 0.88
      };
    }
  }
  
  // PATTERN: Low confidence + specific concern
  if (latest_checkin.confidence_today <= 4 && latest_checkin.primary_concern_today) {
    let contextMessage = `Today's confidence (${latest_checkin.confidence_today}/10) and your concern about "${latest_checkin.primary_concern_today}" both deserve attention. `;
    
    // Connect to onboarding if relevant
    if (confidence_costs <= 4 && latest_checkin.primary_concern_today.toLowerCase().includes('financial')) {
      contextMessage += `This connects to the financial uncertainty you felt during onboarding—you're not alone in this worry carrying forward.`;
    } else if (confidence_meds <= 4 && latest_checkin.primary_concern_today.toLowerCase().includes('medication')) {
      contextMessage += `This builds on the medication concerns from your onboarding—it's common for these worries to evolve as treatment gets closer.`;
    } else {
      contextMessage += `Let's address this specific concern while it's fresh on your mind.`;
    }
    
    return {
      type: 'targeted_concern_support',
      title: `${name}, let's focus on what's weighing on you today`,
      message: contextMessage,
      confidence: 0.87
    };
  }
  
  // PATTERN: High confidence + mood awareness
  if (latest_checkin.confidence_today >= 7) {
    return {
      type: 'confident_check_in',
      title: `${name}, your ${latest_checkin.confidence_today}/10 confidence shows real strength`,
      message: `Feeling ${latest_checkin.mood_today || 'strong'} with high confidence suggests you're finding your footing in this process. ${latest_checkin.primary_concern_today ? `Even with "${latest_checkin.primary_concern_today}" on your mind, ` : ''}you're approaching this from a place of growing strength.`,
      confidence: 0.85
    };
  }
  
  // DEFAULT: Recent check-in acknowledgment
  return {
    type: 'recent_checkin_support',
    title: `Thanks for checking in, ${name}`,
    message: `Your recent check-ins show you're staying connected to how you're feeling through this process. ${latest_checkin.mood_today ? `Feeling ${latest_checkin.mood_today} ` : ''}${latest_checkin.confidence_today ? `with ${latest_checkin.confidence_today}/10 confidence ` : ''}tells me you're being honest with yourself about the ups and downs.`,
    confidence: 0.8
  };
}

// ============================================================================
// ORIGINAL MICRO-INSIGHT ENGINE (for immediate feedback after check-ins)
// ============================================================================

function generateMicroInsight(userData) {
  const { confidence_meds, confidence_costs, confidence_overall, primary_need } = userData;
  
  if (confidence_meds <= 4) {
    return {
      title: "About IVF medications",
      message: "It sounds like you might have concerns about IVF medications. That's extremely common — we'll aim to demystify the process, one step at a time."
    };
  }
  
  if (confidence_costs <= 4) {
    return {
      title: "Managing financial stress",
      message: "Financial concerns during fertility treatment can feel overwhelming. You're not alone in this worry."
    };
  }
  
  if (confidence_overall <= 4) {
    return {
      title: "Your overall journey",
      message: "Some days the path ahead might feel unclear, and that's completely understandable. Take it one day at a time."
    };
  }
  
  return {
    title: "Your journey matters",
    message: "Thank you for taking time to check in with yourself today. You're navigating something profound with grace."
  };
}

// ============================================================================
// ENHANCED MICRO-INSIGHT ENGINE v2 - CONTEXTUAL & PERSONALIZED
// ============================================================================

function generatePersonalizedMicroInsight(data, user) {
  console.log('🎯 Generating personalized micro-insight for:', user.nickname || user.email);
  console.log('📊 Input data:', data);
  const insights = [];
  
  // Calculate overall confidence profile
  const avgConfidence = (
    (data.confidence_meds || 5) + 
    (data.confidence_costs || 5) + 
    (data.confidence_overall || 5)
  ) / 3;
  
  // 1. COMBINATION INSIGHTS (Multi-factor patterns)
  
  // Low confidence across multiple areas
  if (data.confidence_meds <= 4 && data.confidence_costs <= 4) {
    insights.push({
      title: `${user.nickname}, we see you're carrying a lot`,
      message: "Both the medication protocols and financial planning can feel overwhelming at once. Here's what helps: tackle just one piece tomorrow. Which feels more manageable right now?",
      action: {
        label: "Help me prioritize tomorrow's focus",
        type: "priority_helper"
      },
      priority: 9,
      specificity: 8
    });
  }
  
  // High confidence with specific concern
  else if (avgConfidence >= 7 && data.top_concern && data.top_concern.trim() !== '') {
    insights.push({
      title: "You're handling this well overall",
      message: `Your confidence levels show real strength, ${user.nickname}. The one thing weighing on you—"${data.top_concern}"—makes sense to think about. Want a gentle strategy for this specific worry?`,
      action: {
        label: "Get targeted support for this concern",
        type: "concern_strategy"
      },
      priority: 8,
      specificity: 9
    });
  }
  
  // 2. CYCLE STAGE SPECIFIC INSIGHTS
  
  if (data.cycle_stage === 'considering' && data.confidence_overall <= 4) {
    insights.push({
      title: "In the 'considering' phase",
      message: "It's completely normal to feel uncertain when you're still exploring IVF. This hesitation isn't a sign you're not ready—it shows you're thinking carefully about something important.",
      action: {
        label: "See what helped others in this phase",
        type: "phase_guidance"
      },
      priority: 7,
      specificity: 7
    });
  }
  
  else if (data.cycle_stage === 'stimulation' && data.confidence_meds <= 4) {
    insights.push({
      title: "Navigating stimulation medications",
      message: "You're in the thick of the medication phase, and it can feel intense. Each injection you've managed is progress, even when it doesn't feel like it. Tomorrow's dose is just one step.",
      action: {
        label: "Quick med organization tips",
        type: "med_tips"
      },
      priority: 9,
      specificity: 9
    });
  }
  
  else if (data.cycle_stage === 'transfer' && data.confidence_overall >= 6) {
    insights.push({
      title: "Approaching transfer with strength",
      message: `${user.nickname}, you've made it to transfer—that's huge. Your confidence shows you've built real resilience through this process. Trust what you've learned about yourself.`,
      action: {
        label: "Transfer day preparation guide",
        type: "transfer_prep"
      },
      priority: 8,
      specificity: 8
    });
  }
  
  // 3. PRIMARY NEED BASED INSIGHTS
  
  if (data.primary_need === 'financial_planning' && data.confidence_costs <= 4) {
    insights.push({
      title: "Financial planning support",
      message: "Money worries about IVF are so valid—this is expensive and often not fully covered. You're not alone in needing to think creatively about funding. One conversation at a time.",
      action: {
        label: "Financial resources & strategies",
        type: "financial_support"
      },
      priority: 8,
      specificity: 7
    });
  }
  
  else if (data.primary_need === 'procedure_info' && data.confidence_overall >= 6) {
    insights.push({
      title: "You're building knowledge and confidence",
      message: "Your confidence levels suggest you're gathering information well. Knowledge is power in this process—each question you ask and answer helps you feel more prepared.",
      action: {
        label: "Next-level procedure insights",
        type: "advanced_info"
      },
      priority: 6,
      specificity: 6
    });
  }
  
  // 4. MOOD-BASED INSIGHTS (for check-ins)
  
  if (data.mood_today) {
    const moods = data.mood_today.split(', ').map(m => m.trim().toLowerCase());
    
    if (moods.includes('anxious') && moods.includes('hopeful')) {
      insights.push({
        title: "Both anxious and hopeful",
        message: "That combination of anxiety and hope? It's the most human thing about this process. Both feelings are valid and can coexist. The hope is real, even with the worry.",
        action: {
          label: "Anxiety + hope coping strategies",
          type: "mixed_emotions"
        },
        priority: 8,
        specificity: 8
      });
    }
    
    else if (moods.includes('grateful') && data.confidence_today >= 7) {
      insights.push({
        title: "Gratitude and confidence together",
        message: `${user.nickname}, feeling grateful while also feeling confident is a beautiful combination. This suggests you're finding ways to appreciate the journey even amid challenges.`,
        action: {
          label: "Ways to anchor this positive moment",
          type: "gratitude_anchor"
        },
        priority: 7,
        specificity: 7
      });
    }
    
    else if (moods.includes('overwhelmed') && data.confidence_today <= 4) {
      insights.push({
        title: "When everything feels like too much",
        message: "Overwhelm + low confidence = completely understandable. Today doesn't define your capacity. Sometimes the best thing is to just focus on the next small thing in front of you.",
        action: {
          label: "Simple overwhelm reset techniques",
          type: "overwhelm_reset"
        },
        priority: 9,
        specificity: 8
      });
    }
  }
  
  // 5. FALLBACK INSIGHTS (more specific than current defaults)
  
  // For confident users
  if (avgConfidence >= 7 && insights.length === 0) {
    insights.push({
      title: `${user.nickname}, your confidence is showing`,
      message: "Your responses suggest you're navigating this journey with real strength. That confidence you're building? It's not just about IVF—it's about trusting yourself through uncertainty.",
      action: {
        label: "Share this strength with others",
        type: "peer_support"
      },
      priority: 5,
      specificity: 5
    });
  }
  
  // For users needing support
  else if (avgConfidence <= 4 && insights.length === 0) {
    insights.push({
      title: "You're doing more than you know",
      message: `${user.nickname}, this process is hard, and your feelings about it are completely valid. Every small step you take—even filling out this form—is an act of courage.`,
      action: {
        label: "See your progress so far",
        type: "progress_reflection"
      },
      priority: 6,
      specificity: 6
    });
  }
  
  // Final fallback
  if (insights.length === 0) {
    insights.push({
      title: "Your journey, your pace",
      message: `Thank you for sharing, ${user.nickname}. Every person's IVF experience is unique, and we're here to support yours exactly as it unfolds.`,
      action: null,
      priority: 3,
      specificity: 3
    });
  }
  
  // Select the best insight (highest priority + specificity)
  insights.sort((a, b) => (b.priority + b.specificity) - (a.priority + a.specificity));
  
  const selectedInsight = insights[0];
  console.log('✨ Selected insight:', selectedInsight.title);
  console.log('📝 Generated insights count:', insights.length);
  
  // Remove internal scoring for response
  delete selectedInsight.priority;
  delete selectedInsight.specificity;
  
  return selectedInsight;
}

// ============================================================================
// DYNAMIC CHECK-IN QUESTION ENGINE
// ============================================================================

/**
 * Calculate which dimension to focus on today based on:
 * 1. Time-based rotation (ensure all dimensions get checked)
 * 2. Recent trends (confidence changes over time)  
 * 3. Behavioral signals (frequent mentions of concerns)
 * 4. Onboarding priorities (initial top concerns)
 */
function calculateDimensionFocus(user) {
  const today = new Date();
  const daysSinceSignup = Math.floor((today - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
  
  // Base rotation: cycle through dimensions every 3 days
  const rotationCycle = daysSinceSignup % 9; // 9 days = 3 dimensions × 3 days each
  
  const dimensions = ['medication', 'financial', 'journey'];
  const baseDimension = dimensions[Math.floor(rotationCycle / 3)];
  
  // Priority overrides based on onboarding concerns
  const { confidence_meds, confidence_costs, confidence_overall, top_concern } = user;
  
  // URGENT: Always check low confidence areas from onboarding
  if (confidence_meds <= 4) return 'medication';
  if (confidence_costs <= 4) return 'financial'; 
  if (confidence_overall <= 4) return 'journey';
  
  // HIGH PRIORITY: Check top concern area more frequently
  if (top_concern) {
    if (top_concern.toLowerCase().includes('medication') && (rotationCycle % 6 < 2)) return 'medication';
    if ((top_concern.toLowerCase().includes('cost') || top_concern.toLowerCase().includes('financial')) && (rotationCycle % 6 < 2)) return 'financial';
  }
  
  // FUTURE ENHANCEMENT: Add trend detection here
  // TODO: Check recent confidence trends from daily_checkins
  // if (hasDecliningTrend('medication_confidence', 3)) return 'medication';
  // if (hasDecliningTrend('financial_stress', 3)) return 'financial';
  
  // Default to rotation-based dimension
  return baseDimension;
}

function generatePersonalizedCheckInQuestions(user) {
  const questions = [
    // Always include baseline questions
    {
      id: 'mood_today',
      type: 'text',
      question: 'How are you feeling today?',
      placeholder: 'anxious, hopeful, tired...',
      required: true,
      priority: 1
    },
    {
      id: 'confidence_today', 
      type: 'slider',
      question: 'Overall confidence level today',
      min: 1,
      max: 10,
      required: true,
      priority: 1
    },
    // Universal journey reflection - ALWAYS present for comprehensive sentiment capture
    {
      id: 'journey_reflection_today',
      type: 'text',
      question: 'How are you feeling about your journey today?',
      placeholder: 'Share anything on your mind - celebrations, worries, thoughts...',
      required: false,
      priority: 2,
      context: 'universal_sentiment',
      sentiment_target: true  // Primary field for sentiment analysis
    }
  ];

  // ENHANCED: Calculate which dimension to focus on today
  const dimensionToFocus = calculateDimensionFocus(user);
  console.log(`🎯 Today's dimension focus for ${user.email}: ${dimensionToFocus}`);

  // Add concern-specific questions based on ENHANCED dimension focus
  const { confidence_meds, confidence_costs, confidence_overall, top_concern } = user;
  
  // NEW: Cycle stage update check - ensure cycle stage is current
  if (dimensionToFocus === 'medication' && shouldCheckCycleStageUpdate(user)) {
    questions.push({
      id: 'cycle_stage_update',
      type: 'select',
      question: 'Is your cycle stage still current?',
      options: [
        { value: 'no_change', label: 'No change - still ' + getCycleStageLabel(user.cycle_stage) },
        { value: 'considering', label: 'Just considering IVF' },
        { value: 'ivf_prep', label: 'Preparing for IVF' },
        { value: 'stimulation', label: 'In stimulation phase' },
        { value: 'retrieval', label: 'Around retrieval' },
        { value: 'transfer', label: 'Transfer stage' },
        { value: 'tww', label: 'Two-week wait' },
        { value: 'pregnant', label: 'Pregnant' },
        { value: 'between_cycles', label: 'Between cycles' }
      ],
      required: false,
      priority: 2.7,
      context: 'cycle_stage_update'
    });
  }

  if (dimensionToFocus === 'medication') {
    // NEW: Use cycle stage to determine appropriate medication question
    const medicationQuestion = getMedicationQuestionForCycleStage(user.cycle_stage);
    const derivedMedicationStatus = getMedicationStatusFromCycleStage(user.cycle_stage);
    
    questions.push({
      ...medicationQuestion,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      cycle_stage_context: user.cycle_stage,
      derived_medication_status: derivedMedicationStatus
    });

    // Add follow-up question based on cycle stage and confidence
    if (derivedMedicationStatus === 'taking' || derivedMedicationStatus === 'pregnancy_support') {
      if (confidence_meds <= 4 || (top_concern && top_concern.toLowerCase().includes('medication'))) {
        // Low confidence: focus on support
        questions.push({
          id: 'medication_concern_today',
          type: 'text', 
          question: user.cycle_stage === 'pregnant' ? 
            'Any specific concerns about your pregnancy medications?' :
            'Any specific medication questions or worries today?',
          placeholder: user.cycle_stage === 'pregnant' ? 
            'prenatal vitamins, hormone support, timing...' :
            'timing, side effects, dosing...',
          required: false,
          priority: 4,
          context: 'medication_focus'
        });
      } else {
        // High/medium confidence: capture what's working
        questions.push({
          id: 'medication_momentum',
          type: 'text',
          question: user.cycle_stage === 'pregnant' ?
            'How are you feeling about your pregnancy medication routine?' :
            'How are things going with your medication routine? Any changes?',
          placeholder: user.cycle_stage === 'pregnant' ?
            'routine working well, doctor feedback, any adjustments...' :
            'routine working well, new concerns, doctor feedback...',
          required: false,
          priority: 4,
          context: 'medication_check'
        });
      }
    } else {
      // Preparation phase - ask about readiness concerns
      questions.push({
        id: 'medication_preparation_concern',
        type: 'text',
        question: derivedMedicationStatus === 'between_cycles' ?
          'Any thoughts about medications for your next cycle?' :
          'Any questions or concerns about upcoming medications?',
        placeholder: derivedMedicationStatus === 'between_cycles' ?
          'next cycle planning, protocol changes, timing...' :
          'timeline questions, preparation concerns, what to expect...',
        required: false,
        priority: 4,
        context: 'medication_preparation'
      });
    }
  }

  if (dimensionToFocus === 'financial') {
    // Always check financial dimension when it's the focus
    questions.push({
      id: 'financial_confidence_today',
      type: 'slider',
      question: `How confident are you feeling about the financial aspects today?`,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      context: 'financial_focus'
    });

    if (confidence_costs <= 4 || (top_concern && (top_concern.toLowerCase().includes('cost') || top_concern.toLowerCase().includes('financial')))) {
      // Low confidence or concern: focus on support
      questions.push({
        id: 'financial_concern_today',
        type: 'text',
        question: 'Any new financial concerns or updates today?',
        placeholder: 'insurance updates, cost worries, planning questions...',
        required: false,
        priority: 4,
        context: 'financial_focus'
      });
    } else {
      // High/medium confidence: capture what's working or any changes
      questions.push({
        id: 'financial_momentum',
        type: 'text',
        question: 'How are the financial aspects feeling? Any updates?',
        placeholder: 'insurance progress, cost clarity, financial planning...',
        required: false,
        priority: 4,
        context: 'financial_check'
      });
    }
  }

  if (dimensionToFocus === 'journey') {
    // Always check overall journey dimension when it's the focus
    questions.push({
      id: 'journey_confidence_today',
      type: 'slider',
      question: `How confident are you feeling about your journey overall today?`,
      min: 1,
      max: 10,
      required: false,
      priority: 3,
      context: 'journey_focus'
    });

    if (confidence_overall <= 4) {
      // Low confidence: focus on readiness and support
      questions.push({
        id: 'journey_readiness_today',
        type: 'text',
        question: 'What feels challenging about your journey right now?',
        placeholder: 'timeline concerns, preparation worries, next steps...',
        required: false,
        priority: 4,
        context: 'journey_focus'
      });
    } else {
      // High/medium confidence: capture what's building strength
      questions.push({
        id: 'journey_momentum',
        type: 'text',
        question: 'What\'s feeling good about your journey today? Any new developments?',
        placeholder: 'team support, progress made, positive changes...',
        required: false,
        priority: 4,
        context: 'journey_check'
      });
    }
  }

  // LEGACY DIMENSION CHECKS: Keep original logic for any remaining high-priority items
  if (dimensionToFocus !== 'medication' && confidence_meds <= 3) {
    // Emergency medication check for very low confidence
    questions.push({
      id: 'medication_emergency_check',
      type: 'text',
      question: 'Quick medication check - any urgent concerns?',
      placeholder: 'side effects, timing issues, doctor questions...',
      required: false,
      priority: 5,
      context: 'emergency_check'
    });
  }

  if (dimensionToFocus !== 'financial' && confidence_costs <= 3) {
    // Emergency financial check for very low confidence
    questions.push({
      id: 'financial_emergency_check',
      type: 'text',
      question: 'Quick financial check - any urgent concerns?',
      placeholder: 'insurance issues, unexpected costs, planning help...',
      required: false,
      priority: 5,
      context: 'emergency_check'
    });
  }

  // Additional checks for specific concerns remain available

  // TOP CONCERN FOLLOW-UP (if they specified one)
  if (top_concern && top_concern.trim() !== '') {
    questions.push({
      id: 'top_concern_today',
      type: 'text',
      question: `You mentioned "${top_concern}" was important to you. How is that feeling today?`,
      placeholder: 'better, worse, same...',
      required: false,
      priority: 4,
      context: 'concern_followup'
    });
  }

  // Sort by priority and return
  return questions.sort((a, b) => a.priority - b.priority);
}

// Generate contextual insights based on the enhanced check-in data
function generateEnhancedMicroInsight(checkinData, user) {
  console.log('🎯 Generating enhanced micro-insight for:', user.nickname || user.email);
  console.log('📊 Enhanced check-in data:', checkinData);

  // Start with standard insight generation
  const baseInsight = generatePersonalizedMicroInsight(checkinData, user);
  
  // Enhance with specific concern tracking
  let enhancedMessage = baseInsight.message;
  const enhancements = [];

  // MEDICATION CONFIDENCE TRACKING
  if (checkinData.medication_confidence_today) {
    const startingConfidence = user.confidence_meds || 5;
    const todayConfidence = parseInt(checkinData.medication_confidence_today);
    const change = todayConfidence - startingConfidence;

    if (change > 0) {
      enhancements.push(`Your medication confidence has grown from ${startingConfidence} to ${todayConfidence} - that's real progress! 📈`);
    } else if (change < 0) {
      enhancements.push(`Medication confidence feels lower today (${todayConfidence} vs ${startingConfidence} initially). That's okay - let's address what's causing the uncertainty. 🤝`);
    } else {
      enhancements.push(`Your medication confidence is holding steady at ${todayConfidence}/10. Consistency can be a strength too. 💪`);
    }
  }

  // SPECIFIC MEDICATION CONCERNS
  if (checkinData.medication_concern_today && checkinData.medication_concern_today.trim() !== '') {
    enhancements.push(`You mentioned "${checkinData.medication_concern_today}" - let's keep an eye on this specific worry. 👀`);
  }

  // FINANCIAL STRESS TRACKING
  if (checkinData.financial_stress_today) {
    const startingConfidence = user.confidence_costs || 5;
    const todayStress = parseInt(checkinData.financial_stress_today);
    
    if (todayStress <= 4) {
      enhancements.push(`Financial stress is weighing on you today (${todayStress}/10). Remember, you don't have to solve everything at once. 💚`);
    } else if (todayStress >= 7) {
      enhancements.push(`You're feeling more confident about the financial side today (${todayStress}/10). That clarity helps with everything else! ✨`);
    }
  }

  // TOP CONCERN FOLLOW-UP
  if (checkinData.top_concern_today && checkinData.top_concern_today.trim() !== '') {
    enhancements.push(`About "${user.top_concern}" - noting that it's "${checkinData.top_concern_today}" today. We're tracking this with you. 📝`);
  }

  // Add enhancements to the insight
  if (enhancements.length > 0) {
    enhancedMessage += '\n\n' + enhancements.join(' ');
  }

  return {
    ...baseInsight,
    message: enhancedMessage,
    enhanced: true,
    tracking_data: {
      medication_confidence: checkinData.medication_confidence_today,
      medication_concerns: checkinData.medication_concern_today,
      financial_stress: checkinData.financial_stress_today,
      top_concern_status: checkinData.top_concern_today
    }
  };
}

// ============================================================================
// MICRO-INSIGHT ENDPOINT (FVM-FOCUSED, POST-ONBOARDING OR CHECK-IN)
// ============================================================================

/**
 * POST /api/insights/micro
 * Generate a micro-insight based on latest onboarding or check-in data.
 * Expects: { user_id (optional if JWT), onboardingData, checkinData }
 * Returns: { success, micro_insight: { title, message, action }, user_id }
 */
app.post('/api/insights/micro', authenticateToken, async (req, res) => {
  try {
    let user;
    try {
      // Try to get user from JWT token first
      let userEmail;
      if (req.user && req.user.email) {
        userEmail = req.user.email;
      } 
      // If no JWT, try to get email from request body (onboarding or checkin data)
      else if (req.body.onboardingData && req.body.onboardingData.email) {
        userEmail = req.body.onboardingData.email;
      }
      else if (req.body.checkinData && req.body.checkinData.email) {
        userEmail = req.body.checkinData.email;
      }
      // If no email available, return error
      else {
        return res.status(400).json({ 
          success: false, 
          error: 'User email required - either via authentication or in request data' 
        });
      }
      
      user = await findUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      console.log('User fetched for micro-insight:', user.id, 'Email:', userEmail);
    } catch (error) {
      console.error('User lookup error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    // Use latest data for insight generation
    const data = req.body.checkinData || req.body.onboardingData || user;

    // Enhanced micro-insight logic
    // Generate enhanced, personalized micro-insight using new engine
    const micro_insight = generatePersonalizedMicroInsight(data, user);

    // Store insight in database
    const insightType = req.body.checkinData ? 'checkin_micro' : 'onboarding_micro';
    const insightId = `${req.body.checkinData ? 'checkin' : 'onboarding'}_${Date.now()}`;
    
    try {
      const insightData = {
        user_id: [user.id],
        insight_type: insightType,
        insight_title: micro_insight.title,
        insight_message: micro_insight.message,
        insight_id: insightId,
        date: new Date().toISOString().split('T')[0],
        context_data: JSON.stringify(data),
        status: 'active'
      };

      // Add action data if present
      if (micro_insight.action) {
        insightData.action_label = micro_insight.action.label;
        insightData.action_type = micro_insight.action.type;
      }

      console.log('💾 Saving insight to database:', insightData);
      
      const result = await airtableRequest('Insights', 'POST', {
        fields: insightData
      });
      
      console.log('✅ Insight saved to database:', result.id);

      res.json({
        success: true,
        micro_insight: {
          ...micro_insight,
          id: result.id,
          insight_id: insightId
        },
        user_id: user.id,
        message: 'Personalized micro-insight generated and saved successfully! ✨'
      });
      
    } catch (saveError) {
      console.error('❌ Error saving insight to database:', saveError);
      
      // Still return the insight even if save fails
      res.json({
        success: true,
        micro_insight: {
          ...micro_insight,
          insight_id: insightId
        },
        user_id: user.id,
        message: 'Personalized micro-insight generated successfully! ✨ (Note: Storage temporarily unavailable)'
      });
    }
  } catch (error) {
    console.error('Error generating micro-insight:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Novara API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      users: '/api/users',
      checkins: '/api/checkins',
      insights: '/api/insights/daily',
      engagement: '/api/insights/engagement'
    },
    docs: 'https://github.com/ellingtonsp/novara-mvp'
  });
});

// Startup Health Check - Responds immediately during deployment
app.get('/api/health', (req, res) => {
  // Always respond immediately - Railway needs this to pass
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.3',
    startup: 'ready'
  });
});

// Detailed Health Check - For monitoring after deployment
app.get('/api/health/detailed', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.3',
    checks: {}
  };
  
  // Check Airtable connection
  try {
    if (typeof config !== 'undefined' && config && config.airtable && config.airtable.apiKey) {
      healthStatus.checks.airtable = 'connected';
    } else {
      healthStatus.checks.airtable = 'not configured';
    }
  } catch (error) {
    healthStatus.checks.airtable = 'error';
  }
  
  // Check JWT configuration
  try {
    if (JWT_SECRET && JWT_SECRET !== 'your-super-secret-jwt-key-change-this-in-production') {
      healthStatus.checks.jwt = 'configured';
    } else {
      healthStatus.checks.jwt = 'not configured';
    }
  } catch (error) {
    healthStatus.checks.jwt = 'error';
  }
  
  res.json(healthStatus);
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheManager.getStats();
    res.json({
      success: true,
      stats: stats || { message: 'Redis not available' }
    });
  } catch (error) {
    logger.error(error, req);
    res.status(500).json({ success: false, error: 'Failed to get cache stats' });
  }
});

app.post('/api/cache/clear', async (req, res) => {
  try {
    const cleared = await cacheManager.clear();
    res.json({
      success: true,
      cleared,
      message: cleared ? 'Cache cleared successfully' : 'Cache clear failed'
    });
  } catch (error) {
    logger.error(error, req);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Login (for existing users)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Validate email format and sanitize
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = email.toString().trim().toLowerCase();
    
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    if (sanitizedEmail.length > 254) { // RFC 5321 limit
      return res.status(400).json({ 
        success: false, 
        error: 'Email address too long' 
      });
    }

    // Find user in Airtable
    const user = await findUserByEmail(sanitizedEmail);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please sign up first.' 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        confidence_meds: user.confidence_meds,
        confidence_costs: user.confidence_costs,
        confidence_overall: user.confidence_overall,
        created_at: user.created_at
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create User (Signup + Auto-login)
app.post('/api/users', authLimiter, async (req, res) => {
  try {
    // Validate and sanitize email
    const rawEmail = req.body.email;
    if (!rawEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = rawEmail.toString().trim().toLowerCase();
    
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    if (sanitizedEmail.length > 254) { // RFC 5321 limit
      return res.status(400).json({ 
        success: false, 
        error: 'Email address too long' 
      });
    }

    // Validate and sanitize nickname
    const nickname = req.body.nickname ? req.body.nickname.toString().trim() : '';
    if (nickname.length > 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nickname too long (max 50 characters)' 
      });
    }

    const userData = {
      email: sanitizedEmail,
      nickname: nickname,
      confidence_meds: req.body.confidence_meds || 5,
      confidence_costs: req.body.confidence_costs || 5,
      confidence_overall: req.body.confidence_overall || 5,
      timezone: req.body.timezone,
      email_opt_in: req.body.email_opt_in || true,
      status: 'active'
    };

    // Only add optional fields if they have values
    if (req.body.primary_need && req.body.primary_need !== '') {
      userData.primary_need = req.body.primary_need;
    }
    if (req.body.cycle_stage && req.body.cycle_stage !== '') {
      userData.cycle_stage = req.body.cycle_stage;
    }
    if (req.body.top_concern && req.body.top_concern !== '') {
      userData.top_concern = req.body.top_concern;
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists. Please log in instead.' 
      });
    }

    // Create user in Airtable
    const result = await airtableRequest('Users', 'POST', {
      fields: userData
    });

    const newUser = {
      id: result.id,
      ...result.fields
    };

    // Generate JWT token for immediate login
    const token = generateToken(newUser);

    res.status(201).json({ 
      success: true, 
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        confidence_meds: newUser.confidence_meds,
        confidence_costs: newUser.confidence_costs,
        confidence_overall: newUser.confidence_overall,
        created_at: newUser.created_at
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Current User (Protected Route)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        confidence_meds: user.confidence_meds,
        confidence_costs: user.confidence_costs,
        confidence_overall: user.confidence_overall,
        medication_status: user.medication_status,
        medication_status_updated: user.medication_status_updated,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Alias for user profile (same as /api/users/me for API consistency)
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      email: user.email,
      nickname: user.nickname,
      confidence_meds: user.confidence_meds,
      confidence_costs: user.confidence_costs,
      confidence_overall: user.confidence_overall,
      medication_status: user.medication_status,
      medication_status_updated: user.medication_status_updated,
      primary_need: user.primary_need,
      cycle_stage: user.cycle_stage,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// DAILY CHECK-INS ROUTES
// ============================================================================

// Get Last Check-in Values (Protected Route) - for form defaults
app.get('/api/checkins/last-values', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching last check-in values for user:', req.user.email);

    // Find user record
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get the most recent check-in for this user
    let userRecords = [];
    
    if (databaseAdapter.isUsingLocalDatabase()) {
      // Use local database method
      const result = await databaseAdapter.localDb.getUserCheckins(user.id, 1);
      userRecords = result.records || [];
    } else {
      // Use Airtable with filter formula
      const checkinsUrl = `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('${user.id}', {user_id})&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=1`;
      
      const response = await databaseAdapter.fetchCheckins(checkinsUrl, {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Airtable error fetching last check-in:', result);
        return res.status(422).json({ 
          success: false, 
          error: 'Failed to retrieve last check-in data' 
        });
      }
      
      userRecords = result.records || [];
    }

    if (userRecords.length > 0) {
      const lastCheckin = userRecords[0].fields;
      console.log('✅ Found last check-in:', lastCheckin.date_submitted);
      
      // Return the last values as defaults
      res.json({
        success: true,
        last_values: {
          confidence_today: lastCheckin.confidence_today || 5,
          medication_confidence_today: lastCheckin.medication_confidence_today || null,
          financial_stress_today: lastCheckin.financial_stress_today || null,
          journey_readiness_today: lastCheckin.journey_readiness_today || null,
          last_checkin_date: lastCheckin.date_submitted || null
        },
        message: 'Last check-in values retrieved successfully'
      });
    } else {
      // No previous check-ins - return onboarding defaults
      console.log('📝 No previous check-ins found, using onboarding defaults');
      res.json({
        success: true,
        last_values: {
          confidence_today: user.confidence_overall || 5,
          medication_confidence_today: user.confidence_meds || null,
          financial_stress_today: user.confidence_costs || null,
          journey_readiness_today: user.confidence_overall || null,
          last_checkin_date: null
        },
        message: 'Using onboarding defaults (no previous check-ins)'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching last check-in values:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Submit Daily Check-in (Protected Route)
app.post('/api/checkins', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Daily check-in submission received:', req.body);

    const { 
      mood_today, 
      primary_concern_today, 
      confidence_today, 
      user_note,
      sentiment_analysis, // CM-01: Sentiment data from frontend
      ...additionalFormFields // Capture all additional dynamic form fields
    } = req.body;

    // Validation - ensure required fields are present
    if (!mood_today || !confidence_today) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: mood_today and confidence_today are required' 
      });
    }

    // Validate confidence_today is between 1-10
    if (confidence_today < 1 || confidence_today > 10) {
      console.error('❌ Invalid confidence rating');
      return res.status(400).json({ 
        success: false, 
        error: 'confidence_today must be between 1 and 10' 
      });
    }

    // Find user record in Airtable using JWT payload
    const userRecordId = await findUserByEmail(req.user.email);
    
    if (!userRecordId) {
      console.error('❌ User not found:', req.user.email);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    console.log('✅ Found user record:', userRecordId.id);

    // Prepare data for Airtable DailyCheckins table
    const checkinData = {
      user_id: [userRecordId.id], // Array format for linked records
      mood_today,
      confidence_today: parseInt(confidence_today),
      date_submitted: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    // Only add optional fields if they have actual values
    if (primary_concern_today && primary_concern_today.trim() !== '') {
      checkinData.primary_concern_today = primary_concern_today.trim();
    }
    
    if (user_note && user_note.trim() !== '') {
      checkinData.user_note = user_note.trim();
    }

    // Handle all additional form fields from personalized questions
    Object.entries(additionalFormFields).forEach(([fieldName, fieldValue]) => {
      if (fieldValue !== null && fieldValue !== undefined) {
        // Handle text fields
        if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
          checkinData[fieldName] = fieldValue.trim();
        }
        // Handle numeric fields (sliders)
        else if (typeof fieldValue === 'number' && fieldValue >= 0) {
          checkinData[fieldName] = fieldValue;
        }
      }
    });

    console.log('📝 Dynamic form fields processed:', Object.keys(additionalFormFields));

    // CM-01: Add sentiment analysis data if provided
    if (sentiment_analysis) {
      checkinData.sentiment = sentiment_analysis.sentiment;
      checkinData.sentiment_confidence = sentiment_analysis.confidence;
      checkinData.sentiment_scores = JSON.stringify(sentiment_analysis.scores);
      checkinData.sentiment_processing_time = sentiment_analysis.processing_time;
      
      console.log('🎭 CM-01: Sentiment data added to check-in:', {
        sentiment: sentiment_analysis.sentiment,
        confidence: sentiment_analysis.confidence,
        processing_time: sentiment_analysis.processing_time
      });
    }

    console.log('📊 Sending to Airtable DailyCheckins:', checkinData);

    // Create record in Airtable DailyCheckins table
    const result = await airtableRequest('DailyCheckins', 'POST', {
      fields: checkinData
    });

    console.log('✅ Daily check-in saved successfully:', result.id);

    // Return success response with the created record
    const responseData = {
      success: true,
      checkin: {
        id: result.id,
        mood_today: result.fields.mood_today,
        confidence_today: result.fields.confidence_today,
        date_submitted: result.fields.date_submitted,
        created_at: result.fields.created_at
      },
      message: sentiment_analysis?.sentiment === 'positive' 
        ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
        : 'Daily check-in completed successfully! 🌟'
    };

    // CM-01: Include sentiment data in response if available
    if (sentiment_analysis) {
      responseData.sentiment_analysis = {
        sentiment: sentiment_analysis.sentiment,
        confidence: sentiment_analysis.confidence,
        celebration_triggered: sentiment_analysis.sentiment === 'positive'
      };
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Unexpected error in /api/checkins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get User's Recent Check-ins (Protected Route)
app.get('/api/checkins', authenticateToken, async (req, res) => {
  try {
    const { limit = 7 } = req.query;

    console.log(`📈 Fetching recent check-ins for user: ${req.user.email}`);

    // Find user first
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Alternative approach: Fetch recent records and filter in code
    // This avoids Airtable formula issues with linked records
    const airtableUrl = `${config.airtable.baseUrl}/DailyCheckins?sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit * 5}`;
    console.log('🔍 Querying database for recent checkins, will filter by user:', user.id);
    
    const response = await databaseAdapter.fetchCheckins(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Airtable error fetching check-ins:', result);
      return res.status(422).json({ 
        success: false, 
        error: 'Failed to retrieve check-ins from database' 
      });
    }

    // Filter records by user ID in application code
    const userCheckins = result.records.filter(record => {
      const recordUserId = record.fields.user_id;
      // Handle both single string and array formats
      if (Array.isArray(recordUserId)) {
        return recordUserId.includes(user.id);
      }
      return recordUserId === user.id;
    }).slice(0, limit); // Apply limit after filtering

    console.log(`📊 Filtered ${userCheckins.length} check-in records for user ${req.user.email} from ${result.records?.length || 0} total records`);
    if (userCheckins.length > 0) {
      console.log('📝 First record user_id field:', userCheckins[0].fields.user_id);
    }

    // Transform Airtable records for frontend consumption
    const checkins = userCheckins.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today || '',
      primary_concern_today: record.fields.primary_concern_today || null,
      confidence_today: record.fields.confidence_today || 5,
      user_note: record.fields.user_note || null,
      date_submitted: record.fields.date_submitted || '',
      created_at: record.fields.created_at || record.createdTime
    }));

    console.log(`✅ Retrieved ${checkins.length} check-ins for user: ${req.user.email}`);

    res.json({
      success: true,
      checkins,
      count: checkins.length
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/checkins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// DAILY INSIGHT ENGINE ROUTES (NEW!)
// ============================================================================

// Get Daily Insights (Protected Route)
app.get('/api/insights/daily', authenticateToken, async (req, res) => {
  try {
    console.log(`🧠 Generating daily insights for user: ${req.user.email}`);

    // Find user
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get recent check-ins for this user (last 7 days)
    let userRecords = [];
    
    if (databaseAdapter.isUsingLocalDatabase()) {
      // Use local database method
      const result = await databaseAdapter.localDb.getUserCheckins(user.id, 7);
      userRecords = result.records || [];
    } else {
      // Use Airtable with filter formula
      const checkinsUrl = `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('${user.id}', {user_id})&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=7`;
      const response = await databaseAdapter.fetchCheckins(checkinsUrl, {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Airtable error fetching check-ins for insights:', result);
        return res.status(422).json({ 
          success: false, 
          error: 'Failed to retrieve check-ins for analysis' 
        });
      }
      
      userRecords = result.records || [];
    }

    console.log(`📊 Insights: Found ${userRecords.length} check-ins for user ${user.id}`);

    const checkins = userRecords.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today || '',
      primary_concern_today: record.fields.primary_concern_today || null,
      confidence_today: record.fields.confidence_today || 5,
      user_note: record.fields.user_note || null,
      date_submitted: record.fields.date_submitted || '',
      created_at: record.fields.created_at || record.createdTime
    }));

    // Generate insights using the new engine
    const insight = generateDailyInsights(checkins, user);
    
    console.log(`✅ Generated insight type: ${insight.type} for user: ${req.user.email}`);

    // Store daily insight in database
    const insightId = `daily_${Date.now()}`;
    
    try {
      const insightData = {
        user_id: [user.id],
        insight_type: 'daily_insight',
        insight_title: insight.title || insight.type,
        insight_message: insight.message,
        insight_id: insightId,
        date: new Date().toISOString().split('T')[0],
        context_data: JSON.stringify({ checkins_count: checkins.length, insight_type: insight.type }),
        status: 'active'
      };

      console.log('💾 Saving daily insight to database:', insightData);
      
      const result = await airtableRequest('Insights', 'POST', {
        fields: insightData
      });
      
      console.log('✅ Daily insight saved to database:', result.id);

      res.json({
        success: true,
        insight: {
          ...insight,
          id: result.id,
          insight_id: insightId
        },
        analysis_data: {
          checkins_analyzed: checkins.length,
          date_range: checkins.length > 0 ? 
            `${checkins[checkins.length - 1].date_submitted} to ${checkins[0].date_submitted}` : 
            'No recent check-ins',
          user_id: user.id
        }
      });
      
    } catch (saveError) {
      console.error('❌ Error saving daily insight to database:', saveError);
      
      // Still return the insight even if save fails
      res.json({
        success: true,
        insight: {
          ...insight,
          insight_id: insightId
        },
        analysis_data: {
          checkins_analyzed: checkins.length,
          date_range: checkins.length > 0 ? 
            `${checkins[checkins.length - 1].date_submitted} to ${checkins[0].date_submitted}` : 
            'No recent check-ins',
          user_id: user.id
        }
      });
    }

  } catch (error) {
    console.error('❌ Error generating daily insights:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Track Insight Engagement (Protected Route)
app.post('/api/insights/engagement', authenticateToken, async (req, res) => {
  try {
    const { insight_type, action, insight_id } = req.body;
    
    console.log(`📊 Tracking engagement: ${action} for insight type: ${insight_type}`);

    // Find user
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Create engagement record for Airtable
    const engagementData = {
      user_id: [user.id],
      insight_type,
      action, // 'viewed', 'clicked', 'dismissed', 'refreshed', 'liked', 'not_helpful'
      insight_id: insight_id || '',
      timestamp: new Date().toISOString().split('T')[0],
      date_submitted: new Date().toISOString().split('T')[0]
    };

    console.log('📈 Insight engagement tracked:', engagementData);

    try {
      // Try to save to InsightEngagement table (if it exists)
      const result = await airtableRequest('InsightEngagement', 'POST', {
        fields: engagementData
      });
      console.log('✅ Engagement saved to InsightEngagement table:', result.id);
      
      res.json({
        success: true,
        message: 'Engagement tracked successfully',
        engagement: {
          id: result.id,
          user_id: user.id,
          insight_type,
          action,
          timestamp: engagementData.timestamp
        }
      });
    } catch (tableError) {
      // If InsightEngagement table doesn't exist, just log for now
      console.log('⚠️ InsightEngagement table not found, logging only:', tableError.message);
      
      res.json({
        success: true,
        message: 'Engagement logged (table will be created later)',
        engagement: {
          user_id: user.id,
          insight_type,
          action,
          timestamp: engagementData.timestamp
        }
      });
    }

  } catch (error) {
    console.error('❌ Error tracking insight engagement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Track General Analytics Events (Protected Route) - FVM Focused
app.post('/api/analytics/events', authenticateToken, async (req, res) => {
  try {
    const { event_type, event_data = {} } = req.body;
    
    console.log(`📈 FVM Event tracked: ${event_type}`, event_data);

    // Find user
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Create comprehensive event record for Airtable
    const analyticsData = {
      user_id: [user.id],
      event_type,
      event_timestamp: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      event_data: JSON.stringify(event_data) // Store as JSON string
    };

    // Add event-specific fields for easier querying
    if (event_data.confidence_scores) {
      analyticsData.confidence_scores = JSON.stringify(event_data.confidence_scores);
    }
    if (event_data.insight_type) {
      analyticsData.insight_type = event_data.insight_type;
    }
    if (event_data.insight_title) {
      analyticsData.insight_title = event_data.insight_title;
    }
    if (event_data.insight_id) {
      analyticsData.insight_id = event_data.insight_id;
    }
    if (event_data.feedback_type) {
      analyticsData.feedback_type = event_data.feedback_type;
    }
    if (event_data.feedback_context) {
      analyticsData.feedback_context = event_data.feedback_context;
    }
    if (event_data.mood_selected && Array.isArray(event_data.mood_selected)) {
      analyticsData.mood_selected = event_data.mood_selected;
    }
    if (event_data.confidence_level) {
      analyticsData.confidence_level = event_data.confidence_level;
    }
    if (event_data.concern_mentioned !== undefined) {
      analyticsData.concern_mentioned = event_data.concern_mentioned;
    }

    console.log('🎯 FVM Analytics event tracked:', analyticsData);

    // Save to Airtable FVMAnalytics table
    const result = await airtableRequest('FMVAnalytics', 'POST', {
      fields: analyticsData
    });

    console.log('✅ Analytics event saved to Airtable:', result.id);

    res.json({
      success: true,
      message: 'Analytics event tracked successfully',
      event: {
        id: result.id,
        user_id: user.id,
        event_type,
        timestamp: analyticsData.event_timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error tracking analytics event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// LEGACY ROUTES (maintained for compatibility)
// ============================================================================

// Get User Insight (Protected Route) - Original micro-insight engine
app.get('/api/users/insight', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const insight = generateMicroInsight(user);
    
    res.json({ 
      success: true, 
      insight,
      user_id: user.id
    });
  } catch (error) {
    console.error('Generate insight error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test endpoint
app.get('/api/checkins-test', (req, res) => {
  res.json({
    success: true,
    message: 'Daily Check-ins API is working! 🎯',
    endpoints: {
      'POST /api/auth/login': 'Login existing user',
      'POST /api/users': 'Signup new user (auto-login)',
      'GET /api/users/me': 'Get current user (protected)',
      'POST /api/checkins': 'Submit daily check-in (protected)',
      'GET /api/checkins': 'Get user check-in history (protected)',
      'GET /api/insights/daily': 'Get personalized daily insights (protected)', // NEW!
      'POST /api/insights/engagement': 'Track insight engagement (protected)', // NEW!
      'GET /api/users/insight': 'Get user micro-insight (protected)',
      'GET /api/checkins-test': 'This test endpoint'
    },
    authentication: 'JWT Bearer Token required for protected routes',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// START SERVER
// ============================================================================

// Update app.listen to bind to '0.0.0.0' explicitly (required for container networking) with full startup logs
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/api/health`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`🔌 Bound to host: 0.0.0.0 (required for Railway container networking)`);
  
  // Mark application as ready for health checks
  setTimeout(() => {
    markAppReady();
    console.log(`✅ Application marked as ready for health checks`);
  }, 2000); // Give 2 seconds for everything to initialize
});

// ============================================================================
// DYNAMIC CHECK-IN ROUTES
// ============================================================================

// Get Personalized Check-in Questions (Protected Route)
app.get('/api/checkins/questions', authenticateToken, async (req, res) => {
  try {
    console.log(`🎯 Generating personalized questions for user: ${req.user.email}`);

    // Find user to get their onboarding data
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Generate personalized questions based on their concerns
    const questions = generatePersonalizedCheckInQuestions(user);
    
    console.log(`✅ Generated ${questions.length} personalized questions for ${req.user.email}`);
    console.log('📝 Question contexts:', questions.map(q => q.context || 'baseline').join(', '));

    res.json({
      success: true,
      questions,
      personalization_summary: {
        medication_focus: user.confidence_meds <= 4,
        financial_focus: user.confidence_costs <= 4,
        journey_focus: user.confidence_overall <= 4,
        top_concern: user.top_concern || null
      }
    });

  } catch (error) {
    console.error('❌ Error generating personalized questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Enhanced check-in endpoint - DEVELOPMENT ONLY
app.post('/api/daily-checkin-enhanced', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Enhanced daily check-in submission received:', req.body);
    const checkinData = req.body;
    console.log('Received checkinData:', checkinData);

    // Validation - ensure required fields are present
    if (!checkinData.mood_today || !checkinData.confidence_today) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: mood_today and confidence_today are required' 
      });
    }

    // Validate confidence_today is between 1-10
    if (checkinData.confidence_today < 1 || checkinData.confidence_today > 10) {
      console.error('❌ Invalid confidence rating');
      return res.status(400).json({ 
        success: false, 
        error: 'confidence_today must be between 1 and 10' 
      });
    }

    // Find user record using JWT payload (SECURE VERSION)
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      console.error('❌ User not found:', req.user.email);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    console.log('✅ Found user record:', user.id);

    // Prepare enhanced data for Airtable DailyCheckins table
    const enhancedCheckinData = {
      user_id: [user.id],
      mood_today: checkinData.mood_today,
      confidence_today: parseInt(checkinData.confidence_today),
      date_submitted: new Date().toISOString().split('T')[0]
    };

    // Add optional enhanced fields if they have values
    if (checkinData.primary_concern_today && checkinData.primary_concern_today.trim() !== '') {
      enhancedCheckinData.primary_concern_today = checkinData.primary_concern_today.trim();
    }
    
    if (checkinData.medication_confidence_today) {
      enhancedCheckinData.medication_confidence_today = parseInt(checkinData.medication_confidence_today);
    }
    
    if (checkinData.medication_concern_today && checkinData.medication_concern_today.trim() !== '') {
      enhancedCheckinData.medication_concern_today = checkinData.medication_concern_today.trim();
    }
    
    if (checkinData.financial_stress_today) {
      enhancedCheckinData.financial_stress_today = parseInt(checkinData.financial_stress_today);
    }
    
    if (checkinData.financial_concern_today && checkinData.financial_concern_today.trim() !== '') {
      enhancedCheckinData.financial_concern_today = checkinData.financial_concern_today.trim();
    }
    
    if (checkinData.journey_readiness_today) {
      enhancedCheckinData.journey_readiness_today = parseInt(checkinData.journey_readiness_today);
    }
    
    if (checkinData.top_concern_today && checkinData.top_concern_today.trim() !== '') {
      enhancedCheckinData.top_concern_today = checkinData.top_concern_today.trim();
    }

    console.log('📊 Sending enhanced check-in to Airtable:', enhancedCheckinData);

    // Save to Airtable
    const result = await airtableRequest('DailyCheckins', 'POST', {
      fields: enhancedCheckinData
    });

    console.log('✅ Enhanced daily check-in saved successfully:', result.id);

    // Generate enhanced micro-insight
    const enhancedInsight = generateEnhancedMicroInsight(checkinData, user);
    
    console.log('🎯 Generated enhanced micro-insight:', enhancedInsight.title);

    // Track enhanced analytics
    const enhancedAnalytics = {
      user_id: [user.id],
      event_type: 'enhanced_checkin_completed',
      event_timestamp: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      mood_selected: checkinData.mood_today.split(', ').map(m => m.trim()),
      confidence_level: parseInt(checkinData.confidence_today),
      enhanced_fields: Object.keys(checkinData).filter(key => !['mood_today', 'confidence_today'].includes(key)),
      tracking_data: enhancedInsight.tracking_data
    };

    try {
      await trackFVMAnalytics(enhancedAnalytics);
      console.log('📈 Enhanced check-in analytics tracked successfully');
    } catch (analyticsError) {
      console.error('❌ Error tracking enhanced analytics:', analyticsError);
    }

    res.json({
      success: true,
      checkin: {
        id: result.id,
        mood_today: enhancedCheckinData.mood_today,
        confidence_today: enhancedCheckinData.confidence_today,
        date_submitted: enhancedCheckinData.date_submitted,
        enhanced_fields: Object.keys(checkinData).filter(key => !['mood_today', 'confidence_today'].includes(key)).length
      },
      enhanced_insight: enhancedInsight,
      message: 'Enhanced daily check-in completed successfully! 🌟✨'
    });

  } catch (error) {
    console.error('❌ Unexpected error in enhanced check-in:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

async function trackFVMAnalytics(analyticsData) {
  try {
    // Adjust to match schema - put non-standard fields in event_data
    if (analyticsData.enhanced_fields || analyticsData.tracking_data) {
      analyticsData.event_data = JSON.stringify({
        ...JSON.parse(analyticsData.event_data || '{}'),
        enhanced_fields: analyticsData.enhanced_fields,
        tracking_data: analyticsData.tracking_data
      });
      delete analyticsData.enhanced_fields;
      delete analyticsData.tracking_data;
    }
    // Remove confidence_scores if present, add to event_data
    if (analyticsData.confidence_scores) {
      let eventData = JSON.parse(analyticsData.event_data || '{}');
      eventData.confidence_scores = JSON.parse(analyticsData.confidence_scores);
      analyticsData.event_data = JSON.stringify(eventData);
      delete analyticsData.confidence_scores;
    }
    const result = await airtableRequest('FMVAnalytics', 'POST', { fields: analyticsData });
    return result;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    throw error;
  }
}

// Add Sentry error handler only if Sentry is initialized
if (sentryEnabled && Sentry && Sentry.Handlers) {
  app.use(Sentry.Handlers.errorHandler());
}

// NEW: Helper functions for medication status management

/**
 * Detect if cycle stage may need updating based on user behavior patterns
 */
function shouldCheckCycleStageUpdate(user) {
  // Check if it's been a while since user created account (>30 days)
  const accountAge = Date.now() - new Date(user.created_at).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  // Suggest cycle stage check if:
  // 1. Account is old (>30 days) - people progress through stages
  // 2. User is in transitional stages that typically change quickly
  return accountAge > thirtyDaysMs || 
         user.cycle_stage === 'stimulation' ||
         user.cycle_stage === 'retrieval' ||
         user.cycle_stage === 'transfer' ||
         user.cycle_stage === 'tww';
}

/**
 * Get human-readable label for cycle stage
 */
function getCycleStageLabel(stage) {
  const labels = {
    'considering': 'just considering IVF',
    'ivf_prep': 'preparing for IVF',
    'stimulation': 'in stimulation phase',
    'retrieval': 'around retrieval',
    'transfer': 'transfer stage',
    'tww': 'two-week wait',
    'pregnant': 'pregnant',
    'between_cycles': 'between cycles'
  };
  return labels[stage] || stage;
}

// NEW: Update user cycle stage
app.patch('/api/users/cycle-stage', authenticateToken, async (req, res) => {
  try {
    const { cycle_stage } = req.body;
    
    if (!cycle_stage) {
      return res.status(400).json({ 
        success: false, 
        error: 'cycle_stage is required' 
      });
    }

    // Validate cycle stage value
    const validStages = ['considering', 'ivf_prep', 'stimulation', 'retrieval', 'transfer', 'tww', 'pregnant', 'between_cycles'];
    if (!validStages.includes(cycle_stage)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid cycle stage' 
      });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Update user cycle stage
    const updateData = {
      cycle_stage,
      cycle_stage_updated: new Date().toISOString()
    };

    if (databaseAdapter.isUsingLocalDatabase()) {
      // SQLite update
      await databaseAdapter.updateUser(user.id, updateData);
    } else {
      // Airtable update
      const airtableUrl = `${config.airtable.baseUrl}/Users/${user.id}`;
      const response = await fetch(airtableUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: updateData })
      });

      if (!response.ok) {
        throw new Error('Failed to update user in Airtable');
      }
    }

    console.log(`✅ Updated cycle stage for ${req.user.email}: ${cycle_stage}`);

    // Calculate derived medication status for response
    const derivedMedicationStatus = getMedicationStatusFromCycleStage(cycle_stage);

    res.json({
      success: true,
      message: 'Cycle stage updated successfully',
      cycle_stage,
      derived_medication_status: derivedMedicationStatus,
      cycle_stage_updated: updateData.cycle_stage_updated
    });

  } catch (error) {
    console.error('❌ Error updating cycle stage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// NEW: Update user medication status
app.patch('/api/users/medication-status', authenticateToken, async (req, res) => {
  try {
    const { medication_status } = req.body;
    
    if (!medication_status) {
      return res.status(400).json({ 
        success: false, 
        error: 'medication_status is required' 
      });
    }

    // Validate medication status value
    const validStatuses = ['taking', 'starting_soon', 'not_taking', 'between_cycles', 'finished_treatment', 'pregnancy_support'];
    if (!validStatuses.includes(medication_status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid medication status' 
      });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Update user medication status
    const updateData = {
      medication_status,
      medication_status_updated: new Date().toISOString()
    };

    if (databaseAdapter.isUsingLocalDatabase()) {
      // SQLite update
      await databaseAdapter.updateUser(user.id, updateData);
    } else {
      // Airtable update
      const airtableUrl = `${config.airtable.baseUrl}/Users/${user.id}`;
      const response = await fetch(airtableUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: updateData })
      });

      if (!response.ok) {
        throw new Error('Failed to update user in Airtable');
      }
    }

    console.log(`✅ Updated medication status for ${req.user.email}: ${medication_status}`);

    res.json({
      success: true,
      message: 'Medication status updated successfully',
      medication_status,
      medication_status_updated: updateData.medication_status_updated
    });

  } catch (error) {
    console.error('❌ Error updating medication status:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack?.split('\n')[0],
      user: req.user?.email,
      updateData,
      isLocalDatabase: databaseAdapter.isUsingLocalDatabase()
    });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// NEW: Derive medication status from cycle stage for consistency
function getMedicationStatusFromCycleStage(cycleStage) {
  const medicationMapping = {
    'considering': 'not_taking',        // Just considering IVF
    'ivf_prep': 'starting_soon',        // Preparing for IVF
    'stimulation': 'taking',            // In stimulation phase - definitely on meds
    'retrieval': 'taking',              // Around retrieval - still on meds
    'transfer': 'taking',               // Transfer stage - on support meds
    'tww': 'taking',                    // Two-week wait - on support meds
    'pregnant': 'pregnancy_support',     // Pregnant - different med category
    'between_cycles': 'between_cycles'   // Between cycles - not on cycle meds
  };
  
  return medicationMapping[cycleStage] || 'not_taking';
}

// NEW: Get medication readiness/confidence question based on cycle stage
function getMedicationQuestionForCycleStage(cycleStage) {
  switch (cycleStage) {
    case 'considering':
    case 'ivf_prep':
      return {
        id: 'medication_readiness_today',
        type: 'slider',
        question: 'How prepared do you feel about the medication aspects of IVF?',
        context: 'medication_preparation'
      };
    
    case 'stimulation':
    case 'retrieval':
    case 'transfer':
    case 'tww':
      return {
        id: 'medication_confidence_today',
        type: 'slider', 
        question: 'How confident are you feeling about your current medications?',
        context: 'medication_active'
      };
    
    case 'pregnant':
      return {
        id: 'pregnancy_medication_confidence',
        type: 'slider',
        question: 'How confident are you feeling about your pregnancy support medications?',
        context: 'pregnancy_medications'
      };
    
    case 'between_cycles':
      return {
        id: 'cycle_preparation_confidence',
        type: 'slider',
        question: 'How prepared do you feel for your next cycle medications?',
        context: 'cycle_preparation'
      };
    
    default:
      return {
        id: 'medication_readiness_today',
        type: 'slider',
        question: 'How do you feel about the medication aspects of your journey?',
        context: 'medication_general'
      };
  }
}

module.exports = app;