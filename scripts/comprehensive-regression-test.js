#!/usr/bin/env node

const fetch = require('node-fetch');

const API_URL = 'http://localhost:9002';
let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

async function makeRequest(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || JSON.stringify(data)}`);
  }
  
  return data;
}

async function runTests() {
  console.log('\n🧪 Comprehensive Regression Test Suite\n');
  
  const timestamp = Date.now();
  const testEmail = `test_regression_${timestamp}@example.com`;
  let authToken;
  let userId;
  
  // 1. Health Check
  await test('Health endpoint returns OK', async () => {
    const result = await makeRequest('GET', '/api/health');
    if (result.status !== 'ok') throw new Error('Health check failed');
  });
  
  // 2. User Registration
  await test('User registration with all fields', async () => {
    const result = await makeRequest('POST', '/api/users', {
      email: testEmail,
      nickname: 'RegressionTest',
      confidence_meds: 7,
      confidence_costs: 6,
      confidence_overall: 8,
      primary_need: 'egg_quality',
      cycle_stage: 'stimulation',
      onboarding_path: 'test',
      baseline_completed: true,
      medication_status: 'taking_meds',
      top_concern: 'injection_anxiety'
    });
    
    if (!result.token) throw new Error('No token received');
    if (!result.user?.id) throw new Error('No user ID received');
    
    authToken = result.token;
    userId = result.user.id;
  });
  
  // 3. Get User Profile
  await test('Get user profile returns correct data', async () => {
    const result = await makeRequest('GET', '/api/users/me', null, authToken);
    if (result.user.email !== testEmail) throw new Error('Wrong email returned');
    if (result.user.nickname !== 'RegressionTest') throw new Error('Wrong nickname');
  });
  
  // 4. Update User Profile
  await test('Update user profile', async () => {
    const result = await makeRequest('PUT', '/api/users/me', {
      nickname: 'UpdatedNickname',
      timezone: 'America/New_York',
      confidence_meds: 9
    }, authToken);
    
    if (result.user.nickname !== 'UpdatedNickname') throw new Error('Update failed');
  });
  
  // 5. Quick Check-in
  await test('Create quick check-in', async () => {
    const result = await makeRequest('POST', '/api/checkins', {
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Quick check-in test'
    }, authToken);
    
    if (!result.checkin?.id) throw new Error('No check-in ID returned');
  });
  
  // 6. Enhanced Check-in with PHQ-4
  await test('Create enhanced check-in with PHQ-4', async () => {
    const result = await makeRequest('POST', '/api/checkins', {
      mood_today: 'confident',
      confidence_today: 9,
      medication_taken: 'yes',
      anxiety_level: 3,
      phq4_feeling_nervous: 1,
      phq4_stop_worrying: 2,
      phq4_little_interest: 0,
      phq4_feeling_down: 1,
      coping_strategies_used: ['meditation', 'exercise', 'journaling'],
      physical_symptoms: ['mild_cramping', 'bloating'],
      symptom_severity: { mild_cramping: 2, bloating: 3 },
      appointment_within_3_days: true,
      appointment_anxiety: 4,
      wish_knew_more_about: ['side_effects', 'success_rates'],
      date_submitted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }, authToken);
    
    if (!result.checkin?.id) throw new Error('No check-in ID returned');
  });
  
  // 7. Enhanced Check-in without medication
  await test('Create enhanced check-in without medication tracking', async () => {
    const result = await makeRequest('POST', '/api/checkins', {
      mood_today: 'optimistic',
      confidence_today: 7,
      medication_taken: 'not tracked',
      anxiety_level: 4,
      coping_strategies_used: ['breathing_exercises'],
      primary_concern_today: 'egg_retrieval_prep',
      date_submitted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }, authToken);
    
    if (!result.checkin?.id) throw new Error('No check-in ID returned');
  });
  
  // 8. Get Check-ins
  await test('Get user check-ins returns all fields', async () => {
    const result = await makeRequest('GET', '/api/checkins', null, authToken);
    
    if (!result.records || result.records.length < 3) {
      throw new Error(`Expected at least 3 check-ins, got ${result.records?.length}`);
    }
    
    // Verify we have the expected check-ins
    
    // Find the enhanced check-in with PHQ-4 data
    const enhancedCheckin = result.records.find(r => 
      r.fields?.phq4_feeling_nervous === 1
    );
    
    if (!enhancedCheckin) {
      // Check if any check-in has PHQ-4 data
      const anyPHQ4 = result.records.find(r => 
        r.fields?.phq4_feeling_nervous !== null && r.fields?.phq4_feeling_nervous !== undefined
      );
      if (!anyPHQ4) {
        throw new Error('No check-ins have PHQ-4 data');
      } else {
        throw new Error(`Enhanced check-in has wrong PHQ-4 value: ${anyPHQ4.fields.phq4_feeling_nervous}`);
      }
    }
    
    const fields = enhancedCheckin.fields;
    if (!Array.isArray(fields.coping_strategies_used)) throw new Error('Coping strategies not array');
    if (!Array.isArray(fields.physical_symptoms)) throw new Error('Physical symptoms not array');
  });
  
  // 9. Get Metrics
  await test('Get metrics with correct calculations', async () => {
    const result = await makeRequest('GET', '/api/users/metrics', null, authToken);
    
    if (!result.metrics) throw new Error('No metrics returned');
    
    const m = result.metrics;
    if (typeof m.medicationAdherenceRate !== 'number') throw new Error('Missing medication adherence');
    if (typeof m.averageMoodScore !== 'number') throw new Error('Missing average mood score');
    if (m.currentPHQ4Score !== 4) throw new Error(`Wrong PHQ-4 score: ${m.currentPHQ4Score}`);
    if (m.totalCheckIns < 3) throw new Error('Wrong total check-ins count');
  });
  
  // 10. Generate Insights
  await test('Generate daily insights', async () => {
    const result = await makeRequest('GET', '/api/insights/daily', null, authToken);
    
    if (!result.insight?.title) throw new Error('No insight title');
    if (!result.insight?.message) throw new Error('No insight message');
  });
  
  // 11. Baseline Update
  await test('Update baseline data', async () => {
    const result = await makeRequest('PATCH', '/api/users/baseline', {
      nickname: 'BaselineUpdate',
      confidence_meds: 10,
      confidence_costs: 8,
      confidence_overall: 9,
      worst_moment: 'injection_fear',
      partner_support: true,
      top_priority: 'minimize_side_effects',
      primary_concern: 'ohss_risk',
      biggest_worry: 'cycle_cancellation'
    }, authToken);
    
    if (!result.success) throw new Error('Baseline update failed');
  });
  
  // 12. Error Handling - Invalid Token
  await test('Invalid token returns 401 or 403', async () => {
    try {
      await makeRequest('GET', '/api/users/me', null, 'invalid-token');
      throw new Error('Should have failed');
    } catch (error) {
      if (!error.message.includes('401') && !error.message.includes('403')) throw error;
    }
  });
  
  // 13. Error Handling - Missing Required Fields
  await test('Missing required fields returns 400', async () => {
    try {
      await makeRequest('POST', '/api/checkins', {
        // Missing mood_today
        confidence_today: 5
      }, authToken);
      throw new Error('Should have failed');
    } catch (error) {
      if (!error.message.includes('400')) throw error;
    }
  });
  
  // 14. Complete Onboarding
  await test('Complete onboarding endpoint', async () => {
    const result = await makeRequest('POST', '/api/users/complete-onboarding', null, authToken);
    if (!result.success) throw new Error('Onboarding completion failed');
  });
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${testsPassed}`);
  console.log(`   Failed: ${testsFailed}`);
  console.log(`   Total:  ${testsPassed + testsFailed}\n`);
  
  if (testsFailed > 0) {
    console.log('❌ Some tests failed!\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest('GET', '/api/health');
  } catch (error) {
    console.log('\n❌ Server is not running on port 9002');
    console.log('Please start the server with: npm run dev:postgres\n');
    process.exit(1);
  }
}

// Run tests
checkServer().then(runTests).catch(console.error);