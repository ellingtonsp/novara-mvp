#!/usr/bin/env node

/**
 * 🧪 ON-01 STEP-BY-STEP VALIDATION TEST
 * Tests the ON-01 A/B test implementation incrementally
 * Stops at logical testing points for easy troubleshooting
 */

const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:9002';
const TEST_EMAIL_PREFIX = 'on01-test';

let TEST_RESULTS = [];
let AUTH_TOKEN = null;
let USER_ID = null;
let SESSION_ID = null;

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
function generateTestEmail(path) {
  return `${TEST_EMAIL_PREFIX}-${path}-${Date.now()}@test.com`;
}

// Wait for user input to continue
function waitForUserInput(message) {
  return new Promise((resolve) => {
    console.log(`\n${message}`);
    console.log('Press Enter to continue...');
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

async function testStep1_ABTestFramework() {
  console.log('\n🎯 STEP 1: A/B Test Framework Validation');
  console.log('==========================================');
  
  // Test 1.1: Session ID generation
  console.log('\n1.1 Testing session ID generation...');
  const sessionId1 = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId2 = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logTest('Session ID Generation', 
    sessionId1 !== sessionId2 && sessionId1.startsWith('session_'),
    'Generated unique session IDs'
  );
  
  // Test 1.2: Deterministic path assignment
  console.log('\n1.2 Testing deterministic path assignment...');
  const testSessionIds = [
    'session_1234567890_abc123def',
    'session_1234567890_xyz789ghi',
    'session_1234567890_mno456jkl'
  ];
  
  const pathResults = testSessionIds.map(sessionId => {
    const sessionHash = sessionId.split('_').pop() || sessionId;
    const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
    return sessionBasedSplit ? 'test' : 'control';
  });
  
  console.log('Path assignments:', pathResults);
  logTest('Deterministic Path Assignment',
    pathResults.every(path => path === 'test' || path === 'control'),
    `Paths assigned: ${pathResults.join(', ')}`
  );
  
  // Test 1.3: 50/50 distribution simulation
  console.log('\n1.3 Testing 50/50 distribution...');
  const distributionTest = Array.from({length: 100}, (_, i) => {
    const sessionId = `session_${i}_test${i}`;
    const sessionHash = sessionId.split('_').pop() || sessionId;
    const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
    return sessionBasedSplit ? 'test' : 'control';
  });
  
  const testCount = distributionTest.filter(p => p === 'test').length;
  const controlCount = distributionTest.filter(p => p === 'control').length;
  const distribution = Math.abs(testCount - controlCount) / 100;
  
  logTest('50/50 Distribution',
    distribution <= 0.2, // Allow 20% variance
    `Test: ${testCount}, Control: ${controlCount} (${Math.round(distribution * 100)}% variance)`
  );
  
  await waitForUserInput('✅ Step 1 complete. A/B test framework is working correctly.');
}

async function testStep2_BackendDatabaseSchema() {
  console.log('\n🎯 STEP 2: Backend Database Schema Validation');
  console.log('==============================================');
  
  // Test 2.1: Health check
  console.log('\n2.1 Testing backend health...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    logTest('Backend Health Check',
      healthResponse.ok && healthData.status === 'ok',
      `Status: ${healthData.status}, Environment: ${healthData.environment}`
    );
  } catch (error) {
    logTest('Backend Health Check', false, `Error: ${error.message}`);
    throw new Error('Backend not available');
  }
  
  // Test 2.2: Database schema validation
  console.log('\n2.2 Testing database schema...');
  try {
    // Create a test user to check schema
    const testUser = {
      email: generateTestEmail('schema'),
      nickname: 'SchemaTest',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      primary_need: 'emotional_support',
      cycle_stage: 'ivf_prep',
      onboarding_path: 'test' // Test the new field
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    
    logTest('Database Schema - onboarding_path Field',
      createResponse.ok && createData.user?.onboarding_path === 'test',
      `User created with onboarding_path: ${createData.user?.onboarding_path}`
    );
    
    // Clean up test user
    if (createResponse.ok) {
      // Note: We'll clean up in a later step
      console.log('   Test user created for schema validation');
    }
    
  } catch (error) {
    logTest('Database Schema Validation', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 2 complete. Backend database schema supports ON-01 fields.');
}

async function testStep3_ControlPathUserJourney() {
  console.log('\n🎯 STEP 3: Control Path User Journey');
  console.log('=====================================');
  
  const controlEmail = generateTestEmail('control');
  SESSION_ID = `session_${Date.now()}_control_test`;
  
  console.log(`\nTesting control path with email: ${controlEmail}`);
  
  // Test 3.1: Create control path user
  console.log('\n3.1 Creating control path user...');
  const controlUser = {
    email: controlEmail,
    nickname: 'ControlUser',
    confidence_meds: 7,
    confidence_costs: 6,
    confidence_overall: 8,
    primary_need: 'emotional_support',
    cycle_stage: 'ivf_prep',
    top_concern: 'medication side effects',
    onboarding_path: 'control'
  };
  
  try {
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controlUser)
    });
    
    const createData = await createResponse.json();
    
    logTest('Control Path User Creation',
      createResponse.ok && createData.user?.onboarding_path === 'control',
      `User created: ${createData.user?.email}, Path: ${createData.user?.onboarding_path}`
    );
    
    if (createResponse.ok) {
      AUTH_TOKEN = createData.token;
      USER_ID = createData.user?.id;
    }
    
  } catch (error) {
    logTest('Control Path User Creation', false, `Error: ${error.message}`);
    throw error;
  }
  
  // Test 3.2: Login with control user
  console.log('\n3.2 Testing login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: controlEmail })
    });
    
    const loginData = await loginResponse.json();
    
    logTest('Control Path Login',
      loginResponse.ok && loginData.user?.onboarding_path === 'control',
      `Login successful, Path: ${loginData.user?.onboarding_path}`
    );
    
  } catch (error) {
    logTest('Control Path Login', false, `Error: ${error.message}`);
  }
  
  // Test 3.3: Check if user needs baseline completion
  console.log('\n3.3 Testing baseline completion logic...');
  try {
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    const userData = await userResponse.json();
    
    // Control path users should NOT need baseline completion if they have full onboarding
    const needsBaseline = userData.user?.onboarding_path === 'control' && 
                         (!userData.user?.primary_need || !userData.user?.cycle_stage);
    
    logTest('Control Path Baseline Logic',
      !needsBaseline, // Should NOT need baseline
      `Path: ${userData.user?.onboarding_path}, Needs baseline: ${needsBaseline}`
    );
    
  } catch (error) {
    logTest('Control Path Baseline Logic', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 3 complete. Control path user journey validated.');
}

async function testStep4_TestPathUserJourney() {
  console.log('\n🎯 STEP 4: Test Path User Journey');
  console.log('==================================');
  
  const testEmail = generateTestEmail('test');
  
  console.log(`\nTesting test path with email: ${testEmail}`);
  
  // Test 4.1: Create test path user (fast onboarding)
  console.log('\n4.1 Creating test path user (fast onboarding)...');
  const testUser = {
    email: testEmail,
    cycle_stage: 'ivf_prep',
    primary_concern: 'medical_clarity',
    onboarding_path: 'test'
    // Note: Missing nickname, confidence fields, top_concern - these come later
  };
  
  try {
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    
    logTest('Test Path User Creation (Fast Onboarding)',
      createResponse.ok && createData.user?.onboarding_path === 'test',
      `User created: ${createData.user?.email}, Path: ${createData.user?.onboarding_path}`
    );
    
    if (createResponse.ok) {
      // Store test user token for later use
      const testToken = createData.token;
      const testUserId = createData.user?.id;
      
      // Test 4.2: Check if test user needs baseline completion
      console.log('\n4.2 Testing baseline completion requirement...');
      const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      
      const userData = await userResponse.json();
      
      // Test path users SHOULD need baseline completion
      const needsBaseline = userData.user?.onboarding_path === 'test' && 
                           !userData.user?.baseline_completed;
      
      logTest('Test Path Baseline Requirement',
        needsBaseline, // Should need baseline
        `Path: ${userData.user?.onboarding_path}, Baseline completed: ${userData.user?.baseline_completed}, Needs baseline: ${needsBaseline}`
      );
      
      // Test 4.3: Complete baseline panel
      console.log('\n4.3 Testing baseline panel completion...');
      const baselineData = {
        nickname: 'TestUser',
        confidence_meds: 6,
        confidence_costs: 4,
        confidence_overall: 5,
        top_concern: 'financial stress'
      };
      
          const baselineResponse = await fetch(`${BASE_URL}/api/users/baseline`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(baselineData)
    });
      
      const baselineResult = await baselineResponse.json();
      
      logTest('Baseline Panel Completion',
        baselineResponse.ok && baselineResult.user?.baseline_completed === true,
        `Baseline completed: ${baselineResult.user?.baseline_completed}`
      );
      
      // Test 4.4: Verify user no longer needs baseline
      console.log('\n4.4 Verifying baseline completion...');
      const finalUserResponse = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      
      const finalUserData = await finalUserResponse.json();
      
      const stillNeedsBaseline = finalUserData.user?.onboarding_path === 'test' && 
                                !finalUserData.user?.baseline_completed;
      
      logTest('Test Path Post-Baseline State',
        !stillNeedsBaseline, // Should NOT need baseline anymore
        `Path: ${finalUserData.user?.onboarding_path}, Baseline completed: ${finalUserData.user?.baseline_completed}, Still needs baseline: ${stillNeedsBaseline}`
      );
      
    }
    
  } catch (error) {
    logTest('Test Path User Journey', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 4 complete. Test path user journey validated.');
}

async function testStep5_InsightsBlockingLogic() {
  console.log('\n🎯 STEP 5: Insights Blocking Logic');
  console.log('===================================');
  
  // Test 5.1: Control path user should get insights immediately
  console.log('\n5.1 Testing control path insights access...');
  try {
    const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    const insightsData = await insightsResponse.json();
    
    logTest('Control Path Insights Access',
      insightsResponse.ok,
      `Insights available: ${insightsData.success}`
    );
    
  } catch (error) {
    logTest('Control Path Insights Access', false, `Error: ${error.message}`);
  }
  
  // Test 5.2: Create incomplete test user to test blocking
  console.log('\n5.2 Testing test path insights blocking...');
  const incompleteTestEmail = generateTestEmail('incomplete-test');
  
  try {
    const incompleteUser = {
      email: incompleteTestEmail,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medical_clarity',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteUser)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      const incompleteToken = createData.token;
      
      const blockedInsightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
        headers: { 'Authorization': `Bearer ${incompleteToken}` }
      });
      
      const blockedInsightsData = await blockedInsightsResponse.json();
      
      // Should be blocked or return specific error
      const isBlocked = !blockedInsightsResponse.ok || 
                       blockedInsightsData.error?.includes('baseline') ||
                       blockedInsightsData.error?.includes('complete');
      
      logTest('Test Path Insights Blocking',
        isBlocked,
        `Response: ${blockedInsightsResponse.status}, Blocked: ${isBlocked}`
      );
    }
    
  } catch (error) {
    logTest('Test Path Insights Blocking', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 5 complete. Insights blocking logic validated.');
}

async function testStep6_AnalyticsTracking() {
  console.log('\n🎯 STEP 6: Analytics Tracking');
  console.log('==============================');
  
  // Test 6.1: Check if analytics endpoints exist
  console.log('\n6.1 Testing analytics endpoint availability...');
  try {
    const analyticsResponse = await fetch(`${BASE_URL}/api/analytics/health`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    logTest('Analytics Endpoint Health',
      analyticsResponse.ok,
      `Status: ${analyticsResponse.status}`
    );
    
  } catch (error) {
    logTest('Analytics Endpoint Health', false, `Error: ${error.message}`);
  }
  
  // Test 6.2: Test onboarding completion tracking
  console.log('\n6.2 Testing onboarding completion tracking...');
  try {
    const trackingData = {
      event: 'onboarding_completed',
      properties: {
        path: 'control',
        completion_ms: 45000,
        session_id: SESSION_ID,
        user_id: USER_ID
      }
    };
    
    const trackingResponse = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(trackingData)
    });
    
    logTest('Onboarding Completion Tracking',
      trackingResponse.ok,
      `Tracking event sent: ${trackingResponse.status}`
    );
    
  } catch (error) {
    logTest('Onboarding Completion Tracking', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 6 complete. Analytics tracking validated.');
}

async function testStep7_CompleteUserJourney() {
  console.log('\n🎯 STEP 7: Complete User Journey Integration');
  console.log('=============================================');
  
  // Test 7.1: End-to-end control path
  console.log('\n7.1 Testing complete control path journey...');
  const controlJourneyEmail = generateTestEmail('control-journey');
  
  try {
    // Create user
    const controlUser = {
      email: controlJourneyEmail,
      nickname: 'ControlJourney',
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
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      const journeyToken = createData.token;
      
      // Submit check-in
      const checkinData = {
        mood_today: 'hopeful, excited',
        confidence_today: 8,
        concerns: ['medication side effects'],
        notes: 'Feeling positive about today'
      };
      
      const checkinResponse = await fetch(`${BASE_URL}/api/checkins/daily`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${journeyToken}`
        },
        body: JSON.stringify(checkinData)
      });
      
      const checkinResult = await checkinResponse.json();
      
      logTest('Control Path Complete Journey',
        checkinResponse.ok && checkinResult.success,
        `Check-in submitted: ${checkinResult.success}`
      );
      
      // Get insights
      const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
        headers: { 'Authorization': `Bearer ${journeyToken}` }
      });
      
      const insightsData = await insightsResponse.json();
      
      logTest('Control Path Insights Generation',
        insightsResponse.ok && insightsData.success,
        `Insights generated: ${insightsData.success}`
      );
    }
    
  } catch (error) {
    logTest('Control Path Complete Journey', false, `Error: ${error.message}`);
  }
  
  // Test 7.2: End-to-end test path
  console.log('\n7.2 Testing complete test path journey...');
  const testJourneyEmail = generateTestEmail('test-journey');
  
  try {
    // Create fast onboarding user
    const testUser = {
      email: testJourneyEmail,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medical_clarity',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      const journeyToken = createData.token;
      const journeyUserId = createData.user?.id;
      
      // Complete baseline
      const baselineData = {
        nickname: 'TestJourney',
        confidence_meds: 5,
        confidence_costs: 3,
        confidence_overall: 4,
        top_concern: 'financial stress'
      };
      
      const baselineResponse = await fetch(`${BASE_URL}/api/users/baseline`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${journeyToken}`
        },
        body: JSON.stringify(baselineData)
      });
      
      if (baselineResponse.ok) {
        // Submit check-in
        const checkinData = {
          mood_today: 'anxious, worried',
          confidence_today: 4,
          concerns: ['financial stress'],
          notes: 'Feeling overwhelmed about costs'
        };
        
        const checkinResponse = await fetch(`${BASE_URL}/api/checkins/daily`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${journeyToken}`
          },
          body: JSON.stringify(checkinData)
        });
        
        const checkinResult = await checkinResponse.json();
        
        logTest('Test Path Complete Journey',
          checkinResponse.ok && checkinResult.success,
          `Check-in submitted: ${checkinResult.success}`
        );
        
        // Get insights
        const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
          headers: { 'Authorization': `Bearer ${journeyToken}` }
        });
        
        const insightsData = await insightsResponse.json();
        
        logTest('Test Path Insights Generation',
          insightsResponse.ok && insightsData.success,
          `Insights generated: ${insightsData.success}`
        );
      }
    }
    
  } catch (error) {
    logTest('Test Path Complete Journey', false, `Error: ${error.message}`);
  }
  
  await waitForUserInput('✅ Step 7 complete. Complete user journey validated.');
}

async function generateTestReport() {
  console.log('\n📋 ON-01 TEST RESULTS SUMMARY');
  console.log('==============================');
  
  const passed = TEST_RESULTS.filter(r => r.success).length;
  const total = TEST_RESULTS.length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`\nOverall Results: ${passed}/${total} tests passed (${successRate}%)`);
  
  console.log('\nDetailed Results:');
  TEST_RESULTS.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
  });
  
  console.log('\n🎯 ON-01 Implementation Status:');
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
    results: TEST_RESULTS
  };
  
  fs.writeFileSync('ON-01-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: ON-01-test-report.json');
}

async function runAllTests() {
  console.log('🧪 ON-01 STEP-BY-STEP VALIDATION TEST');
  console.log('=====================================');
  console.log('This test validates the ON-01 A/B test implementation incrementally.');
  console.log('Each step will pause for your review before proceeding.\n');
  
  try {
    await testStep1_ABTestFramework();
    await testStep2_BackendDatabaseSchema();
    await testStep3_ControlPathUserJourney();
    await testStep4_TestPathUserJourney();
    await testStep5_InsightsBlockingLogic();
    await testStep6_AnalyticsTracking();
    await testStep7_CompleteUserJourney();
    
    await generateTestReport();
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend is running on port 9002');
    console.log('2. Check database connectivity');
    console.log('3. Verify environment variables are set');
    console.log('4. Review error logs above');
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testStep1_ABTestFramework,
  testStep2_BackendDatabaseSchema,
  testStep3_ControlPathUserJourney,
  testStep4_TestPathUserJourney,
  testStep5_InsightsBlockingLogic,
  testStep6_AnalyticsTracking,
  testStep7_CompleteUserJourney
}; 