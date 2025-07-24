#!/usr/bin/env node

/**
 * Environment Health Check Script
 * Tests all endpoints and configurations across environments
 */

const https = require('https');
const http = require('http');

// Environment configurations
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    frontend: 'http://localhost:4200',
    backend: 'http://localhost:9002',
    description: 'Local development environment'
  },
  staging: {
    name: 'Staging',
    frontend: 'https://novara-mvp-git-staging-novara-fertility.vercel.app',
    backend: 'https://novara-staging-staging.up.railway.app',
    description: 'Staging environment for testing'
  },
  production: {
    name: 'Production',
    frontend: 'https://novara-mvp.vercel.app',
    backend: 'https://novara-mvp-production.up.railway.app',
    description: 'Production environment'
  }
};

// Test endpoints
const ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/auth/login', method: 'POST', name: 'Login Endpoint', body: { email: 'test@example.com' } },
  { path: '/api/checkins/questions', method: 'GET', name: 'Questions Endpoint', requiresAuth: true },
  { path: '/api/insights/daily', method: 'GET', name: 'Daily Insights', requiresAuth: true },
  { path: '/api/insights/micro', method: 'POST', name: 'Micro Insights', body: { onboardingData: { email: 'test@example.com' } } }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'cyan');
  console.log('-'.repeat(40));
}

// Make HTTP/HTTPS request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Novara-Health-Check/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test endpoint
async function testEndpoint(baseUrl, endpoint, environment) {
  const url = `${baseUrl}${endpoint.path}`;
  const options = {
    method: endpoint.method,
    body: endpoint.body
  };

  try {
    log(`Testing ${endpoint.name}...`, 'yellow');
    const response = await makeRequest(url, options);
    
    if (response.success) {
      log(`✅ ${endpoint.name}: ${response.status}`, 'green');
      
      // Check for environment-specific data
      if (response.data && response.data.environment) {
        const expectedEnv = environment.name.toLowerCase();
        const actualEnv = response.data.environment;
        
        if (actualEnv === expectedEnv) {
          log(`   Environment: ${actualEnv} ✅`, 'green');
        } else {
          log(`   Environment: ${actualEnv} (expected: ${expectedEnv}) ⚠️`, 'yellow');
        }
      }
      
      return { success: true, status: response.status, data: response.data };
    } else {
      log(`❌ ${endpoint.name}: ${response.status}`, 'red');
      if (response.data && response.data.error) {
        log(`   Error: ${response.data.error}`, 'red');
      }
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error) {
    log(`❌ ${endpoint.name}: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test CORS
async function testCORS(baseUrl, environment) {
  logSection('Testing CORS Configuration');
  
  const testOrigins = [
    'https://novara-mvp-git-staging-novara-fertility.vercel.app',
    'https://novara-mvp.vercel.app',
    'http://localhost:4200'
  ];

  for (const origin of testOrigins) {
    try {
      const response = await makeRequest(`${baseUrl}/api/health`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader && (corsHeader === origin || corsHeader === '*')) {
        log(`✅ CORS for ${origin}: ${corsHeader}`, 'green');
      } else {
        log(`❌ CORS for ${origin}: ${corsHeader || 'missing'}`, 'red');
      }
    } catch (error) {
      log(`❌ CORS test failed for ${origin}: ${error.message}`, 'red');
    }
  }
}

// Test environment
async function testEnvironment(envKey, envConfig) {
  logHeader(`Testing ${envConfig.name} Environment`);
  log(`Description: ${envConfig.description}`, 'blue');
  log(`Backend: ${envConfig.backend}`, 'blue');
  log(`Frontend: ${envConfig.frontend}`, 'blue');

  const results = {
    environment: envKey,
    backend: envConfig.backend,
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  // Test backend endpoints
  logSection('Testing Backend Endpoints');
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(envConfig.backend, endpoint, envConfig);
    results.tests.push({
      endpoint: endpoint.name,
      path: endpoint.path,
      ...result
    });
    
    results.summary.total++;
    if (result.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  }

  // Test CORS for staging and production
  if (envKey !== 'development') {
    await testCORS(envConfig.backend, envConfig);
  }

  // Test frontend accessibility
  logSection('Testing Frontend Accessibility');
  try {
    const frontendResponse = await makeRequest(envConfig.frontend);
    if (frontendResponse.success) {
      log(`✅ Frontend accessible: ${frontendResponse.status}`, 'green');
    } else {
      log(`❌ Frontend not accessible: ${frontendResponse.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Frontend test failed: ${error.message}`, 'red');
  }

  return results;
}

// Generate report
function generateReport(allResults) {
  logHeader('Environment Health Check Report');
  
  for (const result of allResults) {
    logSection(`${result.environment.toUpperCase()} Environment Results`);
    log(`Backend: ${result.backend}`, 'blue');
    log(`Tests: ${result.summary.passed}/${result.summary.total} passed`, 
        result.summary.failed === 0 ? 'green' : 'yellow');
    
    if (result.summary.failed > 0) {
      log('\nFailed Tests:', 'red');
      result.tests.filter(t => !t.success).forEach(test => {
        log(`  ❌ ${test.endpoint}: ${test.error || test.status}`, 'red');
      });
    }
  }

  // Overall summary
  const totalTests = allResults.reduce((sum, r) => sum + r.summary.total, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.summary.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.summary.failed, 0);

  logSection('Overall Summary');
  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  
  if (totalFailed === 0) {
    log('\n🎉 All environments are healthy!', 'green');
  } else {
    log('\n⚠️  Some issues detected. Please review the failed tests above.', 'yellow');
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const targetEnv = args[0]; // Optional: test specific environment

  logHeader('Novara Environment Health Check');
  log('Starting comprehensive environment testing...', 'blue');

  const environmentsToTest = targetEnv ? 
    { [targetEnv]: ENVIRONMENTS[targetEnv] } : 
    ENVIRONMENTS;

  const results = [];
  
  for (const [envKey, envConfig] of Object.entries(environmentsToTest)) {
    try {
      const result = await testEnvironment(envKey, envConfig);
      results.push(result);
    } catch (error) {
      log(`❌ Failed to test ${envKey} environment: ${error.message}`, 'red');
    }
  }

  generateReport(results);
}

// Run the health check
if (require.main === module) {
  main().catch(error => {
    log(`❌ Health check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testEnvironment, makeRequest, ENVIRONMENTS, ENDPOINTS }; 