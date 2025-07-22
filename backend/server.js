// Novara Complete API Server with JWT Authentication
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

// Micro-Insight Engine
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

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Novara API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      users: '/api/users',
      checkins: '/api/checkins',
      insights: '/api/users/:id/insight'
    },
    docs: 'https://github.com/ellingtonsp/novara-mvp'
  });
});

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

// Authentication Routes

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

// Daily Check-ins (Protected Route)
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

// Get User Insight (Protected Route)
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
      'GET /api/users/insight': 'Get user insight (protected)',
      'GET /api/checkins-test': 'This test endpoint'
    },
    authentication: 'JWT Bearer Token required for protected routes',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔐 JWT Authentication enabled`);
});

module.exports = app;