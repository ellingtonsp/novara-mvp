const fetch = require('node-fetch');

async function testPersonalization() {
  console.log('🔍 PERSONALIZATION DEBUG TEST\n');
  
  // Test with your actual onboarding data
  const testData = {
    onboardingData: {
      email: 'test-personalization@example.com',
      nickname: 'Stephen',
      confidence_meds: 8,
      confidence_costs: 2,  // Low financial confidence
      confidence_overall: 4,
      primary_need: 'financial_planning',
      top_concern: 'Money stress',  // Specific concern
      cycle_stage: 'ivf_prep'
    }
  };
  
  console.log('📊 Testing with profile:', JSON.stringify(testData.onboardingData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/insights/micro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('\n🎯 PERSONALIZATION RESULT:');
    console.log('Success:', result.success);
    console.log('Title:', result.micro_insight?.title);
    console.log('Message:', result.micro_insight?.message);
    
    // Check if it's personalized or generic
    const message = result.micro_insight?.message || '';
    const title = result.micro_insight?.title || '';
    
    console.log('\n📋 PERSONALIZATION ANALYSIS:');
    console.log('- Uses name "Stephen":', message.includes('Stephen') ? '✅ YES' : '❌ NO');
    console.log('- Mentions financial concerns:', (message.includes('financial') || message.includes('money') || message.includes('cost')) ? '✅ YES' : '❌ NO');
    console.log('- References specific data:', (message.includes('2/10') || message.includes('confidence') || message.includes('stress')) ? '✅ YES' : '❌ NO');
    console.log('- Generic "Your journey" message:', title.includes('Your journey') ? '❌ GENERIC' : '✅ PERSONALIZED');
    
    if (title.includes('Your journey')) {
      console.log('\n⚠️  ISSUE IDENTIFIED: System is falling back to generic content!');
      console.log('   This means personalization is failing due to database/Airtable issues.');
    } else {
      console.log('\n✅ PERSONALIZATION WORKING: Content is customized to user profile!');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPersonalization(); 