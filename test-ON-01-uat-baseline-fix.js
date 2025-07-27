#!/usr/bin/env node

/**
 * 🧪 ON-01 UAT Baseline Fix Test
 * Quick test to verify baseline completion works after CORS fix
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testBaselineCompletion() {
  console.log('🧪 ON-01 UAT Baseline Fix Test');
  console.log('================================');
  
  try {
    // 1. Create test user
    console.log('1. Creating test user...');
    const testUser = {
      email: `uat-baseline-fix-${Date.now()}@test.com`,
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
      throw new Error(`User creation failed: ${await createResponse.text()}`);
    }
    
    const createData = await createResponse.json();
    console.log('✅ User created:', createData.user.email);
    
    const token = createData.token;
    
    // 2. Test baseline completion
    console.log('2. Testing baseline completion...');
    const baselineData = {
      nickname: 'UATTestUser',
      confidence_meds: 8,
      confidence_costs: 6,
      confidence_overall: 7,
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
      throw new Error(`Baseline completion failed: ${errorText}`);
    }
    
    const baselineResult = await baselineResponse.json();
    console.log('✅ Baseline completed successfully');
    
    // 3. Verify final state
    console.log('3. Verifying final state...');
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      throw new Error(`User fetch failed: ${await userResponse.text()}`);
    }
    
    const userData = await userResponse.json();
    console.log('Final user state:', {
      onboarding_path: userData.user.onboarding_path,
      baseline_completed: userData.user.baseline_completed,
      nickname: userData.user.nickname,
      confidence_meds: userData.user.confidence_meds
    });
    
    // 4. Test insights access
    console.log('4. Testing insights access...');
    const insightsResponse = await fetch(`${BASE_URL}/api/insights/daily`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const insightsAccessible = insightsResponse.ok;
    console.log(`Insights accessible: ${insightsAccessible ? '✅' : '❌'} (${insightsResponse.status})`);
    
    // 5. Summary
    console.log('\n📊 UAT Baseline Fix Results:');
    console.log('=============================');
    console.log(`✅ User Creation: ${createResponse.status === 201 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Baseline Completion: ${baselineResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Data Persistence: ${userData.user.baseline_completed === 1 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Insights Access: ${insightsAccessible ? 'PASS' : 'FAIL'}`);
    
    const allPassed = createResponse.status === 201 && 
                     baselineResponse.status === 200 && 
                     userData.user.baseline_completed === 1 && 
                     insightsAccessible;
    
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ UAT PASSED' : '❌ UAT FAILED'}`);
    
    if (allPassed) {
      console.log('\n🚀 Ready for full UAT testing!');
      console.log('The baseline completion fix is working correctly.');
    } else {
      console.log('\n⚠️ Issues remain - need further investigation');
    }
    
  } catch (error) {
    console.error('❌ UAT test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend is running on port 9002');
    console.log('2. Check CORS configuration includes PATCH method');
    console.log('3. Verify database schema supports baseline_completed field');
  }
}

// Run the test
testBaselineCompletion(); 