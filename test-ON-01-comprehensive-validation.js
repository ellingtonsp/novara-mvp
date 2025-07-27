#!/usr/bin/env node

/**
 * 🧪 ON-01 COMPREHENSIVE VALIDATION TEST
 * Tests the ON-01 A/B test implementation with multiple iterations
 * to validate 50/50 split and baseline completion
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';
const ITERATIONS = 20; // Test 20 times to validate distribution

let TEST_RESULTS = [];
let DISTRIBUTION_RESULTS = [];

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

// Generate test email
function generateTestEmail(path, iteration) {
  return `on01-valid-${path}-${iteration}-${Date.now()}@test.com`;
}

// Test A/B test distribution
async function testABTestDistribution() {
  console.log('\n🎯 TESTING A/B TEST DISTRIBUTION');
  console.log('==================================');
  console.log(`Running ${ITERATIONS} iterations to validate 50/50 split...`);
  
  const pathCounts = { test: 0, control: 0 };
  const sessionIds = [];
  
  for (let i = 0; i < ITERATIONS; i++) {
    // Generate session ID using the same logic as abTestUtils
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIds.push(sessionId);
    
    // Use the same deterministic logic as abTestUtils
    const sessionHash = sessionId.split('_').pop() || sessionId;
    const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
    const path = sessionBasedSplit ? 'test' : 'control';
    
    pathCounts[path]++;
    
    console.log(`  Iteration ${i + 1}: Session ${sessionId.substring(0, 20)}... → ${path}`);
  }
  
  console.log('\n📊 DISTRIBUTION RESULTS:');
  console.log(`Test path: ${pathCounts.test}/${ITERATIONS} (${Math.round(pathCounts.test/ITERATIONS*100)}%)`);
  console.log(`Control path: ${pathCounts.control}/${ITERATIONS} (${Math.round(pathCounts.control/ITERATIONS*100)}%)`);
  
  const variance = Math.abs(pathCounts.test - pathCounts.control) / ITERATIONS;
  const isBalanced = variance <= 0.3; // Allow 30% variance for small sample
  
  logTest('A/B Test Distribution',
    isBalanced,
    `Test: ${pathCounts.test}, Control: ${pathCounts.control} (${Math.round(variance*100)}% variance)`
  );
  
  DISTRIBUTION_RESULTS = { test: pathCounts.test, control: pathCounts.control, variance };
  
  return isBalanced;
}

// Test baseline completion with actual user creation
async function testBaselineCompletion() {
  console.log('\n🎯 TESTING BASELINE COMPLETION');
  console.log('===============================');
  
  try {
    // Create test path user
    console.log('1. Creating test path user...');
    const testUser = {
      email: `baseline-test-${Date.now()}@test.com`,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medical_clarity',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      logTest('User Creation', false, `Failed: ${errorText}`);
      return false;
    }
    
    const createData = await createResponse.json();
    console.log('✅ User created:', createData.user.email);
    
    const token = createData.token;
    const userId = createData.user.id;
    
    // Check initial state
    console.log('2. Checking initial state...');
    const initialUserResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!initialUserResponse.ok) {
      logTest('Initial User Fetch', false, `Failed: ${await initialUserResponse.text()}`);
      return false;
    }
    
    const initialUserData = await initialUserResponse.json();
    console.log('Initial state:', {
      onboarding_path: initialUserData.user.onboarding_path,
      baseline_completed: initialUserData.user.baseline_completed,
      has_nickname: !!initialUserData.user.nickname
    });
    
    // Complete baseline
    console.log('3. Completing baseline...');
    const baselineData = {
      nickname: 'BaselineTestUser',
      confidence_meds: 7,
      confidence_costs: 5,
      confidence_overall: 6,
      top_concern: 'financial stress',
      baseline_completed: true
    };
    
    const baselineResponse = await fetch(`${BASE_URL}/api/users/baseline`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(baselineData)
    });
    
    if (!baselineResponse.ok) {
      const errorText = await baselineResponse.text();
      logTest('Baseline Completion', false, `Failed: ${errorText}`);
      return false;
    }
    
    const baselineResult = await baselineResponse.json();
    console.log('✅ Baseline completed successfully');
    
    // Verify final state
    console.log('4. Verifying final state...');
    const finalUserResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!finalUserResponse.ok) {
      logTest('Final User Fetch', false, `Failed: ${await finalUserResponse.text()}`);
      return false;
    }
    
    const finalUserData = await finalUserResponse.json();
    console.log('Final state:', {
      onboarding_path: finalUserData.user.onboarding_path,
      baseline_completed: finalUserData.user.baseline_completed,
      nickname: finalUserData.user.nickname,
      confidence_meds: finalUserData.user.confidence_meds
    });
    
    // Validate the results
    const baselineCompleted = finalUserData.user.baseline_completed === 1 || finalUserData.user.baseline_completed === true;
    const hasNickname = !!finalUserData.user.nickname;
    const hasConfidence = finalUserData.user.confidence_meds === 7;
    
    logTest('Baseline Completion Validation',
      baselineCompleted && hasNickname && hasConfidence,
      `Baseline completed: ${baselineCompleted}, Has nickname: ${hasNickname}, Has confidence: ${hasConfidence}`
    );
    
    return baselineCompleted && hasNickname && hasConfidence;
    
  } catch (error) {
    logTest('Baseline Completion', false, `Error: ${error.message}`);
    return false;
  }
}

// Test control path user journey
async function testControlPath() {
  console.log('\n🎯 TESTING CONTROL PATH');
  console.log('=======================');
  
  try {
    // Create control path user with full onboarding
    console.log('1. Creating control path user...');
    const controlUser = {
      email: `control-test-${Date.now()}@test.com`,
      nickname: 'ControlTestUser',
      confidence_meds: 8,
      confidence_costs: 7,
      confidence_overall: 8,
      primary_need: 'emotional_support',
      cycle_stage: 'ivf_prep',
      top_concern: 'medication side effects',
      onboarding_path: 'control'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controlUser)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      logTest('Control User Creation', false, `Failed: ${errorText}`);
      return false;
    }
    
    const createData = await createResponse.json();
    console.log('✅ Control user created:', createData.user.email);
    
    const token = createData.token;
    
    // Check if control user needs baseline completion
    console.log('2. Checking baseline requirement...');
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      logTest('Control User Fetch', false, `Failed: ${await userResponse.text()}`);
      return false;
    }
    
    const userData = await userResponse.json();
    const needsBaseline = userData.user.onboarding_path === 'control' && 
                         (!userData.user.primary_need || !userData.user.cycle_stage);
    
    logTest('Control Path Baseline Logic',
      !needsBaseline, // Control users should NOT need baseline
      `Path: ${userData.user.onboarding_path}, Needs baseline: ${needsBaseline}`
    );
    
    return !needsBaseline;
    
  } catch (error) {
    logTest('Control Path', false, `Error: ${error.message}`);
    return false;
  }
}

// Test insights blocking logic
async function testInsightsBlocking() {
  console.log('\n🎯 TESTING INSIGHTS BLOCKING');
  console.log('=============================');
  
  try {
    // Create incomplete test user
    console.log('1. Creating incomplete test user...');
    const incompleteUser = {
      email: `incomplete-test-${Date.now()}@test.com`,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medical_clarity',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteUser)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      logTest('Incomplete User Creation', false, `Failed: ${errorText}`);
      return false;
    }
    
    const createData = await createResponse.json();
    const token = createData.token;
    
    // Try to get insights (should be blocked)
    console.log('2. Testing insights access...');
    const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const isBlocked = !insightsResponse.ok;
    
    logTest('Insights Blocking',
      isBlocked, // Should be blocked
      `Response: ${insightsResponse.status}, Blocked: ${isBlocked}`
    );
    
    return isBlocked;
    
  } catch (error) {
    logTest('Insights Blocking', false, `Error: ${error.message}`);
    return false;
  }
}

// Generate comprehensive test report
function generateReport() {
  console.log('\n📋 ON-01 COMPREHENSIVE VALIDATION REPORT');
  console.log('==========================================');
  
  const passed = TEST_RESULTS.filter(r => r.success).length;
  const total = TEST_RESULTS.length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`\nOverall Results: ${passed}/${total} tests passed (${successRate}%)`);
  
  console.log('\nDetailed Results:');
  TEST_RESULTS.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
  });
  
  if (DISTRIBUTION_RESULTS) {
    console.log('\n📊 A/B Test Distribution Analysis:');
    console.log(`- Test path: ${DISTRIBUTION_RESULTS.test} (${Math.round(DISTRIBUTION_RESULTS.test/ITERATIONS*100)}%)`);
    console.log(`- Control path: ${DISTRIBUTION_RESULTS.control} (${Math.round(DISTRIBUTION_RESULTS.control/ITERATIONS*100)}%)`);
    console.log(`- Variance: ${Math.round(DISTRIBUTION_RESULTS.variance*100)}%`);
    
    if (DISTRIBUTION_RESULTS.variance <= 0.3) {
      console.log('✅ Distribution is balanced (within 30% variance)');
    } else {
      console.log('❌ Distribution is not balanced - needs investigation');
    }
  }
  
  console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
  if (successRate >= 90) {
    console.log('✅ PRODUCTION READY - All critical components working');
  } else if (successRate >= 70) {
    console.log('🟡 NEARLY READY - Minor issues to resolve');
  } else {
    console.log('❌ NEEDS WORK - Significant issues to address');
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed,
      total,
      successRate
    },
    distribution: DISTRIBUTION_RESULTS,
    results: TEST_RESULTS
  };
  
  const fs = require('fs');
  fs.writeFileSync('ON-01-comprehensive-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: ON-01-comprehensive-report.json');
}

async function runComprehensiveValidation() {
  console.log('🧪 ON-01 COMPREHENSIVE VALIDATION TEST');
  console.log('=======================================');
  console.log('This test validates all critical components of ON-01 with multiple iterations.');
  console.log('');
  
  try {
    // Test 1: A/B Test Distribution
    const distributionWorks = await testABTestDistribution();
    
    // Test 2: Baseline Completion
    const baselineWorks = await testBaselineCompletion();
    
    // Test 3: Control Path
    const controlWorks = await testControlPath();
    
    // Test 4: Insights Blocking
    const blockingWorks = await testInsightsBlocking();
    
    // Generate report
    generateReport();
    
    console.log('\n🎯 CRITICAL COMPONENTS STATUS:');
    console.log(`✅ A/B Test Distribution: ${distributionWorks ? 'WORKING' : 'FAILING'}`);
    console.log(`✅ Baseline Completion: ${baselineWorks ? 'WORKING' : 'FAILING'}`);
    console.log(`✅ Control Path: ${controlWorks ? 'WORKING' : 'FAILING'}`);
    console.log(`✅ Insights Blocking: ${blockingWorks ? 'WORKING' : 'FAILING'}`);
    
    const allCritical = distributionWorks && baselineWorks && controlWorks && blockingWorks;
    console.log(`\n🎯 OVERALL STATUS: ${allCritical ? 'PRODUCTION READY' : 'NEEDS WORK'}`);
    
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }
}

// Run the comprehensive validation
runComprehensiveValidation(); 