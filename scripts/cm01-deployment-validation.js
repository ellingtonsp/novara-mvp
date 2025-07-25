#!/usr/bin/env node

/**
 * CM-01 Deployment Validation Script
 * Validates CM-01 Positive-Reflection NLP & Dynamic Copy deployment
 */

const https = require('https');
const http = require('http');

// Staging environment configuration
const STAGING_CONFIG = {
  frontend: 'https://novara-c8wy65gjr-novara-fertility.vercel.app',
  backend: 'https://novara-staging-staging.up.railway.app',
  name: 'Staging'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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
        'User-Agent': 'CM-01-Validation/1.0',
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

    req.on('error', reject);
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

// Test critical endpoints (non-authenticated)
async function testCriticalEndpoints() {
  logSection('Testing Critical Backend Endpoints');
  
  const criticalEndpoints = [
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/auth/login', name: 'Login Endpoint', method: 'POST', body: { email: 'test@example.com' } }
  ];

  const results = [];
  
  for (const endpoint of criticalEndpoints) {
    try {
      log(`Testing ${endpoint.name}...`, 'yellow');
      const response = await makeRequest(`${STAGING_CONFIG.backend}${endpoint.path}`, {
        method: endpoint.method || 'GET',
        body: endpoint.body
      });
      
      if (response.success) {
        log(`✅ ${endpoint.name}: ${response.status}`, 'green');
        
        // Check environment detection
        if (response.data && response.data.environment) {
          if (response.data.environment === 'staging') {
            log(`   Environment: staging ✅`, 'green');
          } else {
            log(`   Environment: ${response.data.environment} ⚠️`, 'yellow');
          }
        }
        
        results.push({ endpoint: endpoint.name, success: true, status: response.status });
      } else {
        log(`❌ ${endpoint.name}: ${response.status}`, 'red');
        if (response.data && response.data.error) {
          log(`   Error: ${response.data.error}`, 'red');
        }
        results.push({ endpoint: endpoint.name, success: false, status: response.status });
      }
    } catch (error) {
      log(`❌ ${endpoint.name}: ${error.message}`, 'red');
      results.push({ endpoint: endpoint.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// Test frontend accessibility
async function testFrontend() {
  logSection('Testing Frontend Accessibility');
  
  try {
    log('Testing frontend accessibility...', 'yellow');
    const response = await makeRequest(STAGING_CONFIG.frontend);
    
    if (response.success) {
      log(`✅ Frontend accessible: ${response.status}`, 'green');
      return { success: true, status: response.status };
    } else {
      log(`❌ Frontend test failed: ${response.status}`, 'red');
      return { success: false, status: response.status };
    }
  } catch (error) {
    log(`❌ Frontend test failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test CORS configuration
async function testCORS() {
  logSection('Testing CORS Configuration');
  
  const testOrigins = [
    STAGING_CONFIG.frontend,
    'https://novara-mvp.vercel.app',
    'http://localhost:4200'
  ];

  const results = [];
  
  for (const origin of testOrigins) {
    try {
      const response = await makeRequest(`${STAGING_CONFIG.backend}/api/health`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader && (corsHeader === origin || corsHeader === '*')) {
        log(`✅ CORS for ${origin}: ${corsHeader}`, 'green');
        results.push({ origin, success: true });
      } else {
        log(`❌ CORS for ${origin}: ${corsHeader || 'missing'}`, 'red');
        results.push({ origin, success: false });
      }
    } catch (error) {
      log(`❌ CORS test failed for ${origin}: ${error.message}`, 'red');
      results.push({ origin, success: false, error: error.message });
    }
  }
  
  return results;
}

// Generate validation report
function generateReport(endpointResults, frontendResult, corsResults) {
  logHeader('CM-01 Deployment Validation Report');
  
  const totalTests = endpointResults.length + 1 + corsResults.length;
  const passedTests = endpointResults.filter(r => r.success).length + 
                     (frontendResult.success ? 1 : 0) + 
                     corsResults.filter(r => r.success).length;
  
  log(`\n${colors.green}✅ PASSED: ${passedTests}/${totalTests}${colors.reset}`);
  
  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED - CM-01 DEPLOYMENT VALIDATED!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'yellow');
  }
  
  log('\n' + '-'.repeat(40));
  log('Detailed Results:', 'bright');
  
  // Endpoint results
  log('\nBackend Endpoints:');
  endpointResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    log(`  ${status} ${result.endpoint}: ${result.status || result.error}`);
  });
  
  // Frontend result
  log('\nFrontend:');
  const frontendStatus = frontendResult.success ? '✅' : '❌';
  log(`  ${frontendStatus} Accessibility: ${frontendResult.status || frontendResult.error}`);
  
  // CORS results
  log('\nCORS Configuration:');
  corsResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    log(`  ${status} ${result.origin}`);
  });
  
  return passedTests === totalTests;
}

// Main validation function
async function main() {
  logHeader('CM-01 Deployment Validation');
  log(`Environment: ${STAGING_CONFIG.name}`, 'blue');
  log(`Backend: ${STAGING_CONFIG.backend}`, 'blue');
  log(`Frontend: ${STAGING_CONFIG.frontend}`, 'blue');
  
  try {
    // Test critical endpoints
    const endpointResults = await testCriticalEndpoints();
    
    // Test frontend
    const frontendResult = await testFrontend();
    
    // Test CORS
    const corsResults = await testCORS();
    
    // Generate report
    const allPassed = generateReport(endpointResults, frontendResult, corsResults);
    
    if (allPassed) {
      log('\n🚀 CM-01 is ready for user testing!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  CM-01 deployment has issues that need attention.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Validation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { main, testCriticalEndpoints, testFrontend, testCORS }; 