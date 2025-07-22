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
      checkins: '/api/checkins/daily',
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
    airtable: config.airtable.apiKey ? 'connected' : 'not configured'
  });
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

// Create Daily Check-in
app.post('/api/checkins/daily', async (req, res) => {
  try {
    const checkinData = {
      user_id: [req.body.user_id],
      mood_today: req.body.mood_today,
      primary_concern_today: req.body.primary_concern_today || [],
      confidence_today: req.body.confidence_today || 5,
      user_note: req.body.user_note || '',
      date_submitted: new Date().toISOString().split('T')[0]
    };

    const result = await airtableRequest('DailyCheckins', 'POST', {
      fields: checkinData
    });

    res.status(201).json({ 
      success: true, 
      checkin: { id: result.id, ...result.fields },
      message: 'Daily check-in saved successfully'
    });
  } catch (error) {
    console.error('Create daily check-in error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

// Daily Check-ins API Route
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

    // Prepare data for Airtable DailyCheckins table
    const checkinData = {
      mood_today,
      primary_concern_today: primary_concern_today || '', // Optional field
      confidence_today: parseInt(confidence_today),
      user_note: user_note || '', // Optional field
      user_id,
      date_submitted: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      // created_at will be auto-populated by Airtable
    };

    console.log('📊 Sending to Airtable DailyCheckins:', checkinData);

    // Create record in Airtable DailyCheckins table
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/DailyCheckins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: checkinData
      })
    });

    const airtableResult = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error('❌ Airtable error:', airtableResult);
      return res.status(422).json({ 
        success: false, 
        error: 'Failed to save check-in to database',
        details: airtableResult.error
      });
    }

    console.log('✅ Daily check-in saved successfully:', airtableResult.id);

    // Return success response with the created record
    res.status(201).json({
      success: true,
      checkin: {
        id: airtableResult.id,
        mood_today: airtableResult.fields.mood_today,
        confidence_today: airtableResult.fields.confidence_today,
        date_submitted: airtableResult.fields.date_submitted,
        created_at: airtableResult.fields.created_at
      },
      message: 'Daily check-in completed successfully! 🌟'
    });

  } catch (error) {
    console.error('❌ Unexpected error in /api/checkins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Optional: GET endpoint to retrieve user's recent check-ins
app.get('/api/checkins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 7 } = req.query; // Default to last 7 days

    console.log(`📈 Fetching recent check-ins for user: ${userId}`);

    // Fetch user's recent check-ins from Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/DailyCheckins?filterByFormula=AND({user_id}='${userId}')&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        }
      }
    );

    const airtableResult = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error('❌ Airtable error fetching check-ins:', airtableResult);
      return res.status(422).json({ 
        success: false, 
        error: 'Failed to retrieve check-ins from database' 
      });
    }

    // Transform Airtable records for frontend consumption
    const checkins = airtableResult.records.map(record => ({
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

// Test endpoint to verify DailyCheckins API is working
app.get('/api/checkins-test', (req, res) => {
  res.json({
    success: true,
    message: 'Daily Check-ins API is working! 🎯',
    endpoints: {
      'POST /api/checkins': 'Submit daily check-in',
      'GET /api/checkins/:userId': 'Get user check-in history',
      'GET /api/checkins-test': 'This test endpoint'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = app;