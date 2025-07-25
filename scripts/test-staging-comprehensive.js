#!/usr/bin/env node

const https = require('https');
const http = require('http');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';
const STAGING_FRONTEND = 'https://novara-bd6xsx1ru-novara-fertility.vercel.app';

console.log('🔍 Comprehensive Staging Backend Test for Mobile Issues...\n');
console.log(`📱 Testing Backend: ${STAGING_BACKEND}`);
console.log(`🌐 Testing Frontend: ${STAGING_FRONTEND}\n`);

// Test configuration
const tests = [
  {
    name: 'Health Check',
    url: `${STAGING_BACKEND}/api/health`,
    method: 'GET',
    headers: {},
    expectedStatus: 200,
    description: 'Basic health check endpoint'
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
    expectedStatus: 204, // CORS preflight should return 204
    description: 'CORS preflight request for mobile browsers'
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
    expectedStatus: 400, // Expected for invalid credentials
    description: 'Authentication endpoint with mobile user agent'
  },
  {
    name: 'Check-ins Endpoint (Unauthenticated)',
    url: `${STAGING_BACKEND}/api/checkins`,
    method: 'GET',
    headers: {
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    expectedStatus: 401, // Expected without auth
    description: 'Check-ins endpoint without authentication'
  },
  {
    name: 'Daily Check-in Endpoint (Correct Path)',
    url: `${STAGING_BACKEND}/api/checkins`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({
      mood_today: 'hopeful, excited',
      confidence_today: 7,
      primary_concern_today: 'Mobile test'
    }),
    expectedStatus: 401, // Expected without auth
    description: 'Daily check-in submission (correct endpoint)'
  },
  {
    name: 'Daily Check-in Endpoint (Wrong Path)',
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
    expectedStatus: 404, // Expected - endpoint doesn't exist
    description: 'Daily check-in submission (incorrect endpoint)'
  },
  {
    name: 'Enhanced Daily Check-in Endpoint',
    url: `${STAGING_BACKEND}/api/daily-checkin-enhanced`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({
      mood_today: 'hopeful, excited',
      confidence_today: 7,
      primary_concern_today: 'Mobile test'
    }),
    expectedStatus: 200, // This endpoint has auth bypass for testing
    description: 'Enhanced daily check-in endpoint (with auth bypass)'
  },
  {
    name: 'User Creation Endpoint',
    url: `${STAGING_BACKEND}/api/users`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({
      email: 'mobile-test@example.com',
      nickname: 'Mobile Test User'
    }),
    expectedStatus: 201, // Expected for successful user creation
    description: 'User creation endpoint'
  },
  {
    name: 'Insights Endpoint (Unauthenticated)',
    url: `${STAGING_BACKEND}/api/insights/daily`,
    method: 'GET',
    headers: {
      'Origin': STAGING_FRONTEND,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    expectedStatus: 401, // Expected without auth
    description: 'Daily insights endpoint without authentication'
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
      timeout: 15000
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
  let criticalIssues = [];

  console.log('🚀 Starting comprehensive tests...\n');

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}️⃣ Testing ${test.name}...`);
    console.log(`   📝 ${test.description}`);
    
    try {
      const result = await makeRequest(test);
      
      // Check status code
      if (result.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        passed++;
      } else {
        console.log(`   ❌ Status: ${result.status} (Expected: ${test.expectedStatus})`);
        failed++;
        
        const issue = {
          test: test.name,
          issue: `Unexpected status code: ${result.status} vs ${test.expectedStatus}`,
          details: result.data,
          severity: 'high'
        };
        
        issues.push(issue);
        
        // Mark as critical if it's a CORS or authentication issue
        if (test.name.includes('CORS') || test.name.includes('Authentication')) {
          criticalIssues.push(issue);
        }
      }

      // Check CORS headers for relevant tests
      if (test.name.includes('CORS') || test.method === 'OPTIONS') {
        const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
        const missingHeaders = corsHeaders.filter(header => !result.headers[header]);
        
        if (missingHeaders.length > 0) {
          console.log(`   ⚠️  Missing CORS headers: ${missingHeaders.join(', ')}`);
          const corsIssue = {
            test: test.name,
            issue: `Missing CORS headers: ${missingHeaders.join(', ')}`,
            details: `Found headers: ${Object.keys(result.headers).filter(h => h.startsWith('access-control')).join(', ')}`,
            severity: 'critical'
          };
          issues.push(corsIssue);
          criticalIssues.push(corsIssue);
        } else {
          console.log(`   ✅ CORS headers present`);
        }
        
        // Check if the correct origin is allowed
        const allowedOrigin = result.headers['access-control-allow-origin'];
        if (allowedOrigin && allowedOrigin !== '*' && !allowedOrigin.includes(STAGING_FRONTEND)) {
          console.log(`   ⚠️  CORS origin mismatch: ${allowedOrigin} (expected: ${STAGING_FRONTEND})`);
          const originIssue = {
            test: test.name,
            issue: `CORS origin mismatch: ${allowedOrigin} (expected: ${STAGING_FRONTEND})`,
            details: 'Frontend may not be able to connect to backend',
            severity: 'critical'
          };
          issues.push(originIssue);
          criticalIssues.push(originIssue);
        }
      }

      // Check response time
      console.log(`   📊 Response received successfully`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error.message}`);
      failed++;
      const errorIssue = {
        test: test.name,
        issue: `Request failed: ${error.error.message}`,
        details: error.error,
        severity: 'critical'
      };
      issues.push(errorIssue);
      criticalIssues.push(errorIssue);
    }
    
    console.log('');
  }

  // Summary
  console.log('📋 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}: ${issue.issue}`);
      if (issue.details) {
        console.log(`   Details: ${typeof issue.details === 'string' ? issue.details : JSON.stringify(issue.details, null, 2)}`);
      }
    });
  }

  if (issues.length > 0) {
    console.log('\n⚠️ All Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}: ${issue.issue}`);
      if (issue.details && typeof issue.details === 'string' && issue.details.length < 200) {
        console.log(`   Details: ${issue.details}`);
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

  // Action items
  if (criticalIssues.length > 0) {
    console.log('\n🔧 Required Actions:');
    console.log('1. Fix CORS configuration to include staging frontend URL');
    console.log('2. Verify all API endpoints are correctly implemented');
    console.log('3. Test authentication flow on mobile devices');
    console.log('4. Ensure proper error handling for mobile requests');
  }

  return { passed, failed, issues, criticalIssues };
}

// Run the tests
runTests().catch(console.error); 