#!/usr/bin/env node

/**
 * 🧪 NOVARA SYSTEM AUTOMATED TEST SUITE
 * Tests the complete user flow and identifies any remaining issues
 */

const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@autotest.com`;
const TEST_DATA = {
  email: TEST_EMAIL,
  nickname: 'AutoTest',
  confidence_meds: 7,
  confidence_costs: 4,
  confidence_overall: 6,
  primary_need: 'emotional_support',
  top_concern: 'Test automation concern',
  cycle_stage: 'ivf_prep'
};

let TEST_RESULTS = [];
let AUTH_TOKEN = null;
let USER_ID = null;

// Test result logger
function logTest(name, success, details = '', data = null) {
  const result = {
    test: name,
    success,
    details,
    data,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}: ${details}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
}

// API helper function
async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (useAuth && AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test Suite Functions
async function testHealthCheck() {
  const result = await apiCall('/api/health');
  
  if (result.status === 200 && result.data.status === 'ok') {
    logTest('Health Check', true, 'API is responsive', result.data);
    return true;
  } else {
    logTest('Health Check', false, `Failed: ${result.error || result.status}`, result.data);
    return false;
  }
}

async function testUserRegistration() {
  const result = await apiCall('/api/users', 'POST', TEST_DATA);
  
  if (result.status === 201 && result.data.success) {
    AUTH_TOKEN = result.data.token;
    USER_ID = result.data.user.id;
    logTest('User Registration', true, 'User created successfully', {
      user_id: USER_ID,
      email: TEST_DATA.email
    });
    return true;
  } else {
    logTest('User Registration', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testUserLogin() {
  const result = await apiCall('/api/auth/login', 'POST', {
    email: TEST_DATA.email
  });
  
  if (result.status === 200 && result.data.success) {
    AUTH_TOKEN = result.data.token;
    logTest('User Login', true, 'Login successful', { has_token: !!result.data.token });
    return true;
  } else {
    logTest('User Login', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testDailyCheckIn() {
  const checkinData = {
    mood_today: 'hopeful, anxious',
    confidence_today: 8,
    primary_concern_today: 'Test automation stress'
  };

  const result = await apiCall('/api/checkins', 'POST', checkinData, true);
  
  if (result.status === 201 && result.data.success) {
    logTest('Daily Check-in', true, 'Check-in saved successfully', {
      checkin_id: result.data.checkin.id,
      mood: checkinData.mood_today
    });
    return true;
  } else {
    logTest('Daily Check-in', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testDailyInsights() {
  const result = await apiCall('/api/insights/daily', 'GET', null, true);
  
  if (result.status === 200 && result.data.success) {
    logTest('Daily Insights', true, 'Insights generated successfully', {
      insight_title: result.data.insight?.title,
      insight_type: result.data.insight?.type,
      is_personalized: result.data.insight?.title?.includes(TEST_DATA.nickname)
    });
    return true;
  } else {
    logTest('Daily Insights', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testMicroInsights() {
  const insightData = {
    onboardingData: TEST_DATA
  };

  const result = await apiCall('/api/insights/micro', 'POST', insightData, true);
  
  if (result.status === 200 && result.data.success) {
    logTest('Micro Insights', true, 'Micro-insight generated successfully', {
      insight_title: result.data.micro_insight?.title,
      has_action: !!result.data.micro_insight?.action
    });
    return true;
  } else {
    logTest('Micro Insights', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testAnalyticsTracking() {
  const analyticsData = {
    event_type: 'test_event', // Ensure this is always defined
    event_data: { test: true, timestamp: new Date().toISOString() }
  };

  // Validate analyticsData before sending
  if (!analyticsData.event_type || typeof analyticsData.event_type !== 'string') {
    logTest('Analytics Tracking', false, 'Invalid event_type in test data', analyticsData);
    return false;
  }

  const result = await apiCall('/api/analytics/events', 'POST', analyticsData, true);
  
  if (result.status === 200 && result.data.success) {
    logTest('Analytics Tracking', true, 'Analytics event tracked successfully', {
      event_type: analyticsData.event_type
    });
    return true;
  } else {
    logTest('Analytics Tracking', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

async function testInsightEngagement() {
  const engagementData = {
    insight_type: 'test_insight',
    action: 'viewed',
    insight_id: 'test_123'
  };

  const result = await apiCall('/api/insights/engagement', 'POST', engagementData, true);
  
  if (result.status === 200 && result.data.success) {
    logTest('Insight Engagement', true, 'Engagement tracked successfully', {
      action: engagementData.action,
      insight_type: engagementData.insight_type
    });
    return true;
  } else {
    logTest('Insight Engagement', false, `Failed: ${result.data?.error || result.status}`, result.data);
    return false;
  }
}

// Generate test report
function generateReport() {
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\n' + '='.repeat(60));
  console.log('🧪 NOVARA AUTOMATED TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.filter(r => !r.success).forEach(test => {
      console.log(`   • ${test.test}: ${test.details}`);
    });
  }

  // Save detailed report
  const report = {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      success_rate: ((passedTests/totalTests) * 100).toFixed(1)
    },
    tests: TEST_RESULTS,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: test-report.json');
  
  return failedTests === 0;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Novara Automated Test Suite...\n');

  // Test sequence
  const tests = [
    { name: 'Health Check', func: testHealthCheck },
    { name: 'User Registration', func: testUserRegistration },
    { name: 'User Login', func: testUserLogin },
    { name: 'Daily Check-in', func: testDailyCheckIn },
    { name: 'Daily Insights', func: testDailyInsights },
    { name: 'Micro Insights', func: testMicroInsights },
    { name: 'Analytics Tracking', func: testAnalyticsTracking },
    { name: 'Insight Engagement', func: testInsightEngagement }
  ];

  for (const test of tests) {
    try {
      await test.func();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logTest(test.name, false, `Exception: ${error.message}`, { error: error.stack });
    }
  }

  const allPassed = generateReport();
  process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, TEST_RESULTS }; 