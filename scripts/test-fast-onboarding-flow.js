#!/usr/bin/env node

/**
 * Test the complete fast onboarding flow to debug baseline panel issues
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

async function simulateFastOnboarding(environment = 'staging') {
  const config = TEST_CONFIG[environment];
  const timestamp = Date.now();
  const testEmail = `quicksetup-test-${timestamp}@example.com`;
  const testNickname = `quicksetup${timestamp.toString().slice(-3)}`;
  
  console.log(`\n${colors.cyan}=== Fast Onboarding Flow Test ===${colors.reset}`);
  console.log(`Environment: ${environment}`);
  console.log(`Test email: ${testEmail}`);
  console.log(`Test nickname: ${testNickname}\n`);
  
  // Step 1: Simulate fast onboarding (minimal data)
  log('Step 1: Creating user via fast onboarding...', 'info');
  
  const fastOnboardingData = {
    email: testEmail,
    cycle_stage: 'stimulation',
    primary_need: 'medication_management',  // This should map correctly
    // These are the defaults set by fast onboarding
    nickname: '',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    email_opt_in: true,
    baseline_completed: false,
    onboarding_path: 'test'
  };
  
  log('Fast onboarding data:', 'data');
  console.log(JSON.stringify(fastOnboardingData, null, 2));
  
  const createResponse = await makeRequest(`${config.apiUrl}/api/users`, {
    method: 'POST',
    body: JSON.stringify(fastOnboardingData)
  });
  
  if (!createResponse.ok) {
    log(`User creation failed: ${JSON.stringify(createResponse.data)}`, 'error');
    return;
  }
  
  const { token, user } = createResponse.data;
  log(`User created successfully. ID: ${user.id}`, 'success');
  
  // Step 2: Check what the user data looks like immediately after creation
  log('\nStep 2: Checking user data after creation...', 'info');
  
  console.log(`\n${colors.cyan}User data received:${colors.reset}`);
  const importantFields = [
    'nickname',
    'confidence_meds',
    'confidence_costs',
    'confidence_overall',
    'primary_need',
    'cycle_stage',
    'baseline_completed',
    'onboarding_path'
  ];
  
  importantFields.forEach(field => {
    const value = user[field];
    log(`${field}: ${value !== undefined ? value : '(undefined)'}`, 'data');
  });
  
  // Step 3: Run the baseline panel logic
  log('\nStep 3: Running baseline panel detection logic...', 'info');
  
  // Simulate the frontend logic
  const hasNickname = user.nickname && user.nickname.trim() !== '';
  const hasNonDefaultScores = user.confidence_meds !== 5 || user.confidence_costs !== 5 || user.confidence_overall !== 5;
  const isExistingUser = hasNickname || hasNonDefaultScores || user.baseline_completed;
  const needsBaseline = !user.baseline_completed && user.onboarding_path === 'test' && !isExistingUser;
  
  console.log(`\n${colors.cyan}Baseline panel logic:${colors.reset}`);
  log(`hasNickname: ${hasNickname} (nickname: "${user.nickname || ''}")`, 'info');
  log(`hasNonDefaultScores: ${hasNonDefaultScores} (${user.confidence_meds}, ${user.confidence_costs}, ${user.confidence_overall})`, 'info');
  log(`isExistingUser: ${isExistingUser}`, 'info');
  log(`baseline_completed: ${user.baseline_completed}`, 'info');
  log(`onboarding_path: ${user.onboarding_path}`, 'info');
  log(`needsBaseline: ${needsBaseline}`, needsBaseline ? 'warning' : 'success');
  
  if (needsBaseline) {
    log('\n✓ Baseline panel SHOULD show for this user', 'success');
  } else {
    log('\n✗ Baseline panel should NOT show for this user', 'error');
    
    // Diagnose why
    if (user.baseline_completed) {
      log('  Reason: baseline_completed is already true', 'warning');
    } else if (user.onboarding_path !== 'test') {
      log(`  Reason: onboarding_path is "${user.onboarding_path}" not "test"`, 'warning');
    } else if (isExistingUser) {
      log('  Reason: User is considered an existing user', 'warning');
      if (hasNickname) log('    - Has nickname', 'warning');
      if (hasNonDefaultScores) log('    - Has non-default confidence scores', 'warning');
    }
  }
  
  // Step 4: Test what happens after baseline update
  log('\nStep 4: Testing baseline update...', 'info');
  
  const baselineUpdateData = {
    nickname: testNickname,
    confidence_meds: 7,
    confidence_costs: 8,
    confidence_overall: 9,
    top_concern: 'Test concern',
    baseline_completed: true
  };
  
  const updateResponse = await makeRequest(`${config.apiUrl}/api/users/baseline`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(baselineUpdateData)
  });
  
  if (updateResponse.ok) {
    log('Baseline update successful', 'success');
    
    // Login again to check persistence
    const loginResponse = await makeRequest(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: testEmail })
    });
    
    if (loginResponse.ok) {
      const updatedUser = loginResponse.data.user;
      log('\nUpdated user data:', 'info');
      log(`baseline_completed: ${updatedUser.baseline_completed}`, 'data');
      log(`nickname: ${updatedUser.nickname}`, 'data');
      
      // Re-run logic
      const updatedNeedsBaseline = !updatedUser.baseline_completed && updatedUser.onboarding_path === 'test';
      log(`\nAfter update, needsBaseline: ${updatedNeedsBaseline}`, updatedNeedsBaseline ? 'error' : 'success');
    }
  } else {
    log(`Baseline update failed: ${JSON.stringify(updateResponse.data)}`, 'error');
  }
  
  // Summary
  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
  log('Fast onboarding creates users with:', 'info');
  log('- Empty nickname', 'info');
  log('- Default confidence scores (5,5,5)', 'info');
  log('- baseline_completed: false', 'info');
  log('- onboarding_path: test', 'info');
  log('\nThese users SHOULD see the baseline panel', 'warning');
}

// Run the test
const environment = process.argv[2] || 'staging';
simulateFastOnboarding(environment);