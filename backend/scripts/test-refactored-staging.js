#!/usr/bin/env node

/**
 * Comprehensive test for refactored server on staging
 */

const axios = require('axios');

const API_URL = 'https://novara-staging-staging.up.railway.app';
const TEST_USER_EMAIL = 'uat-user-1@staging.com';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('\n🧪 REFACTORED SERVER STAGING TEST SUITE\n', 'blue');
  
  let token = null;
  let userId = null;
  let passedTests = 0;
  let failedTests = 0;
  
  const tests = [
    // Health checks
    {
      name: 'Health Check',
      endpoint: '/api/health',
      method: 'GET',
      validateResponse: (data) => {
        return data.status === 'ok' && 
               data.version === '2.0.0' && // Refactored server version
               data.service === 'Novara API';
      }
    },
    
    {
      name: 'Detailed Health Check',
      endpoint: '/api/health/detailed',
      method: 'GET',
      validateResponse: (data) => {
        return data.status === 'ok' && 
               data.checks.database === 'postgresql' &&
               data.checks.schemaV2 === 'enabled';
      }
    },
    
    // Authentication
    {
      name: 'User Login',
      endpoint: '/api/auth/login',
      method: 'POST',
      data: { email: TEST_USER_EMAIL },
      validateResponse: (data) => {
        token = data.token;
        userId = data.user.id;
        return data.success === true && 
               !!data.token && 
               data.user.email === TEST_USER_EMAIL;
      }
    },
    
    // User endpoints
    {
      name: 'Get User Profile',
      endpoint: '/api/users/me',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               data.user.email === TEST_USER_EMAIL;
      }
    },
    
    {
      name: 'Get User Metrics',
      endpoint: '/api/users/metrics',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               typeof data.metrics.total_checkins === 'number';
      }
    },
    
    // Check-in endpoints
    {
      name: 'Submit Check-in',
      endpoint: '/api/checkins',
      method: 'POST',
      auth: true,
      data: {
        mood_today: 'confident',
        confidence_today: 8,
        medication_taken: 'yes',
        user_note: 'Testing refactored server on staging',
        date_submitted: new Date().toISOString().split('T')[0]
      },
      validateResponse: (data) => {
        return (data.success === true && data.checkin.id) ||
               (data.error && data.error.includes('already submitted'));
      }
    },
    
    {
      name: 'Get Check-ins',
      endpoint: '/api/checkins',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               Array.isArray(data.checkins) &&
               data.count >= 0;
      }
    },
    
    {
      name: 'Get User Check-ins',
      endpoint: () => `/api/checkins/user/${userId}`, // Dynamic endpoint
      method: 'GET',
      auth: true,
      skipIfNoUserId: true,
      validateResponse: (data) => {
        return data.success === true && 
               Array.isArray(data.records);
      }
    },
    
    // Insights endpoints
    {
      name: 'Get Daily Insights',
      endpoint: '/api/insights/daily',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return (data.success === true && data.insight) ||
               (data.error && data.requires_onboarding_completion);
      }
    },
    
    {
      name: 'Get Saved Insights',
      endpoint: '/api/insights',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               Array.isArray(data.insights);
      }
    },
    
    {
      name: 'Get Engagement Insights',
      endpoint: '/api/insights/engagement',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               data.engagement &&
               data.engagement.summary;
      }
    },
    
    // V2 endpoints
    {
      name: 'V2 Status',
      endpoint: '/api/v2/status',
      method: 'GET',
      auth: true,
      validateResponse: (data) => {
        return data.success === true && 
               data.status.schema_v2_enabled === true;
      }
    }
  ];
  
  // Run each test
  for (const test of tests) {
    if (test.skipIfNoUserId && !userId) {
      log(`⏭️  Skipping: ${test.name} (no userId available)`, 'yellow');
      continue;
    }
    
    try {
      const endpoint = typeof test.endpoint === 'function' ? test.endpoint() : test.endpoint;
      const config = {
        method: test.method,
        url: `${API_URL}${endpoint}`,
        ...(test.data && { data: test.data }),
        ...(test.auth && token && { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      };
      
      const response = await axios(config);
      
      if (test.validateResponse(response.data)) {
        log(`✅ PASS: ${test.name}`, 'green');
        passedTests++;
      } else {
        log(`❌ FAIL: ${test.name} - Invalid response`, 'red');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        failedTests++;
      }
    } catch (error) {
      if (error.response?.status === 409 && test.name === 'Submit Check-in') {
        // Expected if check-in already exists for today
        log(`✅ PASS: ${test.name} (check-in already exists)`, 'green');
        passedTests++;
      } else {
        log(`❌ FAIL: ${test.name} - ${error.message}`, 'red');
        if (error.response) {
          console.log('   Status:', error.response.status);
          console.log('   Response:', error.response.data);
        }
        failedTests++;
      }
    }
  }
  
  // Summary
  log('\n📊 TEST SUMMARY', 'blue');
  log(`   Total Tests: ${passedTests + failedTests}`);
  log(`   Passed: ${passedTests}`, 'green');
  log(`   Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed! Refactored server is working correctly on staging.\n', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
  
  // Performance comparison
  log('📈 PERFORMANCE CHECK', 'blue');
  const startTime = Date.now();
  await axios.get(`${API_URL}/api/health`);
  const responseTime = Date.now() - startTime;
  log(`   Health check response time: ${responseTime}ms`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});