#!/usr/bin/env node

const https = require('https');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';
const NEW_STAGING_FRONTEND = 'https://novara-5wwgn714s-novara-fertility.vercel.app';

console.log('🔍 Testing New Staging URL Configuration...\n');
console.log(`📱 Backend: ${STAGING_BACKEND}`);
console.log(`🌐 Frontend: ${NEW_STAGING_FRONTEND}\n`);

// Test configuration
const tests = [
  {
    name: 'Health Check',
    url: `${STAGING_BACKEND}/api/health`,
    method: 'GET',
    headers: {},
    expectedStatus: 200
  },
  {
    name: 'CORS Preflight (New Staging URL)',
    url: `${STAGING_BACKEND}/api/checkins`,
    method: 'OPTIONS',
    headers: {
      'Origin': NEW_STAGING_FRONTEND,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    },
    expectedStatus: 204
  },
  {
    name: 'Authentication (New Staging URL)',
    url: `${STAGING_BACKEND}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': NEW_STAGING_FRONTEND
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    }),
    expectedStatus: 200
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: test.method,
      headers: test.headers,
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          test: test
        });
      });
    });

    req.on('error', (error) => {
      reject({ error, test });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ error: new Error('Request timeout'), test });
    });

    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}️⃣ Testing ${test.name}...`);
    
    try {
      const result = await makeRequest(test);
      
      if (result.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        passed++;
      } else {
        console.log(`   ❌ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        failed++;
      }

      // Check CORS headers for CORS test
      if (test.name.includes('CORS')) {
        const allowedOrigin = result.headers['access-control-allow-origin'];
        if (allowedOrigin === NEW_STAGING_FRONTEND) {
          console.log(`   ✅ CORS Origin: ${allowedOrigin}`);
        } else {
          console.log(`   ❌ CORS Origin: ${allowedOrigin} (Expected: ${NEW_STAGING_FRONTEND})`);
          failed++;
        }
      }

      console.log(`   📊 Response received successfully`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error.message}`);
      failed++;
    }
    
    console.log('');
  }

  // Summary
  console.log('📋 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The new staging URL should work correctly.');
    console.log('\n📱 Next Steps:');
    console.log('1. Refresh the staging frontend page');
    console.log('2. Try logging in again');
    console.log('3. Test the daily check-in functionality');
    console.log('4. Check browser console for any remaining errors');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the backend deployment.');
  }

  return { passed, failed };
}

// Run the tests
runTests().catch(console.error); 