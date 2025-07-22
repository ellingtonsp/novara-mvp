// Novara Complete API Server with JWT Authentication + Daily Insight Engine v1
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// JWT Secret - make sure to set this in your Railway environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Trust Railway proxy
app.set('trust proxy', true);

// CORS - Allow GitHub Pages and localhost
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ellingtonsp.github.io'
  ],
  credentials: true
}));

app.use(express.json());

// Environment Configuration
const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
  }
};

// Airtable API Helper
async function airtableRequest(endpoint, method = 'GET', data = null) {
  const url = `${config.airtable.baseUrl}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${config.airtable.apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Airtable ${method} failed: ${response.statusText}`);
  }
  return response.json();
}

// User Lookup Helper
async function findUserByEmail(email) {
  try {
    const response = await fetch(
      `${config.airtable.baseUrl}/Users?filterByFormula={email}='${email}'`,
      {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      }
    );
    
    const result = await response.json();
    
    if (result.records && result.records.length > 0) {
      return {
        id: result.records[0].id,
        ...result.records[0].fields
      };
    }
    return null;
  } catch (error) {
    console.error('User lookup error:', error);
    return null;
  }
}

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
    { expiresIn: '30d' } // Token expires in 30 days
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

// Advanced Insight Generation Engine
function generateDailyInsights(checkins, user) {
  if (!checkins || checkins.length === 0) {
    return {
      type: 'welcome',
      title: 'Welcome back!',
      message: "We're here to support you on this journey. Consider sharing how you're feeling today.",
      confidence: 0.9
    };
  }

  // Analyze patterns from recent check-ins
  const analysis = analyzeUserPatterns(checkins, user);
  
  // Generate insight based on strongest pattern
  return selectBestInsight(analysis, checkins, user);
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: process.env.NODE_ENV || 'production',
    airtable: config.airtable.apiKey ? 'connected' : 'not configured',
    jwt: JWT_SECRET ? 'configured' : 'not configured'
  });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Login (for existing users)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Find user in Airtable
    const user = await findUserByEmail(email);
    
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
app.post('/api/users', async (req, res) => {
  try {
    const userData = {
      email: req.body.email,
      nickname: req.body.nickname,
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
    const existingUser = await findUserByEmail(userData.email);
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

// ============================================================================
// DAILY CHECK-INS ROUTES
// ============================================================================

// Submit Daily Check-in (Protected Route)
app.post('/api/checkins', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Daily check-in submission received:', req.body);

    const { 
      mood_today, 
      primary_concern_today, 
      confidence_today, 
      user_note 
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

    console.log('📊 Sending to Airtable DailyCheckins:', checkinData);

    // Create record in Airtable DailyCheckins table
    const result = await airtableRequest('DailyCheckins', 'POST', {
      fields: checkinData
    });

    console.log('✅ Daily check-in saved successfully:', result.id);

    // Return success response with the created record
    res.status(201).json({
      success: true,
      checkin: {
        id: result.id,
        mood_today: result.fields.mood_today,
        confidence_today: result.fields.confidence_today,
        date_submitted: result.fields.date_submitted,
        created_at: result.fields.created_at
      },
      message: 'Daily check-in completed successfully! 🌟'
    });

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

    // Fetch user's recent check-ins from Airtable using record ID
    const response = await fetch(
      `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('${user.id}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Airtable error fetching check-ins:', result);
      return res.status(422).json({ 
        success: false, 
        error: 'Failed to retrieve check-ins from database' 
      });
    }

    // Transform Airtable records for frontend consumption
    const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today,
      primary_concern_today: record.fields.primary_concern_today,
      confidence_today: record.fields.confidence_today,
      user_note: record.fields.user_note,
      date_submitted: record.fields.date_submitted,
      created_at: record.fields.created_at
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

    // Get recent check-ins (last 7 days)
    const response = await fetch(
      `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('${user.id}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=7`,
      {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Airtable error fetching check-ins for insights:', result);
      return res.status(422).json({ 
        success: false, 
        error: 'Failed to retrieve check-ins for analysis' 
      });
    }

    const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today,
      primary_concern_today: record.fields.primary_concern_today,
      confidence_today: record.fields.confidence_today,
      user_note: record.fields.user_note,
      date_submitted: record.fields.date_submitted,
      created_at: record.fields.created_at
    }));

    // Generate insights using the new engine
    const insight = generateDailyInsights(checkins, user);
    
    console.log(`✅ Generated insight type: ${insight.type} for user: ${req.user.email}`);

    res.json({
      success: true,
      insight,
      analysis_data: {
        checkins_analyzed: checkins.length,
        date_range: checkins.length > 0 ? 
          `${checkins[checkins.length - 1].date_submitted} to ${checkins[0].date_submitted}` : 
          'No recent check-ins',
        user_id: user.id
      }
    });

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

    // Create engagement record
    // Note: You can create an "InsightEngagement" table in Airtable later for full tracking
    const engagementData = {
      user_id: [user.id],
      insight_type,
      action, // 'viewed', 'clicked', 'dismissed', 'refreshed'
      insight_id: insight_id || '',
      timestamp: new Date().toISOString(),
      date_submitted: new Date().toISOString().split('T')[0]
    };

    // For now, just log engagement - you can create InsightEngagement table later
    console.log('📈 Insight engagement tracked:', engagementData);

    res.json({
      success: true,
      message: 'Engagement tracked successfully',
      engagement: {
        user_id: user.id,
        insight_type,
        action,
        timestamp: engagementData.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error tracking insight engagement:', error);
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

app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔐 JWT Authentication enabled`);
  console.log(`🧠 Daily Insight Engine v1 enabled`);
});

module.exports = app;