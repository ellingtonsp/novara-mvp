#!/usr/bin/env node

/**
 * 🧪 ON-01 BASELINE COMPLETION DEBUG TEST
 * Focused test to debug step 4.3 baseline panel completion issue
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';
const TEST_EMAIL = `on01-baseline-debug-${Date.now()}@test.com`;

async function debugBaselineCompletion() {
  console.log('🔍 DEBUGGING ON-01 BASELINE COMPLETION (Step 4.3)');
  console.log('================================================');
  
  try {
    // Step 1: Create test path user
    console.log('\n1. Creating test path user...');
    const testUser = {
      email: TEST_EMAIL,
      cycle_stage: 'ivf_prep',
      primary_concern: 'medical_clarity',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    console.log(`Create Response Status: ${createResponse.status}`);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ User creation failed:');
      console.log('Error:', errorText);
      return;
    }
    
    const createData = await createResponse.json();
    console.log('✅ User created successfully');
    console.log('User data:', JSON.stringify(createData.user, null, 2));
    
    const testToken = createData.token;
    const testUserId = createData.user?.id;
    
    // Step 2: Check user state before baseline
    console.log('\n2. Checking user state before baseline...');
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log(`User Response Status: ${userResponse.status}`);
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.log('❌ User fetch failed:');
      console.log('Error:', errorText);
      return;
    }
    
    const userData = await userResponse.json();
    console.log('✅ User data retrieved');
    console.log('User state:', {
      email: userData.user?.email,
      onboarding_path: userData.user?.onboarding_path,
      baseline_completed: userData.user?.baseline_completed,
      has_nickname: !!userData.user?.nickname,
      has_confidence_fields: !!(userData.user?.confidence_meds && userData.user?.confidence_costs && userData.user?.confidence_overall)
    });
    
    // Step 3: Attempt baseline completion
    console.log('\n3. Attempting baseline panel completion...');
    const baselineData = {
      nickname: 'TestUser',
      confidence_meds: 6,
      confidence_costs: 4,
      confidence_overall: 5,
      top_concern: 'financial stress',
      baseline_completed: true
    };
    
    console.log('Baseline data to send:', JSON.stringify(baselineData, null, 2));
    console.log('Target endpoint:', `${BASE_URL}/api/users/baseline`);
    
    const baselineResponse = await fetch(`${BASE_URL}/api/users/baseline`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(baselineData)
    });
    
    console.log(`Baseline Response Status: ${baselineResponse.status}`);
    console.log(`Baseline Response Headers:`, Object.fromEntries(baselineResponse.headers.entries()));
    
    const baselineText = await baselineResponse.text();
    console.log('Baseline Response Body:', baselineText);
    
    if (!baselineResponse.ok) {
      console.log('❌ Baseline completion failed');
      console.log('Status:', baselineResponse.status);
      console.log('Status Text:', baselineResponse.statusText);
      console.log('Response:', baselineText);
      return;
    }
    
    let baselineResult;
    try {
      baselineResult = JSON.parse(baselineText);
    } catch (e) {
      console.log('❌ Failed to parse baseline response as JSON');
      console.log('Raw response:', baselineText);
      return;
    }
    
    console.log('✅ Baseline completion successful');
    console.log('Baseline result:', JSON.stringify(baselineResult, null, 2));
    
    // Step 4: Verify user state after baseline
    console.log('\n4. Verifying user state after baseline...');
    const finalUserResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    if (!finalUserResponse.ok) {
      const errorText = await finalUserResponse.text();
      console.log('❌ Final user fetch failed:');
      console.log('Error:', errorText);
      return;
    }
    
    const finalUserData = await finalUserResponse.json();
    console.log('✅ Final user state:');
    console.log('User state after baseline:', {
      email: finalUserData.user?.email,
      onboarding_path: finalUserData.user?.onboarding_path,
      baseline_completed: finalUserData.user?.baseline_completed,
      nickname: finalUserData.user?.nickname,
      confidence_meds: finalUserData.user?.confidence_meds,
      confidence_costs: finalUserData.user?.confidence_costs,
      confidence_overall: finalUserData.user?.confidence_overall,
      top_concern: finalUserData.user?.top_concern
    });
    
    // Step 5: Check if baseline endpoint exists
    console.log('\n5. Checking if baseline endpoint exists...');
    const optionsResponse = await fetch(`${BASE_URL}/api/users/${testUserId}/baseline`, {
      method: 'OPTIONS',
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    console.log(`OPTIONS Response Status: ${optionsResponse.status}`);
    console.log(`OPTIONS Response Headers:`, Object.fromEntries(optionsResponse.headers.entries()));
    
    // Step 6: Check server routes
    console.log('\n6. Checking available routes...');
    const routesResponse = await fetch(`${BASE_URL}/api/routes`, {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    
    if (routesResponse.ok) {
      const routesData = await routesResponse.json();
      console.log('Available routes:', routesData);
    } else {
      console.log('Routes endpoint not available');
    }
    
    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('==================');
    console.log('✅ User creation: Working');
    console.log('✅ User fetch: Working');
    console.log(`❓ Baseline completion: ${baselineResponse.ok ? 'Working' : 'Failed'}`);
    console.log('✅ User state verification: Working');
    
    if (!baselineResponse.ok) {
      console.log('\n🔧 LIKELY ISSUES:');
      console.log('1. Baseline endpoint not implemented');
      console.log('2. Incorrect endpoint URL');
      console.log('3. Missing route handler');
      console.log('4. Authentication issue');
      console.log('5. Database schema issue');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug test
debugBaselineCompletion(); 