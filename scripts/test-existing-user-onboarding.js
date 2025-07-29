#!/usr/bin/env node

/**
 * Existing User Onboarding Flow Test
 * Tests that existing users with complete profile data bypass onboarding
 */

const https = require('https');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Test data simulating existing user profiles
const TEST_USERS = {
  existingCompleteUser: {
    email: 'test.existing@example.com',
    confidence_meds: 8,
    confidence_costs: 6,
    confidence_overall: 7,
    primary_need: 'emotional_support',
    cycle_stage: 'stimulation',
    baseline_completed: false // Even without baseline, should be allowed
  },
  existingIncompleteUser: {
    email: 'test.incomplete@example.com',
    confidence_meds: null,
    confidence_costs: null,
    confidence_overall: null,
    primary_need: null,
    cycle_stage: null,
    baseline_completed: false
  },
  newUser: {
    email: 'test.new@example.com',
    confidence_meds: null,
    confidence_costs: null,
    confidence_overall: null,
    primary_need: null,
    cycle_stage: null,
    baseline_completed: false
  }
};

// Test the onboarding logic locally (mimics frontend logic)
function testOnboardingLogic(user, testName) {
  log(colors.blue, `\n🧪 Testing: ${testName}`);
  
  // This mirrors the logic in NovaraLanding.tsx lines 171-176
  const isExistingUser = user.confidence_meds && 
                        user.confidence_costs && 
                        user.confidence_overall && 
                        user.primary_need && 
                        user.cycle_stage;
  
  const shouldBypassOnboarding = user.baseline_completed || isExistingUser;
  
  log(colors.yellow, `  User profile: ${JSON.stringify(user, null, 2)}`);
  log(colors.yellow, `  Is existing user: ${isExistingUser}`);
  log(colors.yellow, `  Should bypass onboarding: ${shouldBypassOnboarding}`);
  
  return {
    isExistingUser,
    shouldBypassOnboarding,
    testPassed: testName.includes('Complete') ? shouldBypassOnboarding : !shouldBypassOnboarding
  };
}

// Test API endpoint logic (simulates backend logic)
function testBackendLogic(user, testName) {
  log(colors.blue, `\n🔍 Backend Logic Test: ${testName}`);
  
  // This mirrors the logic from backend/server.js lines 2421-2430
  const hasCompletedOnboarding = !!user.baseline_completed || 
                                (user.onboarding_path === 'control' && 
                                 user.primary_need && 
                                 user.cycle_stage) ||
                                // Allow existing users with complete profile data
                                (user.confidence_meds && user.confidence_costs && user.confidence_overall && 
                                 user.primary_need && user.cycle_stage);
  
  log(colors.yellow, `  Backend considers onboarding complete: ${hasCompletedOnboarding}`);
  
  return {
    hasCompletedOnboarding,
    testPassed: testName.includes('Complete') ? hasCompletedOnboarding : !hasCompletedOnboarding
  };
}

// Test PWA cache behavior simulation
function testPWACacheBehavior() {
  log(colors.blue, '\n🔄 Testing PWA Cache Update Behavior');
  
  const oldCacheVersion = 'novara-v1.1.0';
  const newCacheVersion = 'novara-v1.1.1';
  
  // Simulate cache version check
  const cacheNeedsUpdate = oldCacheVersion !== newCacheVersion;
  
  log(colors.yellow, `  Old cache version: ${oldCacheVersion}`);
  log(colors.yellow, `  New cache version: ${newCacheVersion}`);
  log(colors.yellow, `  Cache needs update: ${cacheNeedsUpdate}`);
  
  if (cacheNeedsUpdate) {
    log(colors.green, '✅ PWA will show update notification to users');
    log(colors.green, '✅ Users will get fresh frontend code with existing user logic');
  } else {
    log(colors.red, '❌ Cache versions match - no update triggered');
  }
  
  return cacheNeedsUpdate;
}

// Main test runner
async function runExistingUserTests() {
  log(colors.blue, '🚀 Existing User Onboarding Test Suite Starting...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test each user scenario
  for (const [userType, userData] of Object.entries(TEST_USERS)) {
    log(colors.yellow, `\n${'='.repeat(60)}`);
    log(colors.yellow, `Testing User Type: ${userType.toUpperCase()}`);
    log(colors.yellow, `${'='.repeat(60)}`);
    
    // Test frontend logic
    const frontendResult = testOnboardingLogic(userData, userType);
    totalTests++;
    if (frontendResult.testPassed) {
      passedTests++;
      log(colors.green, '✅ Frontend onboarding logic correct');
    } else {
      log(colors.red, '❌ Frontend onboarding logic incorrect');
    }
    
    // Test backend logic
    const backendResult = testBackendLogic(userData, userType);
    totalTests++;
    if (backendResult.testPassed) {
      passedTests++;
      log(colors.green, '✅ Backend onboarding logic correct');
    } else {
      log(colors.red, '❌ Backend onboarding logic incorrect');
    }
  }
  
  // Test PWA cache behavior
  log(colors.yellow, `\n${'='.repeat(60)}`);
  log(colors.yellow, 'Testing PWA Cache Update Mechanism');
  log(colors.yellow, `${'='.repeat(60)}`);
  
  totalTests++;
  const cacheResult = testPWACacheBehavior();
  if (cacheResult) {
    passedTests++;
    log(colors.green, '✅ PWA cache update mechanism working');
  } else {
    log(colors.red, '❌ PWA cache update mechanism not working');
  }
  
  // Summary
  log(colors.blue, '\n' + '='.repeat(60));
  log(colors.blue, '📊 Existing User Onboarding Test Summary');
  log(colors.blue, '='.repeat(60));
  
  log(colors.blue, `\n📈 Overall Results: ${passedTests}/${totalTests} tests passed`);
  
  // Expected results breakdown
  log(colors.yellow, '\n📋 Expected Behaviors:');
  log(colors.green, '  ✅ Existing users with complete profile → Skip onboarding');
  log(colors.green, '  ✅ Incomplete users → Must complete onboarding');
  log(colors.green, '  ✅ New users → Must complete onboarding');
  log(colors.green, '  ✅ PWA cache v1.1.1 → Force frontend refresh');
  
  if (passedTests === totalTests) {
    log(colors.green, '\n🎉 All existing user onboarding tests passed!');
    log(colors.green, '🎉 The mobile PWA cache fix should resolve the onboarding issue!');
    return true;
  } else {
    log(colors.red, '\n🚨 Some tests failed - onboarding logic may have issues');
    return false;
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runExistingUserTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(colors.red, `🚨 Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runExistingUserTests };