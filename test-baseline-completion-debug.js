#!/usr/bin/env node

/**
 * 🐛 ON-01 Baseline Completion Debug Script
 * Helps identify why "Complete Your Profile" prompt persists after completion
 */

const fetch = require('node-fetch').default || require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9002';
const TEST_EMAIL = process.argv[2] || 'test@example.com';

console.log('🐛 ON-01 Baseline Completion Debug');
console.log('==================================');
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('');

async function debugBaselineCompletion() {
  try {
    // Step 1: Check if user exists and get current state
    console.log('🔍 Step 1: Checking user current state...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ User not found or login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    const user = loginData.user;
    
    console.log('✅ User found:', {
      email: user.email,
      baseline_completed: user.baseline_completed,
      onboarding_path: user.onboarding_path,
      nickname: user.nickname
    });
    
    // Step 2: Check if user needs baseline completion
    console.log('\n🔍 Step 2: Checking if user needs baseline completion...');
    
    const needsBaseline = user.onboarding_path === 'test' && !user.baseline_completed;
    console.log('📊 Analysis:', {
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed,
      needsBaseline,
      reason: needsBaseline ? 'test path + !baseline_completed' : 'control path or already completed'
    });
    
    // Step 3: If user needs baseline, simulate completion
    if (needsBaseline) {
      console.log('\n🔍 Step 3: Simulating baseline completion...');
      
      const baselineData = {
        nickname: user.nickname || 'TestUser',
        confidence_meds: 7,
        confidence_costs: 5,
        confidence_overall: 6,
        top_concern: 'Testing baseline completion',
        baseline_completed: true
      };
      
      const baselineResponse = await fetch(`${API_BASE_URL}/api/users/baseline`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(baselineData)
      });
      
      if (baselineResponse.ok) {
        console.log('✅ Baseline completion successful');
        
        // Step 4: Verify the update
        console.log('\n🔍 Step 4: Verifying baseline completion...');
        
        const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: TEST_EMAIL })
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const updatedUser = verifyData.user;
          
          console.log('📊 Updated user state:', {
            email: updatedUser.email,
            baseline_completed: updatedUser.baseline_completed,
            onboarding_path: updatedUser.onboarding_path,
            nickname: updatedUser.nickname
          });
          
          const stillNeedsBaseline = updatedUser.onboarding_path === 'test' && !updatedUser.baseline_completed;
          console.log('🔍 Still needs baseline?', stillNeedsBaseline);
          
          if (stillNeedsBaseline) {
            console.log('❌ ISSUE FOUND: User still needs baseline after completion!');
            console.log('🔍 Possible causes:');
            console.log('   - Backend not saving baseline_completed field');
            console.log('   - Frontend not reading updated user state');
            console.log('   - Database field mapping issue');
          } else {
            console.log('✅ SUCCESS: User no longer needs baseline completion');
          }
        }
      } else {
        console.log('❌ Baseline completion failed:', await baselineResponse.text());
      }
    } else {
      console.log('✅ User does not need baseline completion');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugBaselineCompletion(); 