#!/usr/bin/env node

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testBaselineSimple() {
  console.log('🧪 Simple Baseline Test');
  console.log('=======================');
  
  try {
    // 1. Create a simple user
    console.log('\n1. Creating user...');
    const userData = {
      email: `test-baseline-${Date.now()}@test.com`,
      nickname: 'TestUser',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      cycle_stage: 'ivf_prep',
      onboarding_path: 'test'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!createResponse.ok) {
      console.log('❌ User creation failed:', await createResponse.text());
      return;
    }
    
    const createResult = await createResponse.json();
    console.log('✅ User created:', createResult.user.email);
    
    const token = createResult.token;
    
    // 2. Try to update baseline
    console.log('\n2. Updating baseline...');
    const baselineData = {
      nickname: 'UpdatedUser',
      confidence_meds: 7,
      confidence_costs: 6,
      confidence_overall: 8,
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
    
    console.log('Baseline response status:', baselineResponse.status);
    
    if (!baselineResponse.ok) {
      const errorText = await baselineResponse.text();
      console.log('❌ Baseline update failed:', errorText);
      return;
    }
    
    const baselineResult = await baselineResponse.json();
    console.log('✅ Baseline updated successfully:', baselineResult);
    
    // 3. Verify the update
    console.log('\n3. Verifying update...');
    const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      console.log('❌ User fetch failed:', await userResponse.text());
      return;
    }
    
    const userResult = await userResponse.json();
    console.log('✅ User data after baseline update:');
    console.log('- Nickname:', userResult.user.nickname);
    console.log('- Confidence meds:', userResult.user.confidence_meds);
    console.log('- Baseline completed:', userResult.user.baseline_completed);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBaselineSimple(); 