// Novara Complete API Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Trust Railway proxy
app.set('trust proxy', true);

// Middleware
app.use(cors());
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
      primary_need: req.body.primary_need,
      cycle_stage: req.body.cycle_stage,
      top_concern: req.body.top_concern,
      timezone: req.body.timezone,
      created_at: new Date().toISOString(),
      email_opt_in: true,
      status: 'active'
    };

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
      date_submitted: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
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

module.exports = app;
