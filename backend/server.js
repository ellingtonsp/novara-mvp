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

// Enhanced Airtable API Helper with detailed logging
async function airtableRequest(endpoint, method = 'GET', data = null) {
  const url = `${config.airtable.baseUrl}/${endpoint}`;
  
  console.log(`=== AIRTABLE ${method} REQUEST ===`);
  console.log('URL:', url);
  console.log('Data being sent:', JSON.stringify(data, null, 2));
  
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
  const responseText = await response.text();
  
  console.log('Response status:', response.status);
  console.log('Response body:', responseText);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = JSON.parse(responseText);
      console.log('Parsed error:', JSON.stringify(errorDetails, null, 2));
    } catch (e) {
      console.log('Could not parse error as JSON');
    }
    throw new Error(`Airtable ${method} failed: ${response.status} - ${responseText}`);
  }
  
  return JSON.parse(responseText);
}

// Micro-Insight Engine
function generateMicroInsight(userData) {
  const { confidence_meds, confidence_costs, confidence_overall, primary_need } = userData;
  
  if (confidence_meds && confidence_meds <= 3) {
    return {
      title: "About IVF medications",
      message: "It sounds like you might have concerns about IVF medications. That's extremely common — we'll aim to demystify the process, one step at a time."
    };
  }
  
  if (confidence_costs && confidence_costs <= 3) {
    return {
      title: "Managing financial stress",
      message: "Financial concerns during fertility treatment can feel overwhelming. You're not alone in this worry."
    };
  }
  
  if (confidence_overall && confidence_overall <= 3) {
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

// Create User - Updated with full schema support
app.post('/api/users', async (req, res) => {
  try {
    console.log('=== CREATE USER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Build user data object with all supported fields
    const userData = {};
    
    // Required fields
    if (req.body.email) userData.email = req.body.email;
    if (req.body.nickname) userData.nickname = req.body.nickname;
    
    // Rating fields (convert to integers for Airtable Rating type)
    if (req.body.confidence_meds !== undefined) {
      userData.confidence_meds = parseInt(req.body.confidence_meds);
    }
    if (req.body.confidence_costs !== undefined) {
      userData.confidence_costs = parseInt(req.body.confidence_costs);
    }
    if (req.body.confidence_overall !== undefined) {
      userData.confidence_overall = parseInt(req.body.confidence_overall);
    }
    
    // Text fields
    if (req.body.primary_need) userData.primary_need = req.body.primary_need;
    if (req.body.cycle_stage) userData.cycle_stage = req.body.cycle_stage;
    if (req.body.top_concern) userData.top_concern = req.body.top_concern;
    if (req.body.timezone) userData.timezone = req.body.timezone;
    
    // System fields
    userData.created_at = new Date().toISOString();
    userData.email_opt_in = req.body.email_opt_in !== undefined ? req.body.email_opt_in : true;
    userData.status = req.body.status || 'active';

    console.log('Processed user data:', JSON.stringify(userData, null, 2));

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

// Debug endpoint to test minimal user creation
app.post('/api/debug/minimal-user', async (req, res) => {
  try {
    console.log('=== DEBUG MINIMAL USER ===');
    
    const minimalData = {
      email: req.body.email || `test-${Date.now()}@example.com`,
      nickname: req.body.nickname || 'TestUser'
    };
    
    console.log('Creating minimal user:', minimalData);
    
    const result = await airtableRequest('Users', 'POST', {
      fields: minimalData
    });

    res.json({ 
      success: true, 
      user: { id: result.id, ...result.fields },
      message: 'Minimal user created successfully'
    });
  } catch (error) {
    console.error('Debug minimal user error:', error);
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
