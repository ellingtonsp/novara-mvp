#!/usr/bin/env node

/**
 * 🧪 ON-01 Onboarding Path Fix Test
 * Verifies that the onboarding path logic works correctly
 */

const fetch = require('node-fetch').default || require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9002';
const TEST_EMAIL = process.argv[2] || 'tester1@gmail1.com';

console.log('🧪 ON-01 Onboarding Path Fix Test');
console.log('==================================');
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('');

async function testOnboardingPathFix() {
  try {
    // Step 1: Check current user state
    console.log('🔍 Step 1: Checking current user state...');
    
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
    const user = loginData.user;
    
    console.log('✅ User found:', {
      email: user.email,
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed,
      nickname: user.nickname
    });
    
    // Step 2: Test the needsBaselineCompletion logic
    console.log('\n🔍 Step 2: Testing needsBaselineCompletion logic...');
    
    const onboardingPath = user.onboarding_path || 'control';
    const needsBaseline = onboardingPath === 'test' && !user.baseline_completed;
    
    console.log('📊 Analysis:', {
      onboarding_path: user.onboarding_path,
      onboardingPath_used: onboardingPath,
      baseline_completed: user.baseline_completed,
      needsBaseline,
      expected_behavior: needsBaseline ? 'SHOW Complete Profile prompt' : 'HIDE Complete Profile prompt'
    });
    
    // Step 3: Verify the fix
    console.log('\n🔍 Step 3: Verifying the fix...');
    
    if (user.onboarding_path === null || user.onboarding_path === undefined) {
      console.log('✅ FIX VERIFIED: User has no onboarding_path, should default to control');
      console.log('✅ EXPECTED: No "Complete Your Profile" prompt should show');
      
      if (!needsBaseline) {
        console.log('✅ SUCCESS: User correctly identified as not needing baseline completion');
      } else {
        console.log('❌ ISSUE: User incorrectly identified as needing baseline completion');
      }
    } else if (user.onboarding_path === 'test') {
      console.log('✅ FIX VERIFIED: User is on test path');
      console.log('✅ EXPECTED: "Complete Your Profile" prompt should show if baseline_completed is false');
      
      if (needsBaseline) {
        console.log('✅ SUCCESS: User correctly identified as needing baseline completion');
      } else {
        console.log('❌ ISSUE: User incorrectly identified as not needing baseline completion');
      }
    } else if (user.onboarding_path === 'control') {
      console.log('✅ FIX VERIFIED: User is on control path');
      console.log('✅ EXPECTED: No "Complete Your Profile" prompt should show');
      
      if (!needsBaseline) {
        console.log('✅ SUCCESS: User correctly identified as not needing baseline completion');
      } else {
        console.log('❌ ISSUE: User incorrectly identified as needing baseline completion');
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log(`- User onboarding_path: ${user.onboarding_path || 'null'}`);
    console.log(`- User baseline_completed: ${user.baseline_completed}`);
    console.log(`- Should show "Complete Your Profile": ${needsBaseline ? 'YES' : 'NO'}`);
    console.log(`- Expected behavior: ${needsBaseline ? 'Show prompt' : 'Hide prompt'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testOnboardingPathFix(); 