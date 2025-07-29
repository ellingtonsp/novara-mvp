#!/usr/bin/env node

/**
 * Test script to verify baseline_completed persistence
 * Tests the complete flow: fast onboarding -> baseline update -> verify persistence
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
  reset: '\x1b[0m'
};

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

async function testBaselinePersistence(environment = 'staging') {
  const config = TEST_CONFIG[environment];
  const testEmail = `baseline-test-${Date.now()}@example.com`;
  
  console.log(`\n${colors.blue}=== Testing Baseline Persistence ===${colors.reset}`);
  console.log(`Environment: ${environment}`);
  console.log(`Test user: ${testEmail}\n`);
  
  // Step 1: Create user via fast onboarding (with baseline_completed: false)
  log('Step 1: Creating user via fast onboarding...', 'info');
  
  const createResponse = await makeRequest(`${config.apiUrl}/api/users`, {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medication_management',
      nickname: '',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      email_opt_in: true,
      baseline_completed: false,
      onboarding_path: 'test'
    })
  });
  
  if (!createResponse.ok) {
    log(`User creation failed: ${JSON.stringify(createResponse.data)}`, 'error');
    return;
  }
  
  const { token, user } = createResponse.data;
  log(`User created successfully. ID: ${user.id}`, 'success');
  log(`Initial baseline_completed: ${user.baseline_completed}`, 'info');
  
  // Step 2: Update baseline data
  log('\nStep 2: Updating baseline data...', 'info');
  
  const baselineResponse = await makeRequest(`${config.apiUrl}/api/users/baseline`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nickname: 'TestNickname',
      confidence_meds: 8,
      confidence_costs: 7,
      confidence_overall: 9,
      top_concern: 'Side effects worry',
      baseline_completed: true
    })
  });
  
  if (!baselineResponse.ok) {
    log(`Baseline update failed: ${JSON.stringify(baselineResponse.data)}`, 'error');
    return;
  }
  
  log('Baseline updated successfully', 'success');
  
  // Step 3: Login again to get fresh user data
  log('\nStep 3: Logging in again to check persistence...', 'info');
  
  const loginResponse = await makeRequest(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: testEmail })
  });
  
  if (!loginResponse.ok) {
    log(`Login failed: ${JSON.stringify(loginResponse.data)}`, 'error');
    return;
  }
  
  const refreshedUser = loginResponse.data.user;
  
  // Step 4: Verify the data
  log('\nStep 4: Verifying persisted data...', 'info');
  
  const checks = [
    {
      field: 'baseline_completed',
      expected: true,
      actual: refreshedUser.baseline_completed
    },
    {
      field: 'nickname',
      expected: 'TestNickname',
      actual: refreshedUser.nickname
    },
    {
      field: 'confidence_meds',
      expected: 8,
      actual: refreshedUser.confidence_meds
    },
    {
      field: 'confidence_costs',
      expected: 7,
      actual: refreshedUser.confidence_costs
    },
    {
      field: 'confidence_overall',
      expected: 9,
      actual: refreshedUser.confidence_overall
    },
    {
      field: 'top_concern',
      expected: 'Side effects worry',
      actual: refreshedUser.top_concern
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.expected === check.actual;
    if (passed) {
      log(`✓ ${check.field}: ${check.actual}`, 'success');
    } else {
      log(`✗ ${check.field}: Expected ${check.expected}, got ${check.actual}`, 'error');
      allPassed = false;
    }
  });
  
  // Summary
  console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
  
  if (allPassed) {
    log('All baseline data persisted correctly!', 'success');
    log('The baseline panel should NOT show for this user on next login', 'info');
  } else {
    log('Some baseline data was not persisted correctly', 'error');
    log('This could cause the baseline panel to show again', 'warning');
  }
  
  // Additional debug info
  console.log(`\n${colors.yellow}Debug info for frontend logic:${colors.reset}`);
  console.log('User data that would be checked:');
  console.log(`- baseline_completed: ${refreshedUser.baseline_completed}`);
  console.log(`- onboarding_path: ${refreshedUser.onboarding_path}`);
  console.log(`- Has confidence scores: ${!!(refreshedUser.confidence_meds && refreshedUser.confidence_costs && refreshedUser.confidence_overall)}`);
  console.log(`- Has cycle_stage: ${!!refreshedUser.cycle_stage}`);
  console.log(`- Has primary_need: ${!!refreshedUser.primary_need}`);
  
  const isExistingUser = refreshedUser.confidence_meds && refreshedUser.confidence_costs && 
                        refreshedUser.confidence_overall && refreshedUser.primary_need && 
                        refreshedUser.cycle_stage;
  const needsBaseline = !refreshedUser.baseline_completed && refreshedUser.onboarding_path === 'test' && !isExistingUser;
  
  console.log(`\nFrontend logic result:`);
  console.log(`- isExistingUser: ${isExistingUser}`);
  console.log(`- needsBaseline: ${needsBaseline}`);
  console.log(`- Should show baseline panel: ${needsBaseline ? 'YES' : 'NO'}`);
}

// Run the test
const environment = process.argv[2] || 'staging';
testBaselinePersistence(environment);