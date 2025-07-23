// Comprehensive Production Fix and Test Script
const FRONTEND_URL = 'https://novara-mvp.vercel.app';
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';
const GA_MEASUREMENT_ID = 'G-QP9XJD6QFS';

console.log('🔧 Novara MVP - Production Fix & Test Suite\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test Results Tracker
const results = {
  tests: [],
  passed: 0,
  failed: 0,
  fixes: []
};

function recordTest(name, success, details, fix = null) {
  results.tests.push({ name, success, details, fix });
  if (success) {
    results.passed++;
    log(`✅ ${name}: ${details}`, 'green');
  } else {
    results.failed++;
    log(`❌ ${name}: ${details}`, 'red');
    if (fix) {
      results.fixes.push(fix);
      log(`   🔧 Fix: ${fix}`, 'yellow');
    }
  }
}

// Test Infrastructure
async function testInfrastructure() {
  log('\n🏗️ Testing Infrastructure...', 'blue');
  
  try {
    // Frontend Test
    const frontendResponse = await fetch(FRONTEND_URL);
    recordTest(
      'Frontend Deployment', 
      frontendResponse.ok, 
      `Status: ${frontendResponse.status}`,
      !frontendResponse.ok ? 'Check Vercel deployment status' : null
    );
    
    // Backend Test
    const backendResponse = await fetch(`${BACKEND_URL}/api/health`);
    const backendData = await backendResponse.json();
    recordTest(
      'Backend Deployment', 
      backendResponse.ok, 
      `Status: ${backendResponse.status}`,
      !backendResponse.ok ? 'Check Railway deployment status' : null
    );
    
    // Environment Variables Test
    if (backendResponse.ok) {
      recordTest(
        'JWT Configuration', 
        backendData.jwt === 'configured', 
        `JWT: ${backendData.jwt}`,
        backendData.jwt !== 'configured' ? 'Set JWT_SECRET in Railway environment' : null
      );
      
      recordTest(
        'Airtable Basic Config', 
        backendData.airtable === 'connected', 
        `Airtable: ${backendData.airtable}`,
        backendData.airtable !== 'connected' ? 'Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in Railway' : null
      );
    }
    
  } catch (error) {
    recordTest('Infrastructure', false, `Network error: ${error.message}`, 'Check internet connection and service URLs');
  }
}

// Test Airtable Integration
async function testAirtableIntegration() {
  log('\n📊 Testing Airtable Integration...', 'blue');
  
  const testUser = {
    email: `test-${Date.now()}@fixtest.com`,
    nickname: 'FixTest',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    timezone: 'America/New_York'
  };
  
  try {
    // Test user creation (this will fail if Airtable API key is invalid)
    const createResponse = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      recordTest('Airtable Write Access', true, 'User creation successful');
      
      // Test login
      const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_URL
        },
        body: JSON.stringify({ email: testUser.email })
      });
      
      const loginData = await loginResponse.json();
      recordTest(
        'User Authentication', 
        loginResponse.ok, 
        loginResponse.ok ? 'Login successful' : `Error: ${loginData.error}`,
        !loginResponse.ok ? 'Check user lookup functionality' : null
      );
      
      // Test check-in if login successful
      if (loginResponse.ok && loginData.token) {
        const checkinResponse = await fetch(`${BACKEND_URL}/api/checkins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`,
            'Origin': FRONTEND_URL
          },
          body: JSON.stringify({
            mood_today: 'hopeful',
            confidence_today: 7,
            primary_concern_today: 'test'
          })
        });
        
        const checkinData = await checkinResponse.json();
        recordTest(
          'Daily Check-in', 
          checkinResponse.ok, 
          checkinResponse.ok ? 'Check-in saved' : `Error: ${checkinData.error}`,
          !checkinResponse.ok ? 'Check DailyCheckins table structure' : null
        );
      }
      
    } else {
      // Parse Airtable error
      const errorMessage = createData.error || 'Unknown error';
      let fix = 'Check Airtable API configuration';
      
      if (errorMessage.includes('UNAUTHORIZED') || errorMessage.includes('Invalid authentication token')) {
        fix = 'Generate new Airtable API key and update Railway environment variables';
      } else if (errorMessage.includes('NOT_FOUND')) {
        fix = 'Verify Airtable base ID and table names (Users, DailyCheckins)';
      } else if (errorMessage.includes('INVALID_REQUEST')) {
        fix = 'Check Airtable table field names and data types';
      }
      
      recordTest('Airtable Write Access', false, errorMessage, fix);
    }
    
  } catch (error) {
    recordTest('Airtable Integration', false, `Network error: ${error.message}`, 'Check backend API endpoints');
  }
}

// Test Analytics Setup
async function testAnalyticsSetup() {
  log('\n📈 Testing Analytics Setup...', 'blue');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    // Check for GA4
    const hasGA4 = html.includes(GA_MEASUREMENT_ID) || html.includes('gtag');
    recordTest(
      'Google Analytics GA4', 
      hasGA4, 
      hasGA4 ? 'GA4 script detected' : 'GA4 script not found',
      !hasGA4 ? 'Add VITE_GA_MEASUREMENT_ID=G-QP9XJD6QFS to Vercel environment variables' : null
    );
    
    // Check for Vercel Analytics
    const hasVercelAnalytics = html.includes('@vercel/analytics') || html.includes('va.track') || html.includes('vercel');
    recordTest(
      'Vercel Analytics', 
      hasVercelAnalytics, 
      hasVercelAnalytics ? 'Vercel Analytics detected' : 'Vercel Analytics not found',
      !hasVercelAnalytics ? 'Ensure @vercel/analytics package is deployed' : null
    );
    
    // Check for Error Boundary
    const hasErrorBoundary = html.includes('ErrorBoundary') || html.includes('error-boundary');
    recordTest(
      'Error Boundary', 
      hasErrorBoundary, 
      hasErrorBoundary ? 'Error handling detected' : 'Error boundary not found',
      !hasErrorBoundary ? 'Verify ErrorBoundary component is deployed' : null
    );
    
  } catch (error) {
    recordTest('Analytics Setup', false, `Error: ${error.message}`, 'Check frontend deployment');
  }
}

// Test Security Features
async function testSecurityFeatures() {
  log('\n🔒 Testing Security Features...', 'blue');
  
  try {
    // Test rate limiting on auth endpoint
    const authRequests = [];
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      authRequests.push(response.status);
    }
    
    const hasRateLimit = authRequests.some(status => status === 429);
    recordTest(
      'Rate Limiting', 
      hasRateLimit, 
      hasRateLimit ? 'Rate limiting active' : 'Rate limiting not detected',
      !hasRateLimit ? 'Verify express-rate-limit middleware is deployed' : null
    );
    
    // Test CORS headers
    const corsResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS'
    });
    
    const hasCors = corsResponse.headers.get('access-control-allow-origin') !== null;
    recordTest(
      'CORS Configuration', 
      hasCors, 
      hasCors ? 'CORS headers present' : 'CORS headers missing',
      !hasCors ? 'Check CORS middleware configuration' : null
    );
    
  } catch (error) {
    recordTest('Security Features', false, `Error: ${error.message}`, 'Check security middleware deployment');
  }
}

// Generate Fix Instructions
function generateFixInstructions() {
  if (results.fixes.length === 0) {
    log('\n🎉 All tests passed! No fixes needed.', 'green');
    return;
  }
  
  log('\n🔧 Fix Instructions:', 'yellow');
  log('==================', 'yellow');
  
  results.fixes.forEach((fix, index) => {
    log(`${index + 1}. ${fix}`, 'yellow');
  });
  
  log('\n📋 Specific Actions:', 'cyan');
  log('===================', 'cyan');
  
  // Check for specific issues and provide detailed instructions
  if (results.fixes.some(fix => fix.includes('Airtable API key'))) {
    log('🔑 Airtable API Key Issue:', 'cyan');
    log('   1. Go to https://airtable.com/account', 'cyan');
    log('   2. Generate a new Personal Access Token', 'cyan');
    log('   3. Go to Railway dashboard → Novara Backend → Variables', 'cyan');
    log('   4. Update AIRTABLE_API_KEY with the new token', 'cyan');
    log('   5. The service will auto-redeploy', 'cyan');
  }
  
  if (results.fixes.some(fix => fix.includes('VITE_GA_MEASUREMENT_ID'))) {
    log('\n📊 Google Analytics Setup:', 'cyan');
    log('   1. Go to Vercel dashboard → Novara MVP → Settings', 'cyan');
    log('   2. Navigate to Environment Variables', 'cyan');
    log('   3. Add: VITE_GA_MEASUREMENT_ID = G-QP9XJD6QFS', 'cyan');
    log('   4. Redeploy the project', 'cyan');
  }
  
  if (results.fixes.some(fix => fix.includes('Railway environment'))) {
    log('\n🚂 Railway Environment Variables:', 'cyan');
    log('   1. Go to Railway dashboard → Novara Backend', 'cyan');
    log('   2. Navigate to Variables tab', 'cyan');
    log('   3. Ensure these are set:', 'cyan');
    log('      - AIRTABLE_API_KEY=your_new_token', 'cyan');
    log('      - AIRTABLE_BASE_ID=your_base_id', 'cyan');
    log('      - JWT_SECRET=your_secret_key', 'cyan');
    log('      - NODE_ENV=production', 'cyan');
  }
}

// Generate Report
function generateReport() {
  log('\n📊 Test Results Summary:', 'blue');
  log('========================', 'blue');
  log(`Total Tests: ${results.passed + results.failed}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  generateFixInstructions();
  
  return results.failed === 0;
}

// Main execution
async function runFullTest() {
  const startTime = Date.now();
  
  await testInfrastructure();
  await testAirtableIntegration();
  await testAnalyticsSetup();
  await testSecurityFeatures();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\nTest Duration: ${duration} seconds`, 'blue');
  
  const allPassed = generateReport();
  
  if (allPassed) {
    log('\n🚀 Production system is fully operational!', 'green');
  } else {
    log('\n⚠️  Production system has issues that need attention.', 'yellow');
  }
  
  return allPassed;
}

runFullTest().catch(console.error); 