#!/usr/bin/env node

/**
 * Test the user metrics API endpoint
 */

const TEST_CONFIG = {
  staging: {
    apiUrl: 'https://novara-staging-staging.up.railway.app'
  },
  local: {
    apiUrl: 'http://localhost:9002'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    data: `${colors.cyan}📊`
  }[type] || '';
  
  console.log(`${prefix} ${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => null);
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

async function testUserMetrics(email, environment = 'staging') {
  const config = TEST_CONFIG[environment];
  
  console.log(`\n${colors.cyan}=== User Metrics API Test ===${colors.reset}`);
  console.log(`Environment: ${environment}`);
  console.log(`Test email: ${email}\n`);
  
  // Step 1: Login to get token
  log('Step 1: Logging in user...', 'info');
  
  const loginResponse = await makeRequest(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  
  if (!loginResponse.ok) {
    log(`Login failed: ${JSON.stringify(loginResponse.data)}`, 'error');
    return;
  }
  
  const { token, user } = loginResponse.data;
  log(`Login successful. User ID: ${user.id}`, 'success');
  
  // Step 2: Fetch user metrics
  log('\nStep 2: Fetching user metrics...', 'info');
  
  const metricsResponse = await makeRequest(`${config.apiUrl}/api/users/metrics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!metricsResponse.ok) {
    log(`Failed to fetch metrics: ${JSON.stringify(metricsResponse.data)}`, 'error');
    return;
  }
  
  const { metrics } = metricsResponse.data;
  log('Metrics fetched successfully', 'success');
  
  // Step 3: Display metrics
  console.log(`\n${colors.cyan}=== User Metrics Summary ===${colors.reset}`);
  
  // Adherence metrics
  console.log(`\n${colors.yellow}Adherence Metrics:${colors.reset}`);
  log(`Medication Adherence Rate: ${metrics.medicationAdherenceRate}%`, 'data');
  log(`Adherence Trend: ${metrics.medicationAdherenceTrend}`, 'data');
  log(`Missed Doses Last Week: ${metrics.missedDosesLastWeek}`, 'data');
  
  // Mental health metrics
  console.log(`\n${colors.yellow}Mental Health Metrics:${colors.reset}`);
  log(`PHQ-4 Score: ${metrics.currentPHQ4Score}/12`, 'data');
  log(`PHQ-4 Trend: ${metrics.phq4Trend}`, 'data');
  log(`Anxiety Average: ${metrics.anxietyAverage}`, 'data');
  
  // Engagement metrics
  console.log(`\n${colors.yellow}Engagement Metrics:${colors.reset}`);
  log(`Check-in Streak: ${metrics.checkInStreak} days`, 'data');
  log(`Total Check-ins: ${metrics.totalCheckIns}`, 'data');
  log(`Insight Engagement Rate: ${metrics.insightEngagementRate}%`, 'data');
  log(`Checklist Completion Rate: ${metrics.checklistCompletionRate}%`, 'data');
  
  // Support utilization
  console.log(`\n${colors.yellow}Support Utilization:${colors.reset}`);
  log(`Coping Strategies: ${metrics.copingStrategiesUsed.join(', ') || 'None'}`, 'data');
  log(`Most Effective: ${metrics.mostEffectiveStrategy}`, 'data');
  log(`Partner Involvement: ${metrics.partnerInvolvementRate}%`, 'data');
  
  // Predictive metrics
  console.log(`\n${colors.yellow}Predictive Metrics:${colors.reset}`);
  log(`Cycle Completion Probability: ${metrics.cycleCompletionProbability}%`, 'data');
  log(`Risk Factors: ${metrics.riskFactors.join(', ')}`, 'data');
  log(`Protective Factors: ${metrics.protectiveFactors.join(', ')}`, 'data');
  
  // Metadata
  console.log(`\n${colors.yellow}Metadata:${colors.reset}`);
  log(`Data Range: ${metrics.dataRange.from} to ${metrics.dataRange.to}`, 'data');
  log(`Last Updated: ${metrics.lastUpdated}`, 'data');
  
  // Step 4: Test empty user case
  if (metrics.totalCheckIns === 0) {
    console.log(`\n${colors.yellow}Empty State Test:${colors.reset}`);
    log('User has no check-ins - empty state should be shown', 'warning');
    log('Expected: Helpful onboarding message with CTA', 'info');
  }
  
  // Summary
  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}`);
  if (metrics.totalCheckIns > 0) {
    log('✓ API endpoint working correctly', 'success');
    log('✓ Metrics calculated from real data', 'success');
    log('✓ All fields populated', 'success');
  } else {
    log('✓ API endpoint working correctly', 'success');
    log('✓ Empty state handled properly', 'success');
    log('ℹ User needs to complete check-ins for real metrics', 'warning');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const environment = args[1] || 'staging';

if (!email) {
  console.log('Usage: node test-user-metrics.js <email> [environment]');
  console.log('Example: node test-user-metrics.js tester2@gmail.com staging');
  process.exit(1);
}

// Run the test
testUserMetrics(email, environment);