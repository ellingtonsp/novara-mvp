const fetch = require('node-fetch');

async function debugMicroInsight() {
  console.log('🔍 DETAILED MICRO-INSIGHT DEBUG\n');
  
  // First, let's create a user to ensure they exist
  console.log('1️⃣ Creating test user...');
  const userData = {
    email: 'debug-user@example.com',
    nickname: 'DebugUser',
    confidence_meds: 8,
    confidence_costs: 3,
    confidence_overall: 5,
    primary_need: 'financial_planning',
    top_concern: 'Money stress',
    cycle_stage: 'ivf_prep'
  };
  
  try {
    const userResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const userResult = await userResponse.json();
    console.log('✅ User creation response:', userResult.success ? 'SUCCESS' : 'FAILED');
    console.log('   User ID:', userResult.success ? 'Created' : 'Error');
    
    // Now test micro-insight with this user's email
    console.log('\n2️⃣ Testing micro-insight with created user...');
    const insightResponse = await fetch('http://localhost:3000/api/insights/micro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboardingData: userData
      })
    });
    
    console.log('📊 Response status:', insightResponse.status);
    console.log('📊 Response headers:', Object.fromEntries(insightResponse.headers));
    
    const insightResult = await insightResponse.json();
    console.log('\n🎯 MICRO-INSIGHT RESULT:');
    console.log('   Success:', insightResult.success);
    console.log('   Error:', insightResult.error || 'None');
    console.log('   Title:', insightResult.micro_insight?.title || 'UNDEFINED');
    console.log('   Message:', insightResult.micro_insight?.message || 'UNDEFINED');
    console.log('   User ID:', insightResult.user_id || 'UNDEFINED');
    
    // Test with no email (should fail gracefully)
    console.log('\n3️⃣ Testing with invalid data (no email)...');
    const invalidResponse = await fetch('http://localhost:3000/api/insights/micro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboardingData: {
          nickname: 'TestUser',
          confidence_meds: 5
          // No email - should trigger the error
        }
      })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('❌ Invalid test result:', invalidResult);
    
  } catch (error) {
    console.log('💥 Error during debug:', error.message);
  }
}

debugMicroInsight(); 