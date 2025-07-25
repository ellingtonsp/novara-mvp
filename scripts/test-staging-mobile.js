#!/usr/bin/env node

const https = require('https');
const http = require('http');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';
const STAGING_FRONTEND = 'https://novara-bd6xsx1ru-novara-fertility.vercel.app';

console.log('🔍 Testing Staging Backend for Mobile Issues...\n');

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
    name: 'CORS Preflight (Mobile Browser)',
    url: `${STAGING_BACKEND}/api/checkins`,
    method: 'OPTIONS',
    headers: {
      'Origin': STAGING_FRONTEND,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    expectedStatus: 200
  },
  {
    name: 'Authentication Endpoint (Mobile)',
    url: `${STAGING_BACKEND}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    }),
    expectedStatus: 400 // Expected for invalid credentials
  },
  {
    name: 'Check-ins Endpoint (Unauthenticated)',
    url: `${STAGING_BACKEND}/api/checkins`,
    method: 'GET',
    headers: {
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    expectedStatus: 401 // Expected without auth
  },
  {
    name: 'Daily Check-in Endpoint (Unauthenticated)',
    url: `${STAGING_BACKEND}/api/daily-checkin`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({
      mood: 5,
      energy: 5,
      stress: 5,
      sleep: 5,
      notes: 'Mobile test'
    }),
    expectedStatus: 401 // Expected without auth
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: test.headers,
      timeout: 10000
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
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
  let issues = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}️⃣ Testing ${test.name}...`);
    
    try {
      const result = await makeRequest(test);
      
      // Check status code
      if (result.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        passed++;
      } else {
        console.log(`   ❌ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        failed++;
        issues.push({
          test: test.name,
          issue: `Unexpected status code: ${result.status} vs ${test.expectedStatus}`,
          details: result.data
        });
      }

      // Check CORS headers for relevant tests
      if (test.name.includes('CORS') || test.method === 'OPTIONS') {
        const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
        const missingHeaders = corsHeaders.filter(header => !result.headers[header]);
        
        if (missingHeaders.length > 0) {
          console.log(`   ⚠️  Missing CORS headers: ${missingHeaders.join(', ')}`);
          issues.push({
            test: test.name,
            issue: `Missing CORS headers: ${missingHeaders.join(', ')}`,
            details: `Found headers: ${Object.keys(result.headers).filter(h => h.startsWith('access-control')).join(', ')}`
          });
        } else {
          console.log(`   ✅ CORS headers present`);
        }
      }

      // Check response time
      console.log(`   📊 Response received successfully`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error.message}`);
      failed++;
      issues.push({
        test: test.name,
        issue: `Request failed: ${error.error.message}`,
        details: error.error
      });
    }
    
    console.log('');
  }

  // Summary
  console.log('📋 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}: ${issue.issue}`);
      if (issue.details) {
        console.log(`   Details: ${typeof issue.details === 'string' ? issue.details : JSON.stringify(issue.details, null, 2)}`);
      }
    });
  } else {
    console.log('\n🎉 All tests passed! Staging backend appears to be functioning correctly.');
  }

  // Mobile-specific recommendations
  console.log('\n📱 Mobile-Specific Recommendations:');
  console.log('1. Test on actual mobile devices to verify touch interactions');
  console.log('2. Check mobile browser console for JavaScript errors');
  console.log('3. Verify PWA functionality on mobile devices');
  console.log('4. Test offline functionality');
  console.log('5. Check mobile-specific CSS and responsive design');

  return { passed, failed, issues };
}

// Run the tests
runTests().catch(console.error); 