// Simple Production Test for Novara MVP
const FRONTEND_URL = 'https://novara-mvp.vercel.app';
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';

console.log('🚀 Starting Simple Production Test\n');

async function testBasicEndpoints() {
  console.log('Testing Basic Endpoints...');
  
  try {
    // Test frontend
    console.log('Testing frontend...');
    const frontendResponse = await fetch(FRONTEND_URL);
    console.log(`  Frontend: ${frontendResponse.status} ${frontendResponse.statusText}`);
    
    // Test backend health
    console.log('Testing backend health...');
    const backendResponse = await fetch(`${BACKEND_URL}/api/health`);
    const backendData = await backendResponse.json();
    console.log(`  Backend: ${backendResponse.status} ${backendResponse.statusText}`);
    console.log(`  Backend Data:`, backendData);
    
    return frontendResponse.ok && backendResponse.ok;
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testOnboardingFlow() {
  console.log('\nTesting Onboarding Flow...');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    nickname: 'TestUser',
    confidence_meds: 7,
    confidence_costs: 6,
    confidence_overall: 8,
    timezone: 'America/New_York'
  };
  
  try {
    // Test user creation
    console.log('  Creating test user...');
    const createResponse = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    console.log(`  User Creation: ${createResponse.status} ${createResponse.statusText}`);
    
    if (!createResponse.ok) {
      console.log(`  Error: ${JSON.stringify(createData, null, 2)}`);
      return false;
    }
    
    console.log(`  ✅ User created successfully`);
    console.log(`  Token: ${createData.token ? 'Received' : 'Missing'}`);
    
    // Test login
    console.log('  Testing login...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify({ email: testUser.email })
    });
    
    const loginData = await loginResponse.json();
    console.log(`  Login: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (!loginResponse.ok) {
      console.log(`  Error: ${JSON.stringify(loginData, null, 2)}`);
      return false;
    }
    
    console.log(`  ✅ Login successful`);
    
    return true;
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testAnalyticsSetup() {
  console.log('\nTesting Analytics Setup...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    // Check for GA4
    const hasGA4 = html.includes('G-QP9XJD6QFS') || html.includes('gtag');
    console.log(`  GA4 Detection: ${hasGA4 ? '✅ Found' : '❌ Not found'}`);
    
    // Check for Vercel Analytics
    const hasVercelAnalytics = html.includes('@vercel/analytics') || html.includes('va.track');
    console.log(`  Vercel Analytics: ${hasVercelAnalytics ? '✅ Found' : '❌ Not found'}`);
    
    return hasGA4 || hasVercelAnalytics;
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Running all tests...\n');
  
  const results = {
    basic: await testBasicEndpoints(),
    onboarding: await testOnboardingFlow(),
    analytics: await testAnalyticsSetup()
  };
  
  console.log('\n📋 Test Results:');
  console.log('================');
  console.log(`Basic Endpoints: ${results.basic ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Onboarding Flow: ${results.onboarding ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Analytics Setup: ${results.analytics ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\nOverall: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔧 Next Steps:');
    if (!results.basic) console.log('- Check deployment status on Vercel and Railway');
    if (!results.onboarding) console.log('- Verify Airtable connection and environment variables');
    if (!results.analytics) console.log('- Add VITE_GA_MEASUREMENT_ID to Vercel environment variables');
  }
}

runTests().catch(console.error); 