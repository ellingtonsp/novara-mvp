#!/usr/bin/env node

/**
 * 🚀 NOVARA FULL SYSTEM TEST SUITE
 * Tests complete user journey and identifies any remaining issues
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `systemtest-${Date.now()}@example.com`;
const TEST_USER_DATA = {
  email: TEST_EMAIL,
  nickname: 'SystemTest',
  confidence_meds: 7,
  confidence_costs: 4,
  confidence_overall: 6,
  primary_need: 'emotional_support',
  top_concern: 'System testing verification',
  cycle_stage: 'ivf_prep'
};

let AUTH_TOKEN = null;
let USER_ID = null;
let testResults = [];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logResult(testName, success, details = '', data = null) {
  const result = {
    test: testName,
    success,
    details,
    data,
    timestamp: new Date().toISOString()
  };
  
  testResults.push(result);
  
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  
  console.log(`${color}${icon} ${testName}${colors.reset}`);
  if (details) console.log(`   ${details}`);
  if (data && typeof data === 'object') {
    console.log(`   Data: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  }
  console.log('');
}

async function apiCall(endpoint, method = 'GET', data = null, requireAuth = false) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (requireAuth && AUTH_TOKEN) {
    options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  if (data) options.body = JSON.stringify(data);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { 
      success: response.ok, 
      data: result, 
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 0
    };
  }
}

async function test1_HealthCheck() {
  console.log(`${colors.blue}${colors.bold}🔍 TEST 1: Health Check${colors.reset}\n`);
  
  const result = await apiCall('/api/health');
  
  if (result.success && result.data.status === 'ok') {
    logResult('Health Check', true, `Server responding correctly on port 3000`);
    logResult('Airtable Connection', result.data.airtable === 'connected', `Status: ${result.data.airtable}`);
    logResult('JWT Configuration', result.data.jwt === 'configured', `Status: ${result.data.jwt}`);
  } else {
    logResult('Health Check', false, `Server not responding: ${result.error || result.statusText}`);
  }
}

async function test2_UserRegistration() {
  console.log(`${colors.blue}${colors.bold}👤 TEST 2: User Registration & Authentication${colors.reset}\n`);
  
  const result = await apiCall('/api/users', 'POST', TEST_USER_DATA);
  
  if (result.success && result.data.success) {
    USER_ID = result.data.user_id;
    AUTH_TOKEN = result.data.token;
    logResult('User Registration', true, `User created with ID: ${USER_ID}`, result.data);
    logResult('JWT Token Generation', !!AUTH_TOKEN, `Token length: ${AUTH_TOKEN ? AUTH_TOKEN.length : 0} chars`);
  } else {
    logResult('User Registration', false, `Failed: ${result.data?.error || result.error}`, result.data);
  }
}

async function test3_MicroInsights() {
  console.log(`${colors.blue}${colors.bold}🧠 TEST 3: Micro-Insight Generation${colors.reset}\n`);
  
  // Test onboarding micro-insight
  const onboardingInsight = await apiCall('/api/insights/micro', 'POST', {
    onboardingData: TEST_USER_DATA
  });
  
  if (onboardingInsight.success && onboardingInsight.data.success) {
    const insight = onboardingInsight.data.micro_insight;
    logResult('Onboarding Micro-Insight', true, `Generated: "${insight.title}"`, insight);
    
    // Check if personalized (should include user's nickname)
    const isPersonalized = insight.message?.includes(TEST_USER_DATA.nickname);
    logResult('Personalization Check', isPersonalized, `Uses nickname: ${isPersonalized ? 'Yes' : 'No'}`);
  } else {
    logResult('Onboarding Micro-Insight', false, `Failed: ${onboardingInsight.data?.error || onboardingInsight.error}`);
  }
}

async function test4_DailyCheckin() {
  console.log(`${colors.blue}${colors.bold}📝 TEST 4: Daily Check-in System${colors.reset}\n`);
  
  const checkinData = {
    email: TEST_EMAIL,
    mood_today: 'optimistic, curious',
    confidence_today: 8,
    primary_concern_today: 'Testing system functionality'
  };
  
  const result = await apiCall('/api/checkins', 'POST', checkinData);
  
  if (result.success && result.data.success) {
    logResult('Daily Check-in Submission', true, `Saved to Airtable: ${result.data.record_id}`, result.data);
    
    // Test post-checkin micro-insight
    const checkinInsight = await apiCall('/api/insights/micro', 'POST', {
      checkinData: checkinData
    });
    
    if (checkinInsight.success && checkinInsight.data.success) {
      const insight = checkinInsight.data.micro_insight;
      logResult('Post-Checkin Micro-Insight', true, `Generated: "${insight.title}"`);
    } else {
      logResult('Post-Checkin Micro-Insight', false, `Failed: ${checkinInsight.data?.error}`);
    }
  } else {
    logResult('Daily Check-in Submission', false, `Failed: ${result.data?.error || result.error}`);
  }
}

async function test5_DailyInsights() {
  console.log(`${colors.blue}${colors.bold}💡 TEST 5: Daily Insights Engine${colors.reset}\n`);
  
  const result = await apiCall('/api/insights/daily', 'GET', null, true);
  
  if (result.success && result.data.success) {
    const insight = result.data.insight;
    logResult('Daily Insight Generation', true, `Type: ${insight.insight_type}`, insight);
    logResult('Insight Content Quality', !!insight.insight_title && !!insight.insight_message, 
      `Title: "${insight.insight_title?.substring(0, 50)}..."`);
  } else {
    logResult('Daily Insight Generation', false, `Failed: ${result.data?.error || result.error}`);
  }
}

async function test6_AnalyticsTracking() {
  console.log(`${colors.blue}${colors.bold}📊 TEST 6: Analytics & Engagement Tracking${colors.reset}\n`);
  
  const analyticsData = {
    event_type: 'system_test_event',
    event_data: {
      test_timestamp: new Date().toISOString(),
      test_user: TEST_EMAIL,
      test_purpose: 'Full system verification'
    }
  };
  
  const result = await apiCall('/api/analytics/events', 'POST', analyticsData, true);
  
  if (result.success && result.data.success) {
    logResult('Analytics Event Tracking', true, `Event tracked: ${result.data.record_id}`);
  } else {
    logResult('Analytics Event Tracking', false, `Failed: ${result.data?.error || result.error}`);
  }
  
  // Test insight engagement tracking
  const engagementData = {
    insight_type: 'system_test',
    action: 'viewed',
    insight_id: 'test_insight_123'
  };
  
  const engagementResult = await apiCall('/api/insights/engagement', 'POST', engagementData, true);
  
  if (engagementResult.success && engagementResult.data.success) {
    logResult('Insight Engagement Tracking', true, `Engagement tracked: ${engagementResult.data.record_id}`);
  } else {
    logResult('Insight Engagement Tracking', false, `Failed: ${engagementResult.data?.error || engagementResult.error}`);
  }
}

async function generateSummaryReport() {
  console.log(`${colors.cyan}${colors.bold}📋 SYSTEM TEST SUMMARY REPORT${colors.reset}\n`);
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`${colors.bold}Overall Results:${colors.reset}`);
  console.log(`✅ Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`❌ Failed: ${colors.red}${failedTests}${colors.reset}`);
  console.log(`📊 Success Rate: ${successRate >= 80 ? colors.green : colors.red}${successRate}%${colors.reset}\n`);
  
  if (failedTests > 0) {
    console.log(`${colors.red}${colors.bold}❌ Failed Tests:${colors.reset}`);
    testResults.filter(t => !t.success).forEach(test => {
      console.log(`   • ${test.test}: ${test.details}`);
    });
    console.log('');
  }
  
  console.log(`${colors.bold}Core System Status:${colors.reset}`);
  console.log(`🔐 Authentication: ${testResults.find(t => t.test === 'JWT Token Generation')?.success ? '✅' : '❌'}`);
  console.log(`🧠 Insight Engine: ${testResults.find(t => t.test === 'Daily Insight Generation')?.success ? '✅' : '❌'}`);
  console.log(`📝 Check-in System: ${testResults.find(t => t.test === 'Daily Check-in Submission')?.success ? '✅' : '❌'}`);
  console.log(`📊 Analytics: ${testResults.find(t => t.test === 'Analytics Event Tracking')?.success ? '✅' : '❌'}`);
  
  console.log(`\n${colors.cyan}Test completed at: ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.cyan}Test user email: ${TEST_EMAIL}${colors.reset}`);
  
  // Return summary for programmatic use
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: parseFloat(successRate),
    timestamp: new Date().toISOString(),
    testUser: TEST_EMAIL
  };
}

async function runFullSystemTest() {
  console.log(`${colors.bold}${colors.cyan}🚀 NOVARA FULL SYSTEM TEST${colors.reset}\n`);
  console.log(`Testing complete user journey and system functionality...\n`);
  
  try {
    await test1_HealthCheck();
    await test2_UserRegistration();
    await test3_MicroInsights();
    await test4_DailyCheckin();
    await test5_DailyInsights();
    await test6_AnalyticsTracking();
    
    const summary = await generateSummaryReport();
    
    // Exit with appropriate code
    process.exit(summary.successRate >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bold}💥 Test suite crashed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the test suite
runFullSystemTest(); 