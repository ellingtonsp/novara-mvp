const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const FRONTEND_URL = 'https://novara-mvp.vercel.app';
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';
const GA_MEASUREMENT_ID = 'G-QP9XJD6QFS';

console.log('🚀 Starting Comprehensive Production Regression Test\n');

async function testEndpoint(url, name, expectedStatus = 200) {
  try {
    console.log(`Testing ${name}...`);
    const response = await fetch(url);
    const status = response.status;
    const success = status === expectedStatus;
    
    console.log(`  ${success ? '✅' : '❌'} ${name}: ${status}`);
    
    if (success && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log(`  📊 Response:`, JSON.stringify(data, null, 2));
    }
    
    return success;
  } catch (error) {
    console.log(`  ❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function testAnalyticsSetup() {
  console.log('\n📊 Testing Analytics Setup...');
  
  try {
    // Test if GA4 script is loaded
    const frontendResponse = await fetch(FRONTEND_URL);
    const html = await frontendResponse.text();
    
    const hasAnalytics = html.includes('gtag') || html.includes(GA_MEASUREMENT_ID);
    console.log(`  ${hasAnalytics ? '✅' : '❌'} GA4 Script Detection: ${hasAnalytics ? 'Found' : 'Not found'}`);
    
    // Test if Vercel Analytics is present
    const hasVercelAnalytics = html.includes('@vercel/analytics') || html.includes('va.track');
    console.log(`  ${hasVercelAnalytics ? '✅' : '❌'} Vercel Analytics: ${hasVercelAnalytics ? 'Found' : 'Not found'}`);
    
    return hasAnalytics && hasVercelAnalytics;
  } catch (error) {
    console.log(`  ❌ Analytics Test Error: ${error.message}`);
    return false;
  }
}

async function testOnboardingFlow() {
  console.log('\n👤 Testing Onboarding Flow...');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    nickname: 'TestUser',
    confidence_meds: 7,
    confidence_costs: 6,
    confidence_overall: 8,
    timezone: 'America/New_York',
    primary_need: 'emotional_support',
    cycle_stage: 'stimulation',
    top_concern: 'costs'
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
    console.log(`  ${createResponse.ok ? '✅' : '❌'} User Creation: ${createResponse.status}`);
    
    if (!createResponse.ok) {
      console.log(`  📊 Error: ${JSON.stringify(createData, null, 2)}`);
      return false;
    }
    
    const token = createData.token;
    console.log(`  🔑 Token received: ${token ? 'Yes' : 'No'}`);
    
    // Test login with created user
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
    console.log(`  ${loginResponse.ok ? '✅' : '❌'} Login: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.log(`  📊 Error: ${JSON.stringify(loginData, null, 2)}`);
      return false;
    }
    
    // Test daily check-in
    console.log('  Testing daily check-in...');
    const checkinData = {
      moods: ['hopeful', 'anxious'],
      confidence_today: 7,
      primary_concern_today: 'medication_side_effects',
      medication_concern_today: 'side_effects',
      financial_concern_today: null
    };
    
    const checkinResponse = await fetch(`${BACKEND_URL}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify(checkinData)
    });
    
    const checkinResult = await checkinResponse.json();
    console.log(`  ${checkinResponse.ok ? '✅' : '❌'} Daily Check-in: ${checkinResponse.status}`);
    
    if (!checkinResponse.ok) {
      console.log(`  📊 Error: ${JSON.stringify(checkinResult, null, 2)}`);
      return false;
    }
    
    // Test insights generation
    console.log('  Testing insights generation...');
    const insightsResponse = await fetch(`${BACKEND_URL}/api/insights/micro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify({
        onboardingData: {
          email: testUser.email,
          nickname: testUser.nickname
        }
      })
    });
    
    const insightsResult = await insightsResponse.json();
    console.log(`  ${insightsResponse.ok ? '✅' : '❌'} Insights Generation: ${insightsResponse.status}`);
    
    if (!insightsResponse.ok) {
      console.log(`  📊 Error: ${JSON.stringify(insightsResult, null, 2)}`);
      return false;
    }
    
    console.log('  📊 Insight generated:', insightsResult.micro_insight?.title || 'No insight');
    
    return true;
  } catch (error) {
    console.log(`  ❌ Onboarding Flow Error: ${error.message}`);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const headers = response.headers;
    
    const securityChecks = [
      { name: 'Content-Security-Policy', header: 'content-security-policy' },
      { name: 'X-Frame-Options', header: 'x-frame-options' },
      { name: 'X-Content-Type-Options', header: 'x-content-type-options' },
      { name: 'Referrer-Policy', header: 'referrer-policy' }
    ];
    
    let allPassed = true;
    
    for (const check of securityChecks) {
      const hasHeader = headers.get(check.header);
      const passed = !!hasHeader;
      console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'Present' : 'Missing'}`);
      if (!passed) allPassed = false;
    }
    
    return allPassed;
  } catch (error) {
    console.log(`  ❌ Security Headers Error: ${error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...');
  
  try {
    // Test normal rate limit
    const responses = [];
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      responses.push(response.status);
    }
    
    const all200 = responses.every(status => status === 200);
    console.log(`  ${all200 ? '✅' : '❌'} Normal Rate Limit: ${all200 ? 'Passed' : 'Failed'}`);
    console.log(`  📊 Response codes: ${responses.join(', ')}`);
    
    // Test auth rate limit
    const authResponses = [];
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      authResponses.push(response.status);
    }
    
    const hasRateLimit = authResponses.some(status => status === 429);
    console.log(`  ${hasRateLimit ? '✅' : '❌'} Auth Rate Limit: ${hasRateLimit ? 'Working' : 'Not working'}`);
    console.log(`  📊 Auth response codes: ${authResponses.join(', ')}`);
    
    return all200 && hasRateLimit;
  } catch (error) {
    console.log(`  ❌ Rate Limiting Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const results = {
    frontend: await testEndpoint(FRONTEND_URL, 'Frontend (Vercel)'),
    backend: await testEndpoint(`${BACKEND_URL}/api/health`, 'Backend (Railway)'),
    analytics: await testAnalyticsSetup(),
    onboarding: await testOnboardingFlow(),
    security: await testSecurityHeaders(),
    rateLimit: await testRateLimiting()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔧 Recommended Actions:');
    if (!results.frontend) console.log('- Check Vercel deployment status');
    if (!results.backend) console.log('- Check Railway deployment status');
    if (!results.analytics) console.log('- Verify GA4 environment variable is set in Vercel');
    if (!results.onboarding) console.log('- Check Airtable connection and API keys');
    if (!results.security) console.log('- Verify security middleware is deployed');
    if (!results.rateLimit) console.log('- Check rate limiting configuration');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().catch(console.error); 