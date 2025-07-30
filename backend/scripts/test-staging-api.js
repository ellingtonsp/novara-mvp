const fetch = require('node-fetch');

// Staging API tests
const STAGING_URL = process.env.STAGING_URL || 'https://novara-staging.up.railway.app';
const TEST_USER = {
  email: 'test@staging.com',
  password: 'testpassword123'
};

async function runStagingTests() {
  console.log('🧪 Running Staging API Tests...\n');
  
  let token;
  const results = [];
  
  // Test 1: Health Check
  try {
    const health = await fetch(`${STAGING_URL}/health`);
    results.push({
      test: 'Health Check',
      status: health.ok ? '✅ PASS' : '❌ FAIL',
      details: `Status: ${health.status}`
    });
  } catch (error) {
    results.push({
      test: 'Health Check',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  // Test 2: Login
  try {
    const login = await fetch(`${STAGING_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const loginData = await login.json();
    token = loginData.token;
    
    results.push({
      test: 'User Login',
      status: login.ok ? '✅ PASS' : '❌ FAIL',
      details: login.ok ? 'Token received' : loginData.error
    });
  } catch (error) {
    results.push({
      test: 'User Login',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  // Test 3: Metrics Endpoint (Key for our changes)
  if (token) {
    try {
      const metrics = await fetch(`${STAGING_URL}/api/users/metrics`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const metricsData = await metrics.json();
      
      results.push({
        test: 'Metrics Endpoint',
        status: metrics.ok ? '✅ PASS' : '❌ FAIL',
        details: metrics.ok ? 
          `totalMedicationCheckIns: ${metricsData.metrics?.totalMedicationCheckIns}` : 
          metricsData.error
      });
    } catch (error) {
      results.push({
        test: 'Metrics Endpoint',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }
  
  // Test 4: Daily Check-in with Medication
  if (token) {
    try {
      const checkin = await fetch(`${STAGING_URL}/api/checkins/daily`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mood_today: 'hopeful',
          confidence_today: 7,
          medication_taken: 'yes',
          date_submitted: new Date().toISOString().split('T')[0]
        })
      });
      const checkinData = await checkin.json();
      
      results.push({
        test: 'Check-in with Medication',
        status: checkin.ok ? '✅ PASS' : '❌ FAIL',
        details: checkin.ok ? 
          'Check-in saved with medication tracking' : 
          checkinData.error
      });
    } catch (error) {
      results.push({
        test: 'Check-in with Medication',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }
  
  // Print Results
  console.log('📊 Test Results:\n');
  results.forEach(result => {
    console.log(`${result.test}: ${result.status}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log('');
  });
  
  const passed = results.filter(r => r.status.includes('PASS')).length;
  const total = results.length;
  
  console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
  
  if (passed < total) {
    console.log('\n⚠️  Some tests failed. Please check staging deployment.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Staging is ready for UAT.');
  }
}

runStagingTests();