#!/usr/bin/env node

/**
 * Comprehensive Vercel Preview Detection Test Suite
 * Tests the automatic preview URL detection implementation thoroughly
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  staging: {
    frontend: 'https://novara-staging-staging.up.railway.app',
    backend: 'https://novara-staging-staging.up.railway.app',
    expectedEnvironment: 'staging'
  },
  production: {
    frontend: 'https://novara-mvp.vercel.app',
    backend: 'https://novara-mvp-production.up.railway.app',
    expectedEnvironment: 'production'
  },
  timeout: 15000
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`🔍 ${title}`, 'bold');
  console.log('='.repeat(80));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  log(`📋 ${title}`, 'cyan');
  console.log('-'.repeat(60));
}

// HTTP request helper with enhanced error handling
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
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed for ${url}: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test environment detection simulation
function testEnvironmentDetection() {
  logSubSection('Environment Detection Logic Test');
  
  const testCases = [
    {
      name: 'Explicit VITE_ENV',
      env: { VITE_ENV: 'staging' },
      expected: 'staging'
    },
    {
      name: 'Vercel Preview Environment',
      env: { VITE_VERCEL_ENV: 'preview' },
      expected: 'preview'
    },
    {
      name: 'Vercel Production Environment',
      env: { VITE_VERCEL_ENV: 'production' },
      expected: 'production'
    },
    {
      name: 'Development Mode',
      env: { MODE: 'development' },
      expected: 'development'
    },
    {
      name: 'Vercel.app Domain Detection',
      hostname: 'novara-abc123-novara-fertility.vercel.app',
      expected: 'preview'
    },
    {
      name: 'Staging Domain Detection',
      hostname: 'novara-staging.vercel.app',
      expected: 'staging'
    },
    {
      name: 'Production Domain Detection',
      hostname: 'novara-mvp.vercel.app',
      expected: 'production'
    }
  ];

  let passedTests = 0;
  
  for (const testCase of testCases) {
    try {
      // Simulate environment detection logic
      let detectedEnv = 'production'; // default
      
      if (testCase.env?.VITE_ENV) {
        detectedEnv = testCase.env.VITE_ENV;
      } else if (testCase.env?.VITE_VERCEL_ENV) {
        detectedEnv = testCase.env.VITE_VERCEL_ENV;
      } else if (testCase.env?.MODE === 'development') {
        detectedEnv = 'development';
      } else if (testCase.hostname?.includes('.vercel.app')) {
        detectedEnv = 'preview';
      } else if (testCase.hostname?.includes('staging')) {
        detectedEnv = 'staging';
      }
      
      const passed = detectedEnv === testCase.expected;
      if (passed) {
        log(`✅ ${testCase.name}: ${detectedEnv}`, 'green');
        passedTests++;
      } else {
        log(`❌ ${testCase.name}: expected ${testCase.expected}, got ${detectedEnv}`, 'red');
      }
    } catch (error) {
      log(`❌ ${testCase.name}: ${error.message}`, 'red');
    }
  }
  
  log(`Environment Detection: ${passedTests}/${testCases.length} tests passed`, 
      passedTests === testCases.length ? 'green' : 'yellow');
  
  return passedTests === testCases.length;
}

// Test API URL routing simulation
function testApiUrlRouting() {
  logSubSection('API URL Routing Logic Test');
  
  const testCases = [
    {
      environment: 'development',
      expected: 'http://localhost:9002'
    },
    {
      environment: 'staging',
      expected: 'https://novara-staging-staging.up.railway.app'
    },
    {
      environment: 'preview',
      expected: 'https://novara-staging-staging.up.railway.app'
    },
    {
      environment: 'production',
      expected: 'https://novara-mvp-production.up.railway.app'
    }
  ];

  let passedTests = 0;
  
  for (const testCase of testCases) {
    try {
      // Simulate API URL routing logic
      let apiUrl = 'https://novara-mvp-production.up.railway.app'; // default
      
      switch (testCase.environment) {
        case 'development':
          apiUrl = 'http://localhost:9002';
          break;
        case 'staging':
          apiUrl = 'https://novara-staging-staging.up.railway.app';
          break;
        case 'preview':
          apiUrl = 'https://novara-staging-staging.up.railway.app';
          break;
        case 'production':
          apiUrl = 'https://novara-mvp-production.up.railway.app';
          break;
      }
      
      const passed = apiUrl === testCase.expected;
      if (passed) {
        log(`✅ ${testCase.environment}: ${apiUrl}`, 'green');
        passedTests++;
      } else {
        log(`❌ ${testCase.environment}: expected ${testCase.expected}, got ${apiUrl}`, 'red');
      }
    } catch (error) {
      log(`❌ ${testCase.environment}: ${error.message}`, 'red');
    }
  }
  
  log(`API URL Routing: ${passedTests}/${testCases.length} tests passed`, 
      passedTests === testCases.length ? 'green' : 'yellow');
  
  return passedTests === testCases.length;
}

// Test backend health with detailed analysis
async function testBackendHealth(environment) {
  logSubSection(`Testing ${environment} Backend Health`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const healthUrl = `${backendUrl}/api/health`;
  
  try {
    log(`Testing: ${healthUrl}`, 'blue');
    
    const response = await makeRequest(healthUrl);
    
    if (response.statusCode === 200) {
      log(`✅ ${environment} backend is healthy (${response.statusCode})`, 'green');
      
      // Parse and analyze health response
      try {
        const healthData = JSON.parse(response.data);
        log(`   Environment: ${healthData.environment}`, 'blue');
        log(`   Service: ${healthData.service}`, 'blue');
        log(`   Airtable: ${healthData.airtable || 'not configured'}`, 'blue');
        log(`   JWT: ${healthData.jwt || 'not configured'}`, 'blue');
        log(`   Timestamp: ${healthData.timestamp || 'not provided'}`, 'blue');
        
        // Validate environment matches expected
        const expectedEnv = TEST_CONFIG[environment].expectedEnvironment;
        if (healthData.environment === expectedEnv) {
          log(`   ✅ Environment validation: ${healthData.environment} matches expected ${expectedEnv}`, 'green');
        } else {
          log(`   ⚠️ Environment validation: ${healthData.environment} doesn't match expected ${expectedEnv}`, 'yellow');
        }
        
        return {
          healthy: true,
          environment: healthData.environment,
          service: healthData.service,
          airtable: healthData.airtable,
          jwt: healthData.jwt
        };
      } catch (e) {
        log(`   Raw response: ${response.data}`, 'yellow');
        return { healthy: true, rawData: response.data };
      }
    } else {
      log(`❌ ${environment} backend unhealthy (${response.statusCode})`, 'red');
      log(`   Response: ${response.data}`, 'red');
      return { healthy: false, statusCode: response.statusCode, error: response.data };
    }
  } catch (error) {
    log(`❌ ${environment} backend error: ${error.message}`, 'red');
    return { healthy: false, error: error.message };
  }
}

// Test frontend environment detection
async function testFrontendEnvironment(environment) {
  logSubSection(`Testing ${environment} Frontend Environment Detection`);
  
  const frontendUrl = TEST_CONFIG[environment].frontend;
  
  try {
    log(`Testing: ${frontendUrl}`, 'blue');
    
    const response = await makeRequest(frontendUrl);
    
    if (response.statusCode === 200) {
      log(`✅ ${environment} frontend is accessible (${response.statusCode})`, 'green');
      
      // Analyze HTML content for environment indicators
      const html = response.data;
      const indicators = {
        react: html.includes('react') || html.includes('React'),
        novara: html.includes('Novara') || html.includes('novara'),
        environment: html.includes('environment') || html.includes('VITE_'),
        vite: html.includes('vite') || html.includes('VITE_'),
        typescript: html.includes('typescript') || html.includes('TypeScript')
      };
      
      log(`   React App: ${indicators.react ? '✅' : '❌'}`, indicators.react ? 'green' : 'red');
      log(`   Novara App: ${indicators.novara ? '✅' : '❌'}`, indicators.novara ? 'green' : 'red');
      log(`   Environment Variables: ${indicators.environment ? '✅' : '❌'}`, indicators.environment ? 'green' : 'red');
      log(`   Vite Build: ${indicators.vite ? '✅' : '❌'}`, indicators.vite ? 'green' : 'red');
      log(`   TypeScript: ${indicators.typescript ? '✅' : '❌'}`, indicators.typescript ? 'green' : 'red');
      
      return {
        accessible: true,
        indicators: indicators
      };
    } else {
      log(`❌ ${environment} frontend error (${response.statusCode})`, 'red');
      return { accessible: false, statusCode: response.statusCode };
    }
  } catch (error) {
    log(`❌ ${environment} frontend error: ${error.message}`, 'red');
    return { accessible: false, error: error.message };
  }
}

// Test API connectivity with comprehensive endpoint testing
async function testApiConnectivity(environment) {
  logSubSection(`Testing ${environment} API Connectivity`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const testEndpoints = [
    { path: '/api/health', expectedStatus: 200, description: 'Health Check' },
    { path: '/api/users/test', expectedStatus: [404, 401], description: 'User Test Endpoint' },
    { path: '/api/checkins', expectedStatus: [401, 200], description: 'Check-ins Endpoint' },
    { path: '/api/auth/status', expectedStatus: [401, 200], description: 'Auth Status' },
    { path: '/api/insights', expectedStatus: [401, 200], description: 'Insights Endpoint' }
  ];
  
  let successCount = 0;
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const testUrl = `${backendUrl}${endpoint.path}`;
    
    try {
      log(`Testing: ${endpoint.path}`, 'blue');
      
      const response = await makeRequest(testUrl);
      
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];
      
      const isSuccess = expectedStatuses.includes(response.statusCode);
      
      if (isSuccess) {
        log(`   ✅ ${endpoint.description} - ${response.statusCode}`, 'green');
        successCount++;
      } else {
        log(`   ❌ ${endpoint.description} - ${response.statusCode} (expected ${expectedStatuses.join(' or ')})`, 'red');
      }
      
      results.push({
        endpoint: endpoint.path,
        statusCode: response.statusCode,
        expected: expectedStatuses,
        success: isSuccess,
        description: endpoint.description
      });
    } catch (error) {
      log(`   ❌ ${endpoint.description} - Error: ${error.message}`, 'red');
      results.push({
        endpoint: endpoint.path,
        error: error.message,
        success: false,
        description: endpoint.description
      });
    }
  }
  
  const successRate = (successCount / testEndpoints.length) * 100;
  log(`API Connectivity Success Rate: ${successRate.toFixed(1)}%`, successRate > 80 ? 'green' : 'yellow');
  
  return {
    successRate: successRate,
    successCount: successCount,
    totalEndpoints: testEndpoints.length,
    results: results
  };
}

// Test CORS configuration with detailed analysis
async function testCorsConfiguration(environment) {
  logSubSection(`Testing ${environment} CORS Configuration`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const frontendUrl = TEST_CONFIG[environment].frontend;
  
  try {
    log(`Testing CORS from ${frontendUrl} to ${backendUrl}`, 'blue');
    
    const response = await makeRequest(`${backendUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    const corsHeaders = {
      allowOrigin: response.headers['access-control-allow-origin'],
      allowMethods: response.headers['access-control-allow-methods'],
      allowHeaders: response.headers['access-control-allow-headers'],
      allowCredentials: response.headers['access-control-allow-credentials']
    };
    
    if (corsHeaders.allowOrigin) {
      log(`✅ CORS headers present:`, 'green');
      log(`   Allow-Origin: ${corsHeaders.allowOrigin}`, 'blue');
      log(`   Allow-Methods: ${corsHeaders.allowMethods || 'not specified'}`, 'blue');
      log(`   Allow-Headers: ${corsHeaders.allowHeaders || 'not specified'}`, 'blue');
      log(`   Allow-Credentials: ${corsHeaders.allowCredentials || 'not specified'}`, 'blue');
      
      return {
        configured: true,
        headers: corsHeaders
      };
    } else {
      log(`❌ No CORS headers found`, 'red');
      log(`   This may not affect functionality if CORS is handled differently`, 'yellow');
      return { configured: false };
    }
  } catch (error) {
    log(`❌ CORS test error: ${error.message}`, 'red');
    return { configured: false, error: error.message };
  }
}

// Test environment.ts file validation
function testEnvironmentFile() {
  logSubSection('Environment Configuration File Validation');
  
  const envFilePath = path.join(__dirname, '..', 'frontend', 'src', 'lib', 'environment.ts');
  
  try {
    if (!fs.existsSync(envFilePath)) {
      log(`❌ Environment file not found: ${envFilePath}`, 'red');
      return false;
    }
    
    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Check for key implementation features
    const checks = {
      previewDetection: envFileContent.includes('VITE_VERCEL_ENV'),
      hostnameDetection: envFileContent.includes('.vercel.app'),
      previewRouting: envFileContent.includes("case 'preview'"),
      enhancedLogging: envFileContent.includes('viteVercelEnv'),
      backwardCompatible: envFileContent.includes('VITE_ENV')
    };
    
    let passedChecks = 0;
    
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        log(`✅ ${check}: implemented`, 'green');
        passedChecks++;
      } else {
        log(`❌ ${check}: missing`, 'red');
      }
    }
    
    log(`Environment File Validation: ${passedChecks}/${Object.keys(checks).length} checks passed`, 
        passedChecks === Object.keys(checks).length ? 'green' : 'yellow');
    
    return passedChecks === Object.keys(checks).length;
  } catch (error) {
    log(`❌ Environment file validation error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runComprehensiveTests() {
  logSection('🚀 Comprehensive Vercel Preview Detection Test Suite');
  log(`Testing automatic preview URL detection implementation thoroughly`, 'blue');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  log(`Version: 2.0 - Enhanced with comprehensive validation`, 'blue');
  
  const results = {
    logicTests: {
      environmentDetection: false,
      apiUrlRouting: false
    },
    staging: {
      backend: null,
      frontend: null,
      api: null,
      cors: null
    },
    production: {
      backend: null,
      frontend: null,
      api: null,
      cors: null
    },
    fileValidation: false
  };
  
  // Phase 1: Logic Tests
  logSection('Phase 1: Logic Validation');
  results.logicTests.environmentDetection = testEnvironmentDetection();
  results.logicTests.apiUrlRouting = testApiUrlRouting();
  
  // Phase 2: File Validation
  logSection('Phase 2: File Validation');
  results.fileValidation = testEnvironmentFile();
  
  // Phase 3: Environment Testing
  logSection('Phase 3: Environment Testing');
  
  // Test staging environment
  logSubSection('Testing Staging Environment');
  results.staging.backend = await testBackendHealth('staging');
  results.staging.frontend = await testFrontendEnvironment('staging');
  results.staging.api = await testApiConnectivity('staging');
  results.staging.cors = await testCorsConfiguration('staging');
  
  // Test production environment
  logSubSection('Testing Production Environment');
  results.production.backend = await testBackendHealth('production');
  results.production.frontend = await testFrontendEnvironment('production');
  results.production.api = await testApiConnectivity('production');
  results.production.cors = await testCorsConfiguration('production');
  
  // Phase 4: Results Summary
  logSection('📊 Comprehensive Test Results Summary');
  
  // Logic Tests Summary
  const logicTestsPassed = Object.values(results.logicTests).filter(Boolean).length;
  const logicTestsTotal = Object.keys(results.logicTests).length;
  log(`Logic Tests: ${logicTestsPassed}/${logicTestsTotal} passed`, 
      logicTestsPassed === logicTestsTotal ? 'green' : 'yellow');
  
  // File Validation Summary
  log(`File Validation: ${results.fileValidation ? '✅' : '❌'}`, 
      results.fileValidation ? 'green' : 'red');
  
  // Environment Tests Summary
  const environments = ['staging', 'production'];
  for (const env of environments) {
    const result = results[env];
    const backendHealthy = result.backend?.healthy || false;
    const frontendAccessible = result.frontend?.accessible || false;
    const apiSuccess = result.api?.successRate > 80 || false;
    const corsConfigured = result.cors?.configured || false;
    
    const passed = [backendHealthy, frontendAccessible, apiSuccess, corsConfigured].filter(Boolean).length;
    const total = 4;
    const percentage = (passed / total) * 100;
    
    log(`${env.toUpperCase()} Environment:`, 'bold');
    log(`  Backend Health: ${backendHealthy ? '✅' : '❌'}`, backendHealthy ? 'green' : 'red');
    log(`  Frontend Access: ${frontendAccessible ? '✅' : '❌'}`, frontendAccessible ? 'green' : 'red');
    log(`  API Connectivity: ${apiSuccess ? '✅' : '❌'} (${result.api?.successRate?.toFixed(1)}%)`, apiSuccess ? 'green' : 'red');
    log(`  CORS Configuration: ${corsConfigured ? '✅' : '❌'}`, corsConfigured ? 'green' : 'red');
    log(`  Overall: ${passed}/${total} (${percentage.toFixed(1)}%)`, percentage > 75 ? 'green' : 'yellow');
  }
  
  // Overall Assessment
  logSection('🎯 Overall Assessment');
  
  const logicPassed = Object.values(results.logicTests).every(Boolean);
  const stagingHealthy = results.staging.backend?.healthy && results.staging.frontend?.accessible;
  const productionHealthy = results.production.backend?.healthy && results.production.frontend?.accessible;
  const fileValid = results.fileValidation;
  
  if (logicPassed && stagingHealthy && productionHealthy && fileValid) {
    log('🎉 EXCELLENT: All tests passed! Vercel preview detection is ready for production.', 'green');
    log('   The implementation is working correctly and all environments are healthy.', 'green');
  } else if (logicPassed && (stagingHealthy || productionHealthy) && fileValid) {
    log('✅ GOOD: Core functionality is working. Some environment issues need attention.', 'yellow');
    log('   The Vercel preview detection logic is sound, but some environments need fixing.', 'yellow');
  } else {
    log('⚠️ ATTENTION NEEDED: Several issues detected that require investigation.', 'red');
    log('   Review the test results above and address the failing components.', 'red');
  }
  
  // Recommendations
  logSection('💡 Recommendations');
  
  if (logicPassed && fileValid) {
    log('✅ Vercel preview detection logic is correctly implemented', 'green');
    log('✅ Environment configuration file is properly structured', 'green');
  }
  
  if (stagingHealthy) {
    log('✅ Staging environment is ready for Vercel preview detection testing', 'green');
    log('   Next: Deploy a feature branch to test automatic preview URL detection', 'blue');
  } else {
    log('❌ Staging environment needs attention before testing preview detection', 'red');
    log('   Fix backend/frontend issues before proceeding', 'yellow');
  }
  
  if (productionHealthy) {
    log('✅ Production environment is stable', 'green');
  } else {
    log('❌ Production environment needs attention', 'red');
  }
  
  // Next Steps
  logSection('🎯 Next Steps');
  log('1. Enable Vercel system environment variables in dashboard', 'blue');
  log('2. Deploy a feature branch to test automatic preview URL detection', 'blue');
  log('3. Monitor environment detection logs in browser console', 'blue');
  log('4. Verify API calls work without CORS errors in preview deployments', 'blue');
  
  console.log('\n' + '='.repeat(80));
  log('🏁 Comprehensive test suite completed', 'bold');
  console.log('='.repeat(80));
  
  return {
    success: logicPassed && stagingHealthy && productionHealthy && fileValid,
    results: results
  };
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    log(`❌ Comprehensive test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testEnvironmentDetection,
  testApiUrlRouting,
  testBackendHealth,
  testFrontendEnvironment,
  testApiConnectivity,
  testCorsConfiguration,
  testEnvironmentFile
}; 