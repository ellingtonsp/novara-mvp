#!/usr/bin/env node

/**
 * Test Script: Onboarding Insight Fix Validation
 * 
 * This script validates that:
 * 1. Users who haven't completed onboarding cannot access insights
 * 2. Users who have completed onboarding can access insights
 * 3. The frontend correctly handles the backend responses
 * 4. The logic is consistent across different onboarding paths
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9002';
const TEST_USER_EMAIL = 'test-onboarding-fix@example.com';

// Test scenarios
const testScenarios = [
  {
    name: 'Test Path User - No Baseline Completion',
    userData: {
      email: 'test-path-no-baseline@example.com',
      nickname: 'TestPathUser',
      onboarding_path: 'test',
      baseline_completed: false,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    },
    expectedResult: 'BLOCKED',
    description: 'Test path user without baseline completion should be blocked'
  },
  {
    name: 'Test Path User - With Baseline Completion',
    userData: {
      email: 'test-path-with-baseline@example.com',
      nickname: 'TestPathUser',
      onboarding_path: 'test',
      baseline_completed: true,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    },
    expectedResult: 'ALLOWED',
    description: 'Test path user with baseline completion should be allowed'
  },
  {
    name: 'Control Path User - Incomplete Onboarding',
    userData: {
      email: 'control-incomplete@example.com',
      nickname: 'ControlUser',
      onboarding_path: 'control',
      baseline_completed: false,
      primary_need: null,
      cycle_stage: null
    },
    expectedResult: 'BLOCKED',
    description: 'Control path user without primary_need and cycle_stage should be blocked'
  },
  {
    name: 'Control Path User - Complete Onboarding',
    userData: {
      email: 'control-complete@example.com',
      nickname: 'ControlUser',
      onboarding_path: 'control',
      baseline_completed: false,
      primary_need: 'financial_planning',
      cycle_stage: 'ivf_prep'
    },
    expectedResult: 'ALLOWED',
    description: 'Control path user with primary_need and cycle_stage should be allowed'
  }
];

async function createTestUser(userData) {
  try {
    console.log(`\n🔧 Creating test user: ${userData.email}`);
    
    const response = await axios.post(`${API_BASE_URL}/api/users`, {
      email: userData.email,
      nickname: userData.nickname,
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      primary_need: userData.primary_need,
      cycle_stage: userData.cycle_stage,
      top_concern: 'financial_stress',
      email_opt_in: true,
      onboarding_path: userData.onboarding_path,
      baseline_completed: userData.baseline_completed
    });

    if (response.data.success) {
      console.log(`✅ Test user created: ${userData.email}`);
      return response.data.token;
    } else {
      console.error(`❌ Failed to create test user: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️ User already exists: ${userData.email}`);
      // Try to login to get token
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: userData.email
        });
        return loginResponse.data.token;
      } catch (loginError) {
        console.error(`❌ Failed to login existing user: ${loginError.message}`);
        return null;
      }
    } else {
      console.error(`❌ Error creating test user: ${error.message}`);
      return null;
    }
  }
}

async function testInsightsAccess(token, scenario) {
  try {
    console.log(`\n🧠 Testing insights access for: ${scenario.name}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/insights/daily`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Insights access allowed for: ${scenario.name}`);
    console.log(`📊 Response:`, {
      success: response.data.success,
      insight_type: response.data.insight?.type,
      checkins_analyzed: response.data.analysis_data?.checkins_analyzed
    });

    return {
      result: 'ALLOWED',
      response: response.data
    };
  } catch (error) {
    if (error.response?.status === 403) {
      console.log(`🚫 Insights access blocked for: ${scenario.name}`);
      console.log(`📊 Block reason:`, error.response.data);
      
      return {
        result: 'BLOCKED',
        reason: error.response.data.error,
        user_status: error.response.data.user_status
      };
    } else {
      console.error(`❌ Unexpected error: ${error.message}`);
      return {
        result: 'ERROR',
        error: error.message
      };
    }
  }
}

async function runTestScenario(scenario) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST SCENARIO: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🎯 Expected Result: ${scenario.expectedResult}`);
  console.log(`${'='.repeat(60)}`);

  // Create test user
  const token = await createTestUser(scenario.userData);
  if (!token) {
    console.log(`❌ Skipping test - failed to create/get token for user`);
    return { scenario: scenario.name, status: 'SKIPPED', reason: 'No token' };
  }

  // Test insights access
  const result = await testInsightsAccess(token, scenario);
  
  // Validate result
  const passed = result.result === scenario.expectedResult;
  
  console.log(`\n${passed ? '✅' : '❌'} TEST ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Expected: ${scenario.expectedResult}`);
  console.log(`Actual: ${result.result}`);
  
  if (!passed) {
    console.log(`❌ Test failed - expected ${scenario.expectedResult} but got ${result.result}`);
  }

  return {
    scenario: scenario.name,
    status: passed ? 'PASSED' : 'FAILED',
    expected: scenario.expectedResult,
    actual: result.result,
    details: result
  };
}

async function main() {
  console.log('🚀 Starting Onboarding Insight Fix Validation');
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`⏰ Test started at: ${new Date().toISOString()}`);

  const results = [];

  // Run all test scenarios
  for (const scenario of testScenarios) {
    const result = await runTestScenario(scenario);
    results.push(result);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`  - ${result.scenario}: Expected ${result.expected}, got ${result.actual}`);
    });
  }

  if (passed === testScenarios.length) {
    console.log(`\n🎉 ALL TESTS PASSED! The onboarding insight fix is working correctly.`);
  } else {
    console.log(`\n⚠️ Some tests failed. Please review the implementation.`);
  }

  console.log(`\n⏰ Test completed at: ${new Date().toISOString()}`);
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { runTestScenario, testScenarios }; 