#!/usr/bin/env node

/**
 * Test the refactored server structure
 */

const axios = require('axios');

// Set environment variables for testing
process.env.DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";
process.env.USE_SCHEMA_V2 = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '9003'; // Different port to avoid conflicts

console.log('🧪 Starting refactored server test...\n');

// Start the server
require('./server-refactored');

// Wait for server to initialize
setTimeout(async () => {
  const baseURL = 'http://localhost:9003';
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // 2. Test detailed health
    console.log('\n2. Testing detailed health...');
    const detailedHealth = await axios.get(`${baseURL}/api/health/detailed`);
    console.log('✅ Detailed health:', detailedHealth.data.checks);
    
    // 3. Test login
    console.log('\n3. Testing login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'uat-user-1@staging.com'
    });
    console.log('✅ Login successful:', {
      user: loginResponse.data.user.nickname,
      hasToken: !!loginResponse.data.token
    });
    
    const token = loginResponse.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    
    // 4. Test user profile
    console.log('\n4. Testing user profile...');
    const profileResponse = await axios.get(`${baseURL}/api/users/me`, authHeaders);
    console.log('✅ User profile:', {
      email: profileResponse.data.user.email,
      nickname: profileResponse.data.user.nickname
    });
    
    // 5. Test check-in submission
    console.log('\n5. Testing check-in submission...');
    const checkinData = {
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Testing refactored server',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    try {
      const checkinResponse = await axios.post(
        `${baseURL}/api/checkins`, 
        checkinData, 
        authHeaders
      );
      console.log('✅ Check-in created:', {
        id: checkinResponse.data.checkin.id,
        mood: checkinResponse.data.checkin.mood_today
      });
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  Check-in already exists for today (expected)');
      } else {
        throw error;
      }
    }
    
    // 6. Test get check-ins
    console.log('\n6. Testing get check-ins...');
    const checkinsResponse = await axios.get(`${baseURL}/api/checkins`, authHeaders);
    console.log('✅ Retrieved check-ins:', {
      count: checkinsResponse.data.count,
      latest: checkinsResponse.data.checkins[0]?.date_submitted
    });
    
    // 7. Test user metrics
    console.log('\n7. Testing user metrics...');
    const metricsResponse = await axios.get(`${baseURL}/api/users/metrics`, authHeaders);
    console.log('✅ User metrics:', {
      totalCheckins: metricsResponse.data.metrics.total_checkins,
      adherenceRate: metricsResponse.data.metrics.medication_adherence_rate
    });
    
    console.log('\n🎉 All tests passed! Refactored server is working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}, 2000); // Wait 2 seconds for server to start