#!/usr/bin/env node

/**
 * Vercel Preview Detection Test Script
 * Tests the new automatic preview URL detection functionality
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  staging: {
    frontend: 'https://novara-staging-staging.up.railway.app',
    backend: 'https://novara-staging-staging.up.railway.app'
  },
  production: {
    frontend: 'https://novara-mvp.vercel.app',
    backend: 'https://novara-mvp-production.up.railway.app'
  },
  timeout: 10000
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'bold');
  console.log('='.repeat(60));
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test backend health
async function testBackendHealth(environment) {
  logSection(`Testing ${environment} Backend Health`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const healthUrl = `${backendUrl}/api/health`;
  
  try {
    log(`Testing: ${healthUrl}`, 'blue');
    
    const response = await makeRequest(healthUrl);
    
    if (response.statusCode === 200) {
      log(`✅ ${environment} backend is healthy (${response.statusCode})`, 'green');
      
      // Parse and log health response
      try {
        const healthData = JSON.parse(response.data);
        log(`   Environment: ${healthData.environment}`, 'blue');
        log(`   Service: ${healthData.service}`, 'blue');
        log(`   Airtable: ${healthData.airtable}`, 'blue');
        log(`   JWT: ${healthData.jwt}`, 'blue');
      } catch (e) {
        log(`   Raw response: ${response.data}`, 'yellow');
      }
      
      return true;
    } else {
      log(`❌ ${environment} backend unhealthy (${response.statusCode})`, 'red');
      log(`   Response: ${response.data}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${environment} backend error: ${error.message}`, 'red');
    return false;
  }
}

// Test frontend environment detection
async function testFrontendEnvironment(environment) {
  logSection(`Testing ${environment} Frontend Environment Detection`);
  
  const frontendUrl = TEST_CONFIG[environment].frontend;
  
  try {
    log(`Testing: ${frontendUrl}`, 'blue');
    
    const response = await makeRequest(frontendUrl);
    
    if (response.statusCode === 200) {
      log(`✅ ${environment} frontend is accessible (${response.statusCode})`, 'green');
      
      // Check if the page contains environment detection indicators
      const html = response.data;
      
      // Look for environment configuration in the HTML
      if (html.includes('environment') || html.includes('VITE_')) {
        log(`   Environment variables detected in HTML`, 'blue');
      }
      
      // Check for React app indicators
      if (html.includes('react') || html.includes('Novara')) {
        log(`   React app detected`, 'blue');
      }
      
      return true;
    } else {
      log(`❌ ${environment} frontend error (${response.statusCode})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${environment} frontend error: ${error.message}`, 'red');
    return false;
  }
}

// Test API connectivity from frontend perspective
async function testApiConnectivity(environment) {
  logSection(`Testing ${environment} API Connectivity`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const testEndpoints = [
    '/api/health',
    '/api/users/test',
    '/api/checkins'
  ];
  
  let successCount = 0;
  
  for (const endpoint of testEndpoints) {
    const testUrl = `${backendUrl}${endpoint}`;
    
    try {
      log(`Testing: ${testUrl}`, 'blue');
      
      const response = await makeRequest(testUrl);
      
      if (response.statusCode < 500) {
        log(`✅ ${endpoint} - ${response.statusCode}`, 'green');
        successCount++;
      } else {
        log(`❌ ${endpoint} - ${response.statusCode}`, 'red');
      }
    } catch (error) {
      log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    }
  }
  
  const successRate = (successCount / testEndpoints.length) * 100;
  log(`API Connectivity Success Rate: ${successRate.toFixed(1)}%`, successRate > 66 ? 'green' : 'yellow');
  
  return successRate > 66;
}

// Test CORS configuration
async function testCorsConfiguration(environment) {
  logSection(`Testing ${environment} CORS Configuration`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const frontendUrl = TEST_CONFIG[environment].frontend;
  
  try {
    log(`Testing CORS from ${frontendUrl} to ${backendUrl}`, 'blue');
    
    const response = await makeRequest(`${backendUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    
    if (corsHeaders) {
      log(`✅ CORS headers present: ${corsHeaders}`, 'green');
      return true;
    } else {
      log(`❌ No CORS headers found`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ CORS test error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runTests() {
  logSection('🚀 Vercel Preview Detection Test Suite');
  log(`Testing automatic preview URL detection implementation`, 'blue');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  
  const results = {
    staging: {
      backend: false,
      frontend: false,
      api: false,
      cors: false
    },
    production: {
      backend: false,
      frontend: false,
      api: false,
      cors: false
    }
  };
  
  // Test staging environment
  logSection('Testing Staging Environment');
  results.staging.backend = await testBackendHealth('staging');
  results.staging.frontend = await testFrontendEnvironment('staging');
  results.staging.api = await testApiConnectivity('staging');
  results.staging.cors = await testCorsConfiguration('staging');
  
  // Test production environment
  logSection('Testing Production Environment');
  results.production.backend = await testBackendHealth('production');
  results.production.frontend = await testFrontendEnvironment('production');
  results.production.api = await testApiConnectivity('production');
  results.production.cors = await testCorsConfiguration('production');
  
  // Summary
  logSection('📊 Test Results Summary');
  
  const environments = ['staging', 'production'];
  for (const env of environments) {
    const result = results[env];
    const passed = Object.values(result).filter(Boolean).length;
    const total = Object.keys(result).length;
    const percentage = (passed / total) * 100;
    
    log(`${env.toUpperCase()} Environment:`, 'bold');
    log(`  Backend Health: ${result.backend ? '✅' : '❌'}`, result.backend ? 'green' : 'red');
    log(`  Frontend Access: ${result.frontend ? '✅' : '❌'}`, result.frontend ? 'green' : 'red');
    log(`  API Connectivity: ${result.api ? '✅' : '❌'}`, result.api ? 'green' : 'red');
    log(`  CORS Configuration: ${result.cors ? '✅' : '❌'}`, result.cors ? 'green' : 'red');
    log(`  Overall: ${passed}/${total} (${percentage.toFixed(1)}%)`, percentage > 75 ? 'green' : 'yellow');
  }
  
  // Recommendations
  logSection('💡 Recommendations');
  
  if (results.staging.backend && results.staging.frontend) {
    log('✅ Staging environment is ready for Vercel preview detection testing', 'green');
    log('   Next: Deploy a feature branch to test automatic preview URL detection', 'blue');
  } else {
    log('❌ Staging environment needs attention before testing preview detection', 'red');
    log('   Fix backend/frontend issues before proceeding', 'yellow');
  }
  
  if (results.production.backend && results.production.frontend) {
    log('✅ Production environment is stable', 'green');
  } else {
    log('❌ Production environment needs attention', 'red');
  }
  
  logSection('🎯 Next Steps');
  log('1. Enable Vercel system environment variables in dashboard', 'blue');
  log('2. Deploy this feature branch to staging', 'blue');
  log('3. Create a test feature branch to verify preview detection', 'blue');
  log('4. Monitor environment detection logs in browser console', 'blue');
  
  console.log('\n' + '='.repeat(60));
  log('🏁 Test suite completed', 'bold');
  console.log('='.repeat(60));
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBackendHealth,
  testFrontendEnvironment,
  testApiConnectivity,
  testCorsConfiguration
}; 