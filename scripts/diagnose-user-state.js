#!/usr/bin/env node

/**
 * Diagnostic script to check user state and baseline panel logic
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

async function diagnoseUser(email, environment = 'staging') {
  const config = TEST_CONFIG[environment];
  
  console.log(`\n${colors.cyan}=== User State Diagnosis ===${colors.reset}`);
  console.log(`Environment: ${environment}`);
  console.log(`User email: ${email}\n`);
  
  // Step 1: Try to login the user
  log('Attempting to login user...', 'info');
  
  const loginResponse = await makeRequest(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  
  if (!loginResponse.ok) {
    log(`User not found or login failed: ${JSON.stringify(loginResponse.data)}`, 'error');
    return;
  }
  
  const { user, token } = loginResponse.data;
  log('Login successful', 'success');
  
  // Step 2: Display user data
  console.log(`\n${colors.cyan}=== User Data ===${colors.reset}`);
  const fields = [
    'id',
    'email',
    'nickname',
    'confidence_meds',
    'confidence_costs', 
    'confidence_overall',
    'primary_need',
    'cycle_stage',
    'top_concern',
    'baseline_completed',
    'onboarding_path',
    'created_at'
  ];
  
  fields.forEach(field => {
    const value = user[field];
    const displayValue = value !== undefined ? value : '(undefined)';
    log(`${field}: ${displayValue}`, 'data');
  });
  
  // Step 3: Run the baseline panel logic
  console.log(`\n${colors.cyan}=== Baseline Panel Logic ===${colors.reset}`);
  
  // Check if user is an existing user
  const hasConfidenceScores = !!(user.confidence_meds && user.confidence_costs && user.confidence_overall);
  const hasPrimaryNeed = !!user.primary_need;
  const hasCycleStage = !!user.cycle_stage;
  
  const isExistingUser = hasConfidenceScores && hasPrimaryNeed && hasCycleStage;
  const needsBaseline = !user.baseline_completed && user.onboarding_path === 'test' && !isExistingUser;
  
  log(`Has confidence scores: ${hasConfidenceScores} (meds: ${user.confidence_meds}, costs: ${user.confidence_costs}, overall: ${user.confidence_overall})`, 'info');
  log(`Has primary_need: ${hasPrimaryNeed} (${user.primary_need || 'none'})`, 'info');
  log(`Has cycle_stage: ${hasCycleStage} (${user.cycle_stage || 'none'})`, 'info');
  log(`baseline_completed: ${user.baseline_completed}`, 'info');
  log(`onboarding_path: ${user.onboarding_path}`, 'info');
  
  console.log('');
  log(`Is existing user: ${isExistingUser}`, isExistingUser ? 'warning' : 'info');
  log(`Needs baseline: ${needsBaseline}`, needsBaseline ? 'warning' : 'info');
  log(`Should show baseline panel: ${needsBaseline ? 'YES' : 'NO'}`, needsBaseline ? 'error' : 'success');
  
  // Step 4: Check recent check-ins
  console.log(`\n${colors.cyan}=== Recent Activity ===${colors.reset}`);
  
  const checkinsResponse = await makeRequest(`${config.apiUrl}/api/checkins?limit=5`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (checkinsResponse.ok && checkinsResponse.data.checkins) {
    log(`Total check-ins: ${checkinsResponse.data.checkins.length}`, 'data');
    if (checkinsResponse.data.checkins.length > 0) {
      log(`Latest check-in: ${checkinsResponse.data.checkins[0].date_submitted}`, 'data');
    }
  }
  
  // Step 5: Recommendations
  console.log(`\n${colors.yellow}=== Recommendations ===${colors.reset}`);
  
  if (!user.baseline_completed && user.onboarding_path === 'test') {
    if (isExistingUser) {
      log('User appears to be an existing user (has all required fields)', 'warning');
      log('Consider setting baseline_completed=true for this user', 'warning');
    } else {
      log('User should see baseline panel to complete profile', 'info');
      
      const missingFields = [];
      if (!hasConfidenceScores) missingFields.push('confidence scores');
      if (!hasPrimaryNeed) missingFields.push('primary_need');
      if (!hasCycleStage) missingFields.push('cycle_stage');
      
      if (missingFields.length > 0) {
        log(`Missing fields: ${missingFields.join(', ')}`, 'warning');
      }
    }
  } else if (user.baseline_completed) {
    log('User has completed baseline - no action needed', 'success');
  } else if (user.onboarding_path !== 'test') {
    log(`User is in ${user.onboarding_path || 'unknown'} onboarding path - baseline panel not required`, 'info');
  }
  
  // Step 6: Quick fix command
  if (!user.baseline_completed && isExistingUser) {
    console.log(`\n${colors.yellow}Quick fix command to mark baseline as completed:${colors.reset}`);
    console.log(`curl -X PATCH "${config.apiUrl}/api/users/baseline" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"nickname":"${user.nickname || 'User'}","confidence_meds":${user.confidence_meds},"confidence_costs":${user.confidence_costs},"confidence_overall":${user.confidence_overall},"top_concern":"","baseline_completed":true}'`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const environment = args[1] || 'staging';

if (!email) {
  console.log('Usage: node diagnose-user-state.js <email> [environment]');
  console.log('Example: node diagnose-user-state.js tester2@gmail.com staging');
  process.exit(1);
}

// Run the diagnosis
diagnoseUser(email, environment);