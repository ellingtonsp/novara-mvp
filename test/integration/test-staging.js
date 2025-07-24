// Staging Environment Test Script
// Run this after setting up your staging environment

const STAGING_FRONTEND_URL = 'https://YOUR_STAGING_FRONTEND_URL_HERE.vercel.app';
const STAGING_BACKEND_URL = 'https://YOUR_STAGING_BACKEND_URL_HERE.up.railway.app';

async function testStagingEnvironment() {
  console.log('🧪 Testing Staging Environment...\n');

  // Test 1: Backend Health Check
  console.log('1. Testing staging backend health...');
  try {
    const response = await fetch(`${STAGING_BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Staging backend health check passed');
      console.log(`   Environment: ${data.environment || 'unknown'}`);
      console.log(`   Airtable: ${data.airtable || 'unknown'}`);
      console.log(`   JWT: ${data.jwt || 'unknown'}`);
    } else {
      console.log('❌ Staging backend health check failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ Staging backend unreachable');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Frontend Accessibility
  console.log('2. Testing staging frontend accessibility...');
  try {
    const response = await fetch(STAGING_FRONTEND_URL);
    
    if (response.ok) {
      console.log('✅ Staging frontend accessible');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log('❌ Staging frontend not accessible');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Staging frontend unreachable');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 3: CORS Configuration
  console.log('3. Testing CORS configuration...');
  try {
    const response = await fetch(`${STAGING_BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': STAGING_FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    if (response.ok) {
      console.log('✅ CORS preflight passed');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log('❌ CORS preflight failed');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ CORS test failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 4: Safe Test User Creation
  console.log('4. Testing safe user creation in staging...');
  const testUserEmail = `staging-test-${Date.now()}@example.com`;
  
  try {
    const response = await fetch(`${STAGING_BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUserEmail,
        nickname: 'Staging Test User',
        confidence_meds: 5,
        confidence_costs: 5,
        confidence_overall: 5,
        email_opt_in: true
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Test user creation successful in staging');
      console.log(`   Email: ${testUserEmail}`);
      console.log(`   User ID: ${data.user?.id || 'unknown'}`);
      console.log('   🎉 Safe to test features without affecting production!');
    } else {
      console.log('❌ Test user creation failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Test user creation failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n🏁 Staging environment test complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Update the URLs in this script with your actual staging URLs');
  console.log('   2. Use staging for all feature development and testing');
  console.log('   3. Only deploy to production after staging validation');
  console.log('\n🚀 Happy feature development!');
}

// Run the test
testStagingEnvironment().catch(console.error); 