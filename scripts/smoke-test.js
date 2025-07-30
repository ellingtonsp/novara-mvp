#!/usr/bin/env node

/**
 * Quick Smoke Test
 * 
 * Runs only the most critical tests to verify basic functionality
 * Should complete in < 30 seconds
 * 
 * Usage:
 *   npm run test:smoke
 *   npm run test:smoke -- --env=production
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Parse environment
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'staging';

const ENVIRONMENTS = {
  local: {
    apiUrl: 'http://localhost:9002',
    frontendUrl: 'http://localhost:4200'
  },
  staging: {
    apiUrl: 'https://novara-staging-staging.up.railway.app',
    frontendUrl: 'https://novara-mvp-git-staging-novara-fertility.vercel.app'
  },
  production: {
    apiUrl: 'https://novara-mvp-production.up.railway.app',
    frontendUrl: 'https://app.novara.team'
  }
};

const config = ENVIRONMENTS[environment];
if (!config) {
  console.error(`❌ Invalid environment: ${environment}`);
  process.exit(1);
}

console.log(`\n🔥 Running smoke tests on ${environment}`);
console.log(`API: ${config.apiUrl}`);
console.log(`Frontend: ${config.frontendUrl}\n`);

// Helper for requests
function quickRequest(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function runSmokeTests() {
  const tests = [
    {
      name: 'API Health Check',
      url: `${config.apiUrl}/api/health`,
      validate: (result) => result.success && result.body.includes('"status":"ok"')
    },
    {
      name: 'Frontend Availability',
      url: config.frontendUrl,
      validate: (result) => result.success
    },
    {
      name: 'API Root',
      url: config.apiUrl,
      validate: (result) => result.success && result.body.includes('Novara API')
    },
    {
      name: 'Check-ins Endpoint',
      url: `${config.apiUrl}/api/checkins`,
      validate: (result) => {
        // Should return 401 without auth, not 404
        return result.status === 401 || (result.success && result.body.includes('records'));
      }
    },
    {
      name: 'Insights Endpoint',
      url: `${config.apiUrl}/api/insights/daily`,
      validate: (result) => {
        // Should return 401 without auth, not 404
        return result.status === 401;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('Running smoke tests...\n');
  
  for (const test of tests) {
    process.stdout.write(`${test.name}... `);
    const result = await quickRequest(test.url);
    
    if (test.validate(result)) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log(`❌ FAIL (${result.error || `Status: ${result.status}`})`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(30));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n❌ Smoke tests FAILED!');
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests PASSED!');
    process.exit(0);
  }
}

runSmokeTests();