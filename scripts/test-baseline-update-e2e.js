#!/usr/bin/env node

/**
 * E2E Test Script for Baseline Update Feature
 * Tests the complete onboarding flow including baseline profile completion
 * 
 * This script tests:
 * 1. User creation (signup)
 * 2. Authentication
 * 3. Baseline profile update via PATCH /api/users/baseline
 * 4. Verifies CORS handling for dynamic URLs
 */

// No need for dotenv in test script
// Using built-in fetch in Node 18+

// Test configuration
const TEST_CONFIG = {
  staging: {
    apiUrl: 'https://novara-staging-staging.up.railway.app',
    frontendUrl: 'https://novara-mvp-staging.vercel.app'
  },
  production: {
    apiUrl: 'https://novara-mvp-production.up.railway.app',
    frontendUrl: 'https://novara-mvp.vercel.app'
  },
  local: {
    apiUrl: 'http://localhost:9002',
    frontendUrl: 'http://localhost:3000'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test data
const generateTestUser = () => ({
  email: `test-baseline-${Date.now()}@example.com`,
  nickname: `TestUser${Date.now()}`,
  confidence_meds: 7,
  confidence_costs: 6,
  confidence_overall: 8,
  primary_need: 'medication_management',
  cycle_stage: 'ivf_prep',
  timezone: 'America/New_York',
  email_opt_in: true,
  onboarding_path: 'test'
});

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type] || '';
  
  console.log(`${prefix} ${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  const startTime = Date.now();
  
  try {
    log(`Making ${options.method || 'GET'} request to: ${url}`, 'info');
    
    // Add Origin header to test CORS
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://novara-6pw8f8mvx-novara-fertility.vercel.app', // Dynamic Vercel URL
      ...options.headers
    };
    
    const response = await fetch(url, { 
      ...options,
      headers
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json().catch(() => null);
    
    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
    };
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      responseTime,
      corsHeaders
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null,
      responseTime: Date.now() - startTime,
      error
    };
  }
}

// Test functions
async function testUserSignup(apiUrl, userData) {
  log('Testing user signup...', 'info');
  
  const response = await makeRequest(`${apiUrl}/api/users`, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  if (response.ok) {
    log(`User created successfully in ${response.responseTime}ms`, 'success');
    log(`CORS headers: ${JSON.stringify(response.corsHeaders)}`, 'info');
    return response.data;
  } else {
    log(`User creation failed: ${response.status} ${response.statusText}`, 'error');
    if (response.data) {
      log(`Error details: ${JSON.stringify(response.data)}`, 'error');
    }
    return null;
  }
}

async function testBaselineUpdate(apiUrl, token, baselineData) {
  log('Testing baseline profile update...', 'info');
  
  const response = await makeRequest(`${apiUrl}/api/users/baseline`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nickname: baselineData.nickname,
      confidence_meds: baselineData.confidence_meds,
      confidence_costs: baselineData.confidence_costs,
      confidence_overall: baselineData.confidence_overall,
      top_concern: baselineData.top_concern || '',
      baseline_completed: true
    })
  });
  
  if (response.ok) {
    log(`Baseline update successful in ${response.responseTime}ms`, 'success');
    log(`CORS headers: ${JSON.stringify(response.corsHeaders)}`, 'info');
    return response.data;
  } else {
    log(`Baseline update failed: ${response.status} ${response.statusText}`, 'error');
    if (response.data) {
      log(`Error details: ${JSON.stringify(response.data)}`, 'error');
    }
    
    // Check if it's a CORS error
    if (response.status === 0) {
      log('This appears to be a CORS error - the dynamic Vercel URL may not be allowed', 'error');
    }
    
    return null;
  }
}

async function testHealthCheck(apiUrl) {
  log('Testing health endpoint...', 'info');
  
  const response = await makeRequest(`${apiUrl}/api/health`);
  
  if (response.ok) {
    log(`Health check passed in ${response.responseTime}ms`, 'success');
    log(`Environment: ${response.data?.environment || 'unknown'}`, 'info');
    return true;
  } else {
    log(`Health check failed: ${response.status} ${response.statusText}`, 'error');
    return false;
  }
}

// Main test flow
async function runE2ETest(environment = 'staging') {
  const config = TEST_CONFIG[environment];
  
  if (!config) {
    log(`Invalid environment: ${environment}. Use 'staging', 'production', or 'local'`, 'error');
    process.exit(1);
  }
  
  console.log(`\n${colors.blue}=== E2E Test: Baseline Update Feature ===${colors.reset}`);
  console.log(`Environment: ${environment}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Testing with dynamic Vercel origin: https://novara-6pw8f8mvx-novara-fertility.vercel.app\n`);
  
  const results = {
    healthCheck: false,
    userSignup: false,
    baselineUpdate: false,
    totalTime: 0
  };
  
  const startTime = Date.now();
  
  try {
    // Step 1: Health check
    results.healthCheck = await testHealthCheck(config.apiUrl);
    if (!results.healthCheck) {
      log('Health check failed, aborting test', 'error');
      return results;
    }
    
    // Step 2: Create test user
    const testUser = generateTestUser();
    const signupResult = await testUserSignup(config.apiUrl, testUser);
    
    if (!signupResult || !signupResult.token) {
      log('User signup failed, aborting test', 'error');
      return results;
    }
    
    results.userSignup = true;
    const { token, user } = signupResult;
    
    log(`Test user created: ${user.email}`, 'success');
    
    // Step 3: Test baseline update
    const baselineData = {
      nickname: 'UpdatedNickname',
      confidence_meds: 9,
      confidence_costs: 8,
      confidence_overall: 10,
      top_concern: 'Updated concern about medication side effects'
    };
    
    const updateResult = await testBaselineUpdate(config.apiUrl, token, baselineData);
    results.baselineUpdate = !!updateResult;
    
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
    console.error(error);
  }
  
  results.totalTime = Date.now() - startTime;
  
  // Summary
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`Health Check: ${results.healthCheck ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`User Signup: ${results.userSignup ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Baseline Update: ${results.baselineUpdate ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Total Time: ${results.totalTime}ms`);
  
  const allPassed = Object.values(results).every(v => v === true || typeof v === 'number');
  
  if (allPassed) {
    log('\n🎉 All tests passed!', 'success');
  } else {
    log('\n❌ Some tests failed', 'error');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'staging';

// Run the test
runE2ETest(environment);