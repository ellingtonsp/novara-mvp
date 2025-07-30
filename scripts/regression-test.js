#!/usr/bin/env node

/**
 * Comprehensive Regression Test Suite for Novara MVP
 * 
 * This script tests all API endpoints and critical functionality to ensure
 * nothing is broken before/after deployments.
 * 
 * Usage:
 *   npm run test:regression
 *   npm run test:regression -- --env=staging
 *   npm run test:regression -- --env=production
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const ENVIRONMENTS = {
  local: {
    apiUrl: 'http://localhost:9002',
    frontendUrl: 'http://localhost:4200'
  },
  staging: {
    apiUrl: 'https://novara-staging-staging.up.railway.app',
    frontendUrl: 'https://novara-mvp-git-staging-novara-fertility.vercel.app'
  },
  production: {
    apiUrl: 'https://novara-mvp-production.up.railway.app',
    frontendUrl: 'https://app.novara.team'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'staging';
const config = ENVIRONMENTS[environment];

if (!config) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`Valid environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  process.exit(1);
}

console.log(`\n🧪 Running regression tests against ${environment} environment`);
console.log(`API URL: ${config.apiUrl}`);
console.log(`Frontend URL: ${config.frontendUrl}\n`);

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Test user credentials
const TEST_USER = {
  email: `test_${Date.now()}@novara.test`,
  nickname: 'Test User',
  confidence_meds: 7,
  confidence_costs: 6,
  confidence_overall: 8,
  primary_need: 'emotional_support',
  cycle_stage: 'ivf_prep',
  timezone: 'America/Los_Angeles',
  onboarding_path: 'test'
};

let authToken = null;
let userId = null;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, config.apiUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test runner
async function runTest(testName, testFunction) {
  totalTests++;
  console.log(`\n📋 Running: ${testName}`);
  
  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      passedTests++;
      console.log(`✅ PASSED (${duration}ms)`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } else {
      failedTests++;
      console.log(`❌ FAILED: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
    
    testResults.push({
      name: testName,
      success: result.success,
      duration,
      error: result.error,
      details: result.details
    });
    
  } catch (error) {
    failedTests++;
    console.log(`❌ FAILED: ${error.message}`);
    testResults.push({
      name: testName,
      success: false,
      error: error.message
    });
  }
}

// Test definitions
const tests = {
  // Health check tests
  async testHealthEndpoint() {
    const response = await makeRequest({ path: '/api/health' });
    
    if (response.status !== 200) {
      return { success: false, error: `Expected status 200, got ${response.status}` };
    }
    
    if (!response.body.status || response.body.status !== 'ok') {
      return { success: false, error: 'Health check did not return ok status' };
    }
    
    return { 
      success: true, 
      details: `Environment: ${response.body.environment}, Version: ${response.body.version}` 
    };
  },

  async testDetailedHealthEndpoint() {
    const response = await makeRequest({ path: '/api/health/detailed' });
    
    if (response.status !== 200) {
      return { success: false, error: `Expected status 200, got ${response.status}` };
    }
    
    const checks = response.body.checks;
    if (!checks) {
      return { success: false, error: 'No health checks returned' };
    }
    
    return { 
      success: true, 
      details: `Database: ${checks.database}, Schema V2: ${checks.schemaV2}` 
    };
  },

  // User registration and auth tests
  async testUserRegistration() {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/users'
    }, TEST_USER);
    
    if (response.status !== 201) {
      return { 
        success: false, 
        error: `Expected status 201, got ${response.status}`,
        details: JSON.stringify(response.body)
      };
    }
    
    if (!response.body.token) {
      return { success: false, error: 'No auth token returned' };
    }
    
    // Save for subsequent tests
    authToken = response.body.token;
    userId = response.body.user.id;
    
    return { 
      success: true, 
      details: `User created with ID: ${userId}` 
    };
  },

  async testUserLogin() {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/auth/login'
    }, {
      email: TEST_USER.email
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.token) {
      return { success: false, error: 'No auth token returned' };
    }
    
    return { success: true };
  },

  async testGetUserProfile() {
    const response = await makeRequest({
      path: '/api/users/me',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (response.body.user.email !== TEST_USER.email) {
      return { success: false, error: 'User email mismatch' };
    }
    
    return { success: true };
  },

  async testUpdateUserProfile() {
    const response = await makeRequest({
      method: 'PUT',
      path: '/api/users/me',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }, {
      nickname: 'Updated Test User',
      confidence_meds: 9
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    return { success: true };
  },

  // Check-in tests
  async testCreateCheckin() {
    const checkinData = {
      user_id: userId,
      mood_today: 'hopeful',
      confidence_today: 7,
      medication_taken: 'yes',
      user_note: 'Regression test check-in',
      primary_concern_today: 'side_effects',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    const response = await makeRequest({
      method: 'POST',
      path: '/api/checkins',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }, checkinData);
    
    if (response.status !== 201) {
      return { 
        success: false, 
        error: `Expected status 201, got ${response.status}`,
        details: JSON.stringify(response.body)
      };
    }
    
    if (!response.body.checkin) {
      return { success: false, error: 'No check-in data returned' };
    }
    
    return { 
      success: true,
      details: `Check-in created with mood: ${checkinData.mood_today}`
    };
  },

  async testGetUserCheckins() {
    const response = await makeRequest({
      path: '/api/checkins?limit=10',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.records || !Array.isArray(response.body.records)) {
      return { 
        success: false, 
        error: 'Invalid response structure - expected records array',
        details: `Got: ${JSON.stringify(response.body)}`
      };
    }
    
    if (response.body.records.length === 0) {
      return { success: false, error: 'No check-ins returned after creation' };
    }
    
    return { 
      success: true,
      details: `Found ${response.body.records.length} check-ins`
    };
  },

  // Insights tests
  async testDailyInsights() {
    const response = await makeRequest({
      path: '/api/insights/daily',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.insight) {
      return { success: false, error: 'No insight returned' };
    }
    
    if (response.body.insight.confidence === undefined) {
      return { success: false, error: 'Insight missing confidence field' };
    }
    
    return { 
      success: true,
      details: `Insight type: ${response.body.insight.type}, Confidence: ${response.body.insight.confidence}`
    };
  },

  async testMicroInsightsGET() {
    const response = await makeRequest({
      method: 'GET',
      path: '/api/insights/micro',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.insight) {
      return { success: false, error: 'No micro insight returned' };
    }
    
    return { success: true };
  },

  async testMicroInsightsPOST() {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/insights/micro',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }, {
      onboardingData: {
        email: TEST_USER.email,
        nickname: TEST_USER.nickname
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.micro_insight) {
      return { success: false, error: 'No micro_insight field in response' };
    }
    
    return { success: true };
  },

  async testEngagementInsights() {
    const response = await makeRequest({
      path: '/api/insights/engagement',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    if (!response.body.engagement) {
      return { success: false, error: 'No engagement data returned' };
    }
    
    return { 
      success: true,
      details: `Active users: ${response.body.engagement.summary.activeUsers}`
    };
  },

  // Metrics tests
  async testUserMetrics() {
    const response = await makeRequest({
      path: '/api/users/metrics',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status !== 200) {
      return { 
        success: false, 
        error: `Expected status 200, got ${response.status}` 
      };
    }
    
    const metrics = response.body.metrics;
    if (!metrics) {
      return { success: false, error: 'No metrics returned' };
    }
    
    // Verify all expected fields are present
    const requiredFields = [
      'medicationAdherenceRate',
      'currentPHQ4Score',
      'checkInStreak',
      'totalCheckIns',
      'cycleCompletionProbability',
      'riskFactors',
      'protectiveFactors'
    ];
    
    for (const field of requiredFields) {
      if (metrics[field] === undefined) {
        return { 
          success: false, 
          error: `Missing required field: ${field}` 
        };
      }
    }
    
    return { 
      success: true,
      details: `Adherence: ${metrics.medicationAdherenceRate}%, PHQ-4: ${metrics.currentPHQ4Score}`
    };
  },

  // Frontend availability tests
  async testFrontendAvailability() {
    return new Promise((resolve) => {
      const url = new URL(config.frontendUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.get(config.frontendUrl, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: `Frontend returned status ${res.statusCode}` 
          });
        }
      });
      
      req.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `Frontend unreachable: ${error.message}` 
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ 
          success: false, 
          error: 'Frontend request timeout' 
        });
      });
    });
  },

  // CORS test
  async testCORSHeaders() {
    const response = await makeRequest({
      path: '/api/health',
      headers: {
        'Origin': config.frontendUrl
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    if (!corsHeader) {
      return { 
        success: false, 
        error: 'No CORS headers present' 
      };
    }
    
    if (corsHeader !== config.frontendUrl && corsHeader !== '*') {
      return { 
        success: false, 
        error: `CORS header mismatch: ${corsHeader}` 
      };
    }
    
    return { success: true };
  }
};

// Main test runner
async function runAllTests() {
  console.log(`\n🏃‍♂️ Starting regression test suite...\n`);
  console.log('═'.repeat(50));
  
  const startTime = Date.now();
  
  // Run tests in order
  await runTest('Health Check', tests.testHealthEndpoint);
  await runTest('Detailed Health Check', tests.testDetailedHealthEndpoint);
  await runTest('User Registration', tests.testUserRegistration);
  await runTest('User Login', tests.testUserLogin);
  await runTest('Get User Profile', tests.testGetUserProfile);
  await runTest('Update User Profile', tests.testUpdateUserProfile);
  await runTest('Create Check-in', tests.testCreateCheckin);
  await runTest('Get User Check-ins', tests.testGetUserCheckins);
  await runTest('Daily Insights', tests.testDailyInsights);
  await runTest('Micro Insights (GET)', tests.testMicroInsightsGET);
  await runTest('Micro Insights (POST)', tests.testMicroInsightsPOST);
  await runTest('Engagement Insights', tests.testEngagementInsights);
  await runTest('User Metrics', tests.testUserMetrics);
  await runTest('Frontend Availability', tests.testFrontendAvailability);
  await runTest('CORS Headers', tests.testCORSHeaders);
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️  Duration: ${totalDuration}ms`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Print failed tests details
  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`\n   • ${r.name}`);
        console.log(`     Error: ${r.error}`);
        if (r.details) {
          console.log(`     Details: ${r.details}`);
        }
      });
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error running tests:', error);
  process.exit(1);
});