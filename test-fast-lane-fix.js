const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:9002';

async function testFastLaneFix() {
  console.log('🧪 ON-01 Fast Lane Fix Test');
  console.log('==================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log('');

  try {
    // Step 1: Create a Fast Lane user
    console.log('🔍 Step 1: Creating Fast Lane user...');
    const fastLaneUserData = {
      email: 'fastlane@test.com',
      nickname: 'fastlane',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      primary_need: 'financial_planning',
      cycle_stage: 'transfer',
      top_concern: '',
      onboarding_path: 'test',
      baseline_completed: false
    };

    const createResponse = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fastLaneUserData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.log('❌ Failed to create user:', errorData);
      return;
    }

    const createData = await createResponse.json();
    console.log('✅ Fast Lane user created successfully');
    console.log('📊 User data from API response:', {
      email: createData.user.email,
      onboarding_path: createData.user.onboarding_path,
      baseline_completed: createData.user.baseline_completed,
      nickname: createData.user.nickname
    });

    // Step 2: Check database directly
    console.log('');
    console.log('🔍 Step 2: Checking database directly...');
    const { execSync } = require('child_process');
    const dbResult = execSync(`sqlite3 backend/data/novara-local.db "SELECT email, onboarding_path, baseline_completed, nickname FROM Users WHERE email = 'fastlane@test.com';"`, { encoding: 'utf8' });
    console.log('📊 Database record:', dbResult.trim());

    // Step 3: Test needsBaselineCompletion logic
    console.log('');
    console.log('🔍 Step 3: Testing needsBaselineCompletion logic...');
    
    const onboardingPath = createData.user.onboarding_path || 'control';
    const needsBaseline = onboardingPath === 'test' && !createData.user.baseline_completed;
    
    console.log('📊 Analysis:', {
      onboarding_path: createData.user.onboarding_path,
      onboardingPath_used: onboardingPath,
      baseline_completed: createData.user.baseline_completed,
      needsBaseline,
      expected_behavior: needsBaseline ? 'SHOW Complete Profile prompt' : 'HIDE Complete Profile prompt'
    });

    // Step 4: Verify expected behavior
    console.log('');
    console.log('🔍 Step 4: Verifying expected behavior...');
    
    if (onboardingPath === 'test') {
      if (needsBaseline) {
        console.log('✅ EXPECTED: Fast Lane user needs baseline completion');
        console.log('✅ EXPECTED: "Complete Your Profile" prompt should show');
        console.log('✅ EXPECTED: Daily insights should be BLOCKED');
      } else {
        console.log('❌ UNEXPECTED: Fast Lane user should need baseline completion');
      }
    } else {
      console.log('❌ UNEXPECTED: User should be on test path');
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log(`- User onboarding_path: ${createData.user.onboarding_path}`);
    console.log(`- User baseline_completed: ${createData.user.baseline_completed}`);
    console.log(`- Should show "Complete Your Profile": ${needsBaseline ? 'YES' : 'NO'}`);
    console.log(`- Expected behavior: ${needsBaseline ? 'Block insights until baseline complete' : 'Show insights immediately'}`);

    // Cleanup
    console.log('');
    console.log('🧹 Cleaning up test user...');
    execSync(`sqlite3 backend/data/novara-local.db "DELETE FROM Users WHERE email = 'fastlane@test.com';"`);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFastLaneFix(); 