// Novara Complete API Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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
      return result.records[0].id; // Return Airtable record ID
    }
    return null;
  } catch (error) {
    console.error('User lookup error:', error);
    return null;
  }
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
      users: '/api/users',
      checkins: '/api/checkins',
      insights: '/api/users/:id/insight',
      debug: '/api/debug-user/:email'
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
    airtable: config.airtable.apiKey ? 'connected' : 'not configured'
  });
});

// Debug User Lookup
app.get('/api/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`🔍 Debug: Looking up user: ${email}`);
    
    const userRecordId = await findUserByEmail(email);
    
    res.json({
      success: true,
      email: email,
      found: userRecordId !== null,
      recordId: userRecordId
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Create User
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

    const result = await airtableRequest('Users', 'POST', {
      fields: userData
    });

    res.status(201).json({ 
      success: true, 
      user: { id: result.id, ...result.fields },
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

// Get User
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await airtableRequest(`Users/${req.params.id}`);
    res.json({ 
      success: true, 
      user: { id: result.id, ...result.fields }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ 
      success: false, 
      error: 'User not found' 
    });
  }
});

// Daily Check-ins - UNIFIED ENDPOINT
app.post('/api/checkins', async (req, res) => {
  try {
    console.log('📝 Daily check-in submission received:', req.body);

    const { 
      mood_today, 
      primary_concern_today, 
      confidence_today, 
      user_note, 
      user_id 
    } = req.body;

    // Validation - ensure required fields are present
    if (!mood_today || !confidence_today || !user_id) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: mood_today, confidence_today, and user_id are required' 
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

    // Find user record in Airtable
    const userRecordId = await findUserByEmail(user_id);
    
    if (!userRecordId) {
      console.error('❌ User not found:', user_id);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please sign up first.' 
      });
    }

    console.log('✅ Found user record:', userRecordId);

    // Prepare data for Airtable DailyCheckins table
    const checkinData = {
      user_id: [userRecordId], // Array format for linked records
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

// Get User's Recent Check-ins
app.get('/api/checkins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 7 } = req.query; // Default to last 7 days

    console.log(`📈 Fetching recent check-ins for user: ${userId}`);

    // Find user first
    const userRecordId = await findUserByEmail(userId);
    
    if (!userRecordId) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Fetch user's recent check-ins from Airtable using record ID
    const response = await fetch(
      `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('${userRecordId}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`,
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

    console.log(`✅ Retrieved ${checkins.length} check-ins for user: ${userId}`);

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

// Get User Insight
app.get('/api/users/:id/insight', async (req, res) => {
  try {
    const user = await airtableRequest(`Users/${req.params.id}`);
    const insight = generateMicroInsight(user.fields);
    
    res.json({ 
      success: true, 
      insight,
      user_id: req.params.id
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
      'POST /api/checkins': 'Submit daily check-in',
      'GET /api/checkins/:userId': 'Get user check-in history',
      'GET /api/debug-user/:email': 'Debug user lookup',
      'GET /api/checkins-test': 'This test endpoint'
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;