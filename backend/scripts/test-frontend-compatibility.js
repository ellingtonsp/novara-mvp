#!/usr/bin/env node

/**
 * Test all frontend API endpoints for compatibility
 */

const axios = require('axios');

async function testFrontendCompatibility() {
  const API_URL = 'https://novara-staging-staging.up.railway.app';
  let token = '';
  let userId = '';
  
  const tests = [];
  
  try {
    // 1. Test Authentication
    console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS\n');
    
    // Login
    console.log('1. Testing POST /api/auth/login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'uat-user-1@staging.com'
      });
      token = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      console.log('✅ Login successful');
      tests.push({ endpoint: 'POST /api/auth/login', status: 'PASS' });
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'POST /api/auth/login', status: 'FAIL', error: error.message });
    }
    
    // Get Profile
    console.log('\n2. Testing GET /api/users/me...');
    try {
      const profileResponse = await axios.get(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Profile retrieved:', profileResponse.data.user.email);
      tests.push({ endpoint: 'GET /api/users/me', status: 'PASS' });
    } catch (error) {
      console.error('❌ Profile failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/users/me', status: 'FAIL', error: error.message });
    }
    
    // 2. Test Check-in Endpoints
    console.log('\n📝 TESTING CHECK-IN ENDPOINTS\n');
    
    // Submit Check-in
    console.log('3. Testing POST /api/checkins...');
    try {
      const checkinResponse = await axios.post(`${API_URL}/api/checkins`, {
        mood_today: 'hopeful',
        confidence_today: 8,
        user_note: 'Frontend compatibility test',
        medication_taken: 'yes'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Check-in submitted');
      tests.push({ endpoint: 'POST /api/checkins', status: 'PASS' });
    } catch (error) {
      console.error('❌ Check-in failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'POST /api/checkins', status: 'FAIL', error: error.message });
    }
    
    // Get Check-ins
    console.log('\n4. Testing GET /api/checkins?limit=7...');
    try {
      const checkinsResponse = await axios.get(`${API_URL}/api/checkins?limit=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Retrieved ${checkinsResponse.data.records.length} check-ins`);
      tests.push({ endpoint: 'GET /api/checkins', status: 'PASS' });
    } catch (error) {
      console.error('❌ Get check-ins failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/checkins', status: 'FAIL', error: error.message });
    }
    
    // 3. Test Insights Endpoints
    console.log('\n💡 TESTING INSIGHTS ENDPOINTS\n');
    
    // Daily Insights
    console.log('5. Testing GET /api/insights/daily...');
    try {
      const insightsResponse = await axios.get(`${API_URL}/api/insights/daily`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Daily insight retrieved:', insightsResponse.data.insight?.type);
      tests.push({ endpoint: 'GET /api/insights/daily', status: 'PASS' });
    } catch (error) {
      console.error('❌ Daily insights failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/insights/daily', status: 'FAIL', error: error.message });
    }
    
    // Micro Insights
    console.log('\n6. Testing GET /api/insights/micro...');
    try {
      const microResponse = await axios.get(`${API_URL}/api/insights/micro`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Micro insight retrieved:', microResponse.data.insight?.message);
      tests.push({ endpoint: 'GET /api/insights/micro', status: 'PASS' });
    } catch (error) {
      console.error('❌ Micro insights failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/insights/micro', status: 'FAIL', error: error.message });
    }
    
    // Engagement Tracking
    console.log('\n7. Testing POST /api/insights/engagement...');
    try {
      const engagementResponse = await axios.post(`${API_URL}/api/insights/engagement`, {
        insight_id: 'test_insight_123',
        action: 'viewed',
        context: { source: 'frontend_test' }
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Engagement tracked');
      tests.push({ endpoint: 'POST /api/insights/engagement', status: 'PASS' });
    } catch (error) {
      console.error('❌ Engagement tracking failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'POST /api/insights/engagement', status: 'FAIL', error: error.message });
    }
    
    // 4. Test V2 Endpoints
    console.log('\n🆕 TESTING V2 ENDPOINTS\n');
    
    // V2 Status
    console.log('8. Testing GET /api/v2/status...');
    try {
      const v2StatusResponse = await axios.get(`${API_URL}/api/v2/status`);
      console.log('✅ V2 status:', v2StatusResponse.data.status);
      tests.push({ endpoint: 'GET /api/v2/status', status: 'PASS' });
    } catch (error) {
      console.error('❌ V2 status failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/v2/status', status: 'FAIL', error: error.message });
    }
    
    // Daily Summary
    console.log('\n9. Testing GET /api/v2/health/daily-summary...');
    try {
      const summaryResponse = await axios.get(`${API_URL}/api/v2/health/daily-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Daily summary retrieved');
      tests.push({ endpoint: 'GET /api/v2/health/daily-summary', status: 'PASS' });
    } catch (error) {
      console.error('❌ Daily summary failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'GET /api/v2/health/daily-summary', status: 'FAIL', error: error.message });
    }
    
    // Health Events
    console.log('\n10. Testing POST /api/v2/health/events...');
    try {
      const eventResponse = await axios.post(`${API_URL}/api/v2/health/events`, {
        event_type: 'test_event',
        event_data: { test: true }
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Health event created');
      tests.push({ endpoint: 'POST /api/v2/health/events', status: 'PASS' });
    } catch (error) {
      console.error('❌ Health event failed:', error.response?.data || error.message);
      tests.push({ endpoint: 'POST /api/v2/health/events', status: 'FAIL', error: error.message });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY\n');
  console.log('Endpoint'.padEnd(40) + 'Status');
  console.log('-'.repeat(50));
  
  let passCount = 0;
  tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(test.endpoint.padEnd(40) + status);
    if (test.status === 'PASS') passCount++;
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${tests.length} | Passed: ${passCount} | Failed: ${tests.length - passCount}`);
  
  if (passCount === tests.length) {
    console.log('\n🎉 All frontend API endpoints are compatible!');
  } else {
    console.log('\n⚠️  Some endpoints need attention');
  }
}

testFrontendCompatibility();