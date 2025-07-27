#!/usr/bin/env node

/**
 * 🧪 ON-01 Control Path Validation Test
 * Verifies the classic workflow (control path) still works correctly
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testControlPath() {
  console.log('🧪 ON-01 Control Path Validation Test');
  console.log('=====================================');
  console.log('Testing classic workflow (control path) functionality');
  console.log('');
  
  try {
    // 1. Create control path user with full onboarding
    console.log('1. Creating control path user...');
    const controlUser = {
      email: `control-validation-${Date.now()}@test.com`,
      nickname: 'ControlValidationUser',
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
      throw new Error(`User creation failed: ${await createResponse.text()}`);
    }
    
    const createData = await createResponse.json();
    console.log('✅ Control user created:', createData.user.email);
    
    const token = createData.token;
    
    // 2. Verify user state immediately after creation
    console.log('2. Verifying initial user state...');
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User fetch failed: ${await userResponse.text()}`);
    }
    
    const userData = await userResponse.json();
    console.log('Initial user state:', {
      onboarding_path: userData.user.onboarding_path,
      baseline_completed: userData.user.baseline_completed,
      nickname: userData.user.nickname,
      primary_need: userData.user.primary_need,
      cycle_stage: userData.user.cycle_stage
    });
    
    // 3. Test insights access (should be immediate for control users)
    console.log('3. Testing insights access...');
    const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const insightsAccessible = insightsResponse.ok;
    console.log(`Insights accessible: ${insightsAccessible ? '✅' : '❌'} (${insightsResponse.status})`);
    
    if (insightsAccessible) {
      const insightsData = await insightsResponse.json();
      console.log('✅ Insights data received:', insightsData.insight?.insight_title?.substring(0, 50) + '...');
    }
    
    // 4. Test check-in questions access
    console.log('4. Testing check-in questions access...');
    const questionsResponse = await fetch(`${BASE_URL}/api/checkins/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const questionsAccessible = questionsResponse.ok;
    console.log(`Questions accessible: ${questionsAccessible ? '✅' : '❌'} (${questionsResponse.status})`);
    
    if (questionsAccessible) {
      const questionsData = await questionsResponse.json();
      console.log(`✅ Questions received: ${questionsData.questions?.length || 0} questions`);
    }
    
    // 5. Test last check-in values
    console.log('5. Testing last check-in values...');
    const lastValuesResponse = await fetch(`${BASE_URL}/api/checkins/last-values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const lastValuesAccessible = lastValuesResponse.ok;
    console.log(`Last values accessible: ${lastValuesAccessible ? '✅' : '❌'} (${lastValuesResponse.status})`);
    
    // 6. Validate control path logic
    console.log('6. Validating control path logic...');
    const needsBaseline = userData.user.onboarding_path === 'control' && 
                         (!userData.user.primary_need || !userData.user.cycle_stage);
    
    const baselineCompleted = userData.user.baseline_completed === 1 || userData.user.baseline_completed === true;
    
    console.log('Control path validation:', {
      path: userData.user.onboarding_path,
      needsBaseline: needsBaseline,
      baselineCompleted: baselineCompleted,
      hasFullData: !!(userData.user.nickname && userData.user.primary_need && userData.user.cycle_stage)
    });
    
    // 7. Summary
    console.log('\n📊 Control Path Validation Results:');
    console.log('===================================');
    console.log(`✅ User Creation: ${createResponse.status === 201 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Control Path Logic: ${!needsBaseline ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Insights Access: ${insightsAccessible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Questions Access: ${questionsAccessible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Last Values Access: ${lastValuesAccessible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Full Data Present: ${!!(userData.user.nickname && userData.user.primary_need && userData.user.cycle_stage) ? 'PASS' : 'FAIL'}`);
    
    const allPassed = createResponse.status === 201 && 
                     !needsBaseline && 
                     insightsAccessible && 
                     questionsAccessible && 
                     lastValuesAccessible &&
                     !!(userData.user.nickname && userData.user.primary_need && userData.user.cycle_stage);
    
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ CONTROL PATH WORKING' : '❌ CONTROL PATH BROKEN'}`);
    
    if (allPassed) {
      console.log('\n🚀 Classic workflow is functioning correctly!');
      console.log('Control path users can access all features immediately.');
    } else {
      console.log('\n⚠️ Issues detected in control path - need investigation');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Control path test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend is running on port 9002');
    console.log('2. Check user creation endpoint');
    console.log('3. Verify insights generation logic');
    console.log('4. Check authentication flow');
    return false;
  }
}

// Run the test
testControlPath(); 