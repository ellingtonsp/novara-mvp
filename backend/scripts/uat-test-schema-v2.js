#!/usr/bin/env node

/**
 * UAT Test Script for Schema V2
 * 
 * Comprehensive user acceptance tests for the new event-sourced architecture
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const STAGING_URL = process.env.STAGING_URL || 'https://novara-staging-staging.up.railway.app';
const JWT_SECRET = process.env.JWT_SECRET || 'staging_super_secret_jwt_key_different_from_prod';

// Test users
const testUsers = [
  {
    email: 'uat-user-1@staging.com',
    name: 'UAT User 1',
    expectedData: {
      nickname: 'UAT User 1',
      primary_need: 'track_mood',
      cycle_stage: 'stable',
      confidence_meds: 8
    }
  },
  {
    email: 'uat-user-2@staging.com',
    name: 'UAT User 2',
    expectedData: {
      nickname: 'UAT User 2',
      primary_need: 'medication_adherence',
      cycle_stage: 'adjusting',
      confidence_meds: 6
    }
  }
];

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) console.log(`   ${details}`);
  testResults.tests.push({ name, passed, details });
}

async function testUserFlow(userConfig) {
  console.log(`\n🧪 Testing ${userConfig.name} Flow\n`);
  
  try {
    // 1. Authentication
    console.log('1️⃣ Authentication Test');
    const loginResponse = await axios.post(`${STAGING_URL}/api/auth/login`, {
      email: userConfig.email
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      recordTest('User login', true, `Token received for ${userConfig.email}`);
      
      const token = loginResponse.data.token;
      const authHeaders = { 'Authorization': `Bearer ${token}` };
      
      // Verify user data
      const userData = loginResponse.data.user;
      let userDataCorrect = true;
      Object.entries(userConfig.expectedData).forEach(([key, value]) => {
        if (userData[key] !== value) {
          userDataCorrect = false;
          recordTest(`User data: ${key}`, false, `Expected ${value}, got ${userData[key]}`);
        }
      });
      if (userDataCorrect) {
        recordTest('User data verification', true);
      }
      
      // 2. Create daily check-in (backward compatibility)
      console.log('\n2️⃣ Daily Check-in Test (V1 API)');
      const checkinData = {
        mood_today: 'hopeful',
        confidence_today: 8,
        medication_taken: 'yes',
        user_note: `UAT test check-in for ${userConfig.name}`,
        primary_concern_today: 'Test concern',
        date_submitted: new Date().toISOString().split('T')[0]
      };
      
      try {
        const checkinResponse = await axios.post(
          `${STAGING_URL}/api/checkins`,
          checkinData,
          { headers: authHeaders }
        );
        
        recordTest('Create check-in (V1 API)', checkinResponse.data.success);
        
        // Verify check-in retrieval
        const getCheckinsResponse = await axios.get(
          `${STAGING_URL}/api/checkins`,
          { headers: authHeaders }
        );
        
        const hasCheckin = getCheckinsResponse.data.checkins?.length > 0;
        recordTest('Retrieve check-ins', hasCheckin, 
          `Found ${getCheckinsResponse.data.checkins?.length || 0} check-ins`);
        
      } catch (checkinError) {
        recordTest('Create check-in (V1 API)', false, checkinError.response?.data?.error || checkinError.message);
      }
      
      // 3. Test Schema V2 endpoints
      console.log('\n3️⃣ Schema V2 API Tests');
      
      // Health timeline
      try {
        const timelineResponse = await axios.get(
          `${STAGING_URL}/api/v2/health/timeline?limit=10`,
          { headers: authHeaders }
        );
        
        recordTest('Health timeline API', true, 
          `Retrieved ${timelineResponse.data.timeline?.length || 0} events`);
        
      } catch (timelineError) {
        recordTest('Health timeline API', false, timelineError.response?.data?.error || timelineError.message);
      }
      
      // Analytics
      try {
        const analyticsResponse = await axios.get(
          `${STAGING_URL}/api/v2/analytics?timeframe=week`,
          { headers: authHeaders }
        );
        
        recordTest('Analytics API', true, 
          `Schema: ${analyticsResponse.data.schema_version}`);
        
      } catch (analyticsError) {
        recordTest('Analytics API', false, analyticsError.response?.data?.error || analyticsError.message);
      }
      
      // Daily summary
      try {
        const summaryResponse = await axios.get(
          `${STAGING_URL}/api/v2/health/daily-summary`,
          { headers: authHeaders }
        );
        
        recordTest('Daily summary API', true);
        
      } catch (summaryError) {
        recordTest('Daily summary API', false, summaryError.response?.data?.error || summaryError.message);
      }
      
      // 4. Test insights
      console.log('\n4️⃣ Insights Test');
      try {
        const insightsResponse = await axios.get(
          `${STAGING_URL}/api/insights/daily`,
          { headers: authHeaders }
        );
        
        recordTest('Daily insights', insightsResponse.data.success, 
          `Generated: ${insightsResponse.data.insight?.title || 'No insight'}`);
        
      } catch (insightError) {
        recordTest('Daily insights', false, insightError.response?.data?.error || insightError.message);
      }
      
    } else {
      recordTest('User login', false, 'No token received');
    }
    
  } catch (error) {
    recordTest(`${userConfig.name} flow`, false, error.response?.data?.error || error.message);
  }
}

async function runPerformanceTests() {
  console.log('\n🚀 Performance Tests\n');
  
  const endpoints = [
    { name: 'Health check', url: '/api/health', auth: false },
    { name: 'Login', url: '/api/auth/login', method: 'POST', body: { email: testUsers[0].email }, auth: false },
    { name: 'V2 Status', url: '/api/v2/status', auth: true },
    { name: 'Analytics', url: '/api/v2/analytics', auth: true }
  ];
  
  // Get auth token for protected endpoints
  const loginRes = await axios.post(`${STAGING_URL}/api/auth/login`, { 
    email: testUsers[0].email 
  });
  const token = loginRes.data.token;
  
  for (const endpoint of endpoints) {
    const start = Date.now();
    
    try {
      const config = {
        method: endpoint.method || 'GET',
        url: `${STAGING_URL}${endpoint.url}`,
        timeout: 5000
      };
      
      if (endpoint.auth) {
        config.headers = { 'Authorization': `Bearer ${token}` };
      }
      
      if (endpoint.body) {
        config.data = endpoint.body;
      }
      
      await axios(config);
      const duration = Date.now() - start;
      
      const passed = duration < 1000; // Under 1 second
      recordTest(`Performance: ${endpoint.name}`, passed, `${duration}ms`);
      
    } catch (error) {
      recordTest(`Performance: ${endpoint.name}`, false, 'Failed');
    }
  }
}

async function runUATTests() {
  console.log('🔍 Schema V2 UAT Test Suite');
  console.log('📍 Target:', STAGING_URL);
  console.log('📅 Date:', new Date().toISOString());
  console.log('=' .repeat(60));
  
  try {
    // Test each user flow
    for (const user of testUsers) {
      await testUserFlow(user);
    }
    
    // Run performance tests
    await runPerformanceTests();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UAT TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }
    
    console.log('\n💡 Recommendations:');
    if (testResults.failed === 0) {
      console.log('  ✅ All tests passed! Ready for production deployment.');
    } else {
      console.log('  ⚠️ Some tests failed. Review and fix issues before production deployment.');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ UAT test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runUATTests();
}