const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:9002';
const TEST_EMAIL = 'tester@tesst.testify'; // The Fast Lane user from logs

async function testFastLaneUser() {
  console.log('🧪 ON-01 Fast Lane User Test');
  console.log('==================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log('');

  try {
    // Step 1: Get user data
    console.log('🔍 Step 1: Getting user data...');
    const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });

    if (!userResponse.ok) {
      console.log('❌ Failed to get user data:', userResponse.status);
      return;
    }

    const userData = await userResponse.json();
    console.log('✅ User data retrieved:', {
      email: userData.user.email,
      onboarding_path: userData.user.onboarding_path,
      baseline_completed: userData.user.baseline_completed,
      nickname: userData.user.nickname
    });

    // Step 2: Test needsBaselineCompletion logic
    console.log('');
    console.log('🔍 Step 2: Testing needsBaselineCompletion logic...');
    
    const onboardingPath = userData.user.onboarding_path || 'control';
    const needsBaseline = onboardingPath === 'test' && !userData.user.baseline_completed;
    
    console.log('📊 Analysis:', {
      onboarding_path: userData.user.onboarding_path,
      onboardingPath_used: onboardingPath,
      baseline_completed: userData.user.baseline_completed,
      needsBaseline,
      expected_behavior: needsBaseline ? 'SHOW Complete Profile prompt' : 'HIDE Complete Profile prompt'
    });

    // Step 3: Verify expected behavior
    console.log('');
    console.log('🔍 Step 3: Verifying expected behavior...');
    
    if (onboardingPath === 'test') {
      if (needsBaseline) {
        console.log('✅ EXPECTED: Fast Lane user needs baseline completion');
        console.log('✅ EXPECTED: "Complete Your Profile" prompt should show');
        console.log('✅ EXPECTED: Daily insights should be BLOCKED');
      } else {
        console.log('✅ EXPECTED: Fast Lane user has completed baseline');
        console.log('✅ EXPECTED: Daily insights should be SHOWN');
      }
    } else {
      console.log('✅ EXPECTED: Control path user');
      console.log('✅ EXPECTED: Daily insights should be SHOWN');
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log(`- User onboarding_path: ${userData.user.onboarding_path}`);
    console.log(`- User baseline_completed: ${userData.user.baseline_completed}`);
    console.log(`- Should show "Complete Your Profile": ${needsBaseline ? 'YES' : 'NO'}`);
    console.log(`- Expected behavior: ${needsBaseline ? 'Block insights until baseline complete' : 'Show insights immediately'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFastLaneUser(); 