#!/usr/bin/env node

/**
 * Actual Endpoints Test Suite
 * Tests the real endpoints that exist in the backend based on server.js
 * Time is money - this validates your actual application flow
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  staging: {
    backend: 'https://novara-staging-staging.up.railway.app',
    frontend: 'https://novara-staging-staging.up.railway.app'
  },
  production: {
    backend: 'https://novara-mvp-production.up.railway.app',
    frontend: 'https://novara-mvp.vercel.app'
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

// HTTP request helper with detailed error handling
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

// Test actual endpoints that exist in the backend
async function testActualEndpoints(environment) {
  logSubSection(`Testing ${environment} Actual Endpoints`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  
  // Define actual endpoints based on server.js
  const actualEndpoints = [
    {
      path: '/',
      method: 'GET',
      description: 'API Root',
      expectedStatus: 200,
      critical: true,
      businessLogic: 'API overview and endpoint listing'
    },
    {
      path: '/api/health',
      method: 'GET',
      description: 'Health Check',
      expectedStatus: 200,
      critical: true,
      businessLogic: 'System health validation'
    },
    {
      path: '/api/checkins-test',
      method: 'GET',
      description: 'Check-ins Test Endpoint',
      expectedStatus: 200,
      critical: true,
      businessLogic: 'API endpoints overview'
    },
    {
      path: '/api/auth/login',
      method: 'POST',
      description: 'User Login',
      expectedStatus: [400, 401, 422], // Should return validation error without proper data
      critical: true,
      businessLogic: 'User authentication',
      testData: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    },
    {
      path: '/api/users',
      method: 'POST',
      description: 'User Registration',
      expectedStatus: [400, 401, 422], // Should return validation error without proper data
      critical: true,
      businessLogic: 'User account creation',
      testData: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        nickname: 'TestUser'
      })
    },
    {
      path: '/api/users/me',
      method: 'GET',
      description: 'Get Current User',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'User profile retrieval'
    },
    {
      path: '/api/checkins',
      method: 'GET',
      description: 'Get Check-ins',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'Daily check-in retrieval'
    },
    {
      path: '/api/checkins',
      method: 'POST',
      description: 'Create Check-in',
      expectedStatus: [400, 401, 422], // Should return validation error without proper data
      critical: true,
      businessLogic: 'Daily check-in submission',
      testData: JSON.stringify({
        mood_today: 5,
        confidence_today: 7,
        primary_concern_today: 'Test concern',
        user_note: 'Test note'
      })
    },
    {
      path: '/api/insights/daily',
      method: 'GET',
      description: 'Daily Insights',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'AI insights retrieval'
    },
    {
      path: '/api/insights/engagement',
      method: 'POST',
      description: 'Insight Engagement',
      expectedStatus: [400, 401, 422], // Should return validation error without proper data
      critical: true,
      businessLogic: 'Insight engagement tracking',
      testData: JSON.stringify({
        insight_type: 'daily',
        action: 'viewed'
      })
    },
    {
      path: '/api/users/insight',
      method: 'GET',
      description: 'User Micro-Insight',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'Personalized micro-insights'
    },
    {
      path: '/api/checkins/last-values',
      method: 'GET',
      description: 'Last Check-in Values',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'Previous check-in data retrieval'
    },
    {
      path: '/api/checkins/questions',
      method: 'GET',
      description: 'Check-in Questions',
      expectedStatus: [401, 403], // Should require authentication
      critical: true,
      businessLogic: 'Dynamic check-in questions'
    },
    {
      path: '/api/analytics/events',
      method: 'POST',
      description: 'Analytics Events',
      expectedStatus: [400, 401, 422], // Should return validation error without proper data
      critical: false,
      businessLogic: 'Event tracking',
      testData: JSON.stringify({
        event_type: 'page_view',
        event_data: { page: 'dashboard' }
      })
    }
  ];
  
  let successCount = 0;
  let criticalSuccessCount = 0;
  const results = [];
  
  for (const endpoint of actualEndpoints) {
    const testUrl = `${backendUrl}${endpoint.path}`;
    
    try {
      log(`Testing: ${endpoint.method} ${endpoint.path}`, 'blue');
      
      const requestOptions = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.testData) {
        requestOptions.body = endpoint.testData;
      }
      
      const response = await makeRequest(testUrl, requestOptions);
      
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];
      
      const isSuccess = expectedStatuses.includes(response.statusCode);
      
      if (isSuccess) {
        log(`   ✅ ${endpoint.description} - ${response.statusCode}`, 'green');
        successCount++;
        if (endpoint.critical) {
          criticalSuccessCount++;
        }
      } else {
        log(`   ❌ ${endpoint.description} - ${response.statusCode} (expected ${expectedStatuses.join(' or ')})`, 'red');
      }
      
      // Additional analysis for critical endpoints
      if (endpoint.critical) {
        if (response.statusCode === 500) {
          log(`   🚨 CRITICAL: ${endpoint.description} returned 500 - Internal Server Error`, 'red');
        } else if (response.statusCode === 503) {
          log(`   🚨 CRITICAL: ${endpoint.description} returned 503 - Service Unavailable`, 'red');
        } else if (response.statusCode === 502) {
          log(`   🚨 CRITICAL: ${endpoint.description} returned 502 - Bad Gateway`, 'red');
        }
      }
      
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        statusCode: response.statusCode,
        expected: expectedStatuses,
        success: isSuccess,
        critical: endpoint.critical,
        description: endpoint.description,
        businessLogic: endpoint.businessLogic
      });
    } catch (error) {
      log(`   ❌ ${endpoint.description} - Error: ${error.message}`, 'red');
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        error: error.message,
        success: false,
        critical: endpoint.critical,
        description: endpoint.description,
        businessLogic: endpoint.businessLogic
      });
    }
  }
  
  const successRate = (successCount / actualEndpoints.length) * 100;
  const criticalSuccessRate = (criticalSuccessCount / actualEndpoints.filter(e => e.critical).length) * 100;
  
  log(`Overall Success Rate: ${successRate.toFixed(1)}%`, successRate > 90 ? 'green' : 'yellow');
  log(`Critical Endpoints Success Rate: ${criticalSuccessRate.toFixed(1)}%`, criticalSuccessRate > 95 ? 'green' : 'red');
  
  return {
    successRate: successRate,
    criticalSuccessRate: criticalSuccessRate,
    successCount: successCount,
    criticalSuccessCount: criticalSuccessCount,
    totalEndpoints: actualEndpoints.length,
    totalCritical: actualEndpoints.filter(e => e.critical).length,
    results: results
  };
}

// Test authentication flow with actual endpoints
async function testAuthenticationFlow(environment) {
  logSubSection(`Testing ${environment} Authentication Flow`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  
  // Test registration flow
  try {
    log('Testing user registration flow...', 'blue');
    
    const registerResponse = await makeRequest(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@novara.com',
        password: 'TestPassword123!',
        nickname: 'TestUser'
      })
    });
    
    if (registerResponse.statusCode === 201 || registerResponse.statusCode === 200) {
      log('✅ User registration: Success', 'green');
      
      // Test login with created user
      const loginResponse = await makeRequest(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@novara.com',
          password: 'TestPassword123!'
        })
      });
      
      if (loginResponse.statusCode === 200) {
        log('✅ User login: Success', 'green');
        
        // Extract token if present
        let token = null;
        try {
          const loginData = JSON.parse(loginResponse.data);
          token = loginData.token || loginData.accessToken;
        } catch (e) {
          // Token might be in headers or different format
        }
        
        if (token) {
          log('✅ Authentication token: Received', 'green');
          
          // Test authenticated endpoints
          const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          
          // Test check-ins with authentication
          const checkinsResponse = await makeRequest(`${backendUrl}/api/checkins`, {
            method: 'GET',
            headers: authHeaders
          });
          
          if (checkinsResponse.statusCode === 200) {
            log('✅ Authenticated check-ins: Success', 'green');
          } else {
            log(`⚠️ Authenticated check-ins: ${checkinsResponse.statusCode}`, 'yellow');
          }
          
          // Test insights with authentication
          const insightsResponse = await makeRequest(`${backendUrl}/api/insights/daily`, {
            method: 'GET',
            headers: authHeaders
          });
          
          if (insightsResponse.statusCode === 200) {
            log('✅ Authenticated insights: Success', 'green');
          } else {
            log(`⚠️ Authenticated insights: ${insightsResponse.statusCode}`, 'yellow');
          }
        } else {
          log('⚠️ No authentication token received', 'yellow');
        }
      } else {
        log(`⚠️ User login: ${loginResponse.statusCode}`, 'yellow');
      }
    } else {
      log(`⚠️ User registration: ${registerResponse.statusCode}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Authentication flow error: ${error.message}`, 'red');
  }
}

// Test CORS and cross-origin requests
async function testCorsAndCrossOrigin(environment) {
  logSubSection(`Testing ${environment} CORS and Cross-Origin Requests`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  const frontendUrl = TEST_CONFIG[environment].frontend;
  
  try {
    // Test CORS preflight
    log('Testing CORS preflight request...', 'blue');
    
    const corsResponse = await makeRequest(`${backendUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    const corsHeaders = {
      allowOrigin: corsResponse.headers['access-control-allow-origin'],
      allowMethods: corsResponse.headers['access-control-allow-methods'],
      allowHeaders: corsResponse.headers['access-control-allow-headers'],
      allowCredentials: corsResponse.headers['access-control-allow-credentials']
    };
    
    if (corsHeaders.allowOrigin) {
      log('✅ CORS headers present:', 'green');
      log(`   Allow-Origin: ${corsHeaders.allowOrigin}`, 'blue');
      log(`   Allow-Methods: ${corsHeaders.allowMethods || 'not specified'}`, 'blue');
      log(`   Allow-Headers: ${corsHeaders.allowHeaders || 'not specified'}`, 'blue');
      log(`   Allow-Credentials: ${corsHeaders.allowCredentials || 'not specified'}`, 'blue');
    } else {
      log('⚠️ No CORS headers found', 'yellow');
    }
    
    // Test actual cross-origin request
    log('Testing cross-origin API request...', 'blue');
    
    const crossOriginResponse = await makeRequest(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': frontendUrl,
        'Content-Type': 'application/json'
      }
    });
    
    if (crossOriginResponse.statusCode === 200) {
      log('✅ Cross-origin request: Success', 'green');
    } else {
      log(`⚠️ Cross-origin request: ${crossOriginResponse.statusCode}`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ CORS test error: ${error.message}`, 'red');
  }
}

// Test environment detection and API routing
async function testEnvironmentDetection(environment) {
  logSubSection(`Testing ${environment} Environment Detection`);
  
  const backendUrl = TEST_CONFIG[environment].backend;
  
  try {
    // Test health endpoint for environment info
    const healthResponse = await makeRequest(`${backendUrl}/api/health`);
    
    if (healthResponse.statusCode === 200) {
      try {
        const healthData = JSON.parse(healthResponse.data);
        log(`✅ Environment: ${healthData.environment}`, 'green');
        log(`✅ Service: ${healthData.service}`, 'green');
        log(`✅ Timestamp: ${healthData.timestamp}`, 'green');
        
        // Validate environment matches expected
        const expectedEnv = environment;
        if (healthData.environment === expectedEnv) {
          log(`✅ Environment validation: ${healthData.environment} matches expected ${expectedEnv}`, 'green');
        } else {
          log(`⚠️ Environment validation: ${healthData.environment} doesn't match expected ${expectedEnv}`, 'yellow');
        }
      } catch (e) {
        log(`⚠️ Could not parse health response: ${healthResponse.data}`, 'yellow');
      }
    } else {
      log(`❌ Health endpoint: ${healthResponse.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Environment detection error: ${error.message}`, 'red');
  }
}

// Main test runner
async function runActualEndpointTests() {
  logSection('🚀 Actual Endpoints Test Suite - Zero Disruption Validation');
  log(`Testing all actual endpoints that exist in the backend`, 'blue');
  log(`Time is money - this validates your real application flow`, 'blue');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  
  const results = {
    staging: {
      endpoints: null,
      auth: null,
      cors: null,
      environment: null
    },
    production: {
      endpoints: null,
      auth: null,
      cors: null,
      environment: null
    }
  };
  
  // Test staging environment
  logSection('Testing Staging Environment');
  results.staging.endpoints = await testActualEndpoints('staging');
  results.staging.auth = await testAuthenticationFlow('staging');
  results.staging.cors = await testCorsAndCrossOrigin('staging');
  results.staging.environment = await testEnvironmentDetection('staging');
  
  // Test production environment
  logSection('Testing Production Environment');
  results.production.endpoints = await testActualEndpoints('production');
  results.production.auth = await testAuthenticationFlow('production');
  results.production.cors = await testCorsAndCrossOrigin('production');
  results.production.environment = await testEnvironmentDetection('production');
  
  // Comprehensive Results Summary
  logSection('📊 Actual Endpoints Test Results Summary');
  
  const environments = ['staging', 'production'];
  for (const env of environments) {
    const result = results[env];
    const endpointSuccess = result.endpoints?.criticalSuccessRate > 95;
    const overallSuccess = result.endpoints?.successRate > 90;
    
    log(`${env.toUpperCase()} Environment:`, 'bold');
    log(`  Critical Endpoints: ${endpointSuccess ? '✅' : '❌'} (${result.endpoints?.criticalSuccessRate?.toFixed(1)}%)`, 
        endpointSuccess ? 'green' : 'red');
    log(`  Overall Endpoints: ${overallSuccess ? '✅' : '❌'} (${result.endpoints?.successRate?.toFixed(1)}%)`, 
        overallSuccess ? 'green' : 'red');
    log(`  Authentication Flow: ${result.auth ? '✅' : '⚠️'}`, result.auth ? 'green' : 'yellow');
    log(`  CORS Configuration: ${result.cors ? '✅' : '⚠️'}`, result.cors ? 'green' : 'yellow');
    log(`  Environment Detection: ${result.environment ? '✅' : '⚠️'}`, result.environment ? 'green' : 'yellow');
  }
  
  // Zero Disruption Assessment
  logSection('🎯 Zero Disruption Assessment');
  
  const stagingCritical = results.staging.endpoints?.criticalSuccessRate > 95;
  const productionCritical = results.production.endpoints?.criticalSuccessRate > 95;
  const stagingOverall = results.staging.endpoints?.successRate > 90;
  const productionOverall = results.production.endpoints?.successRate > 90;
  
  if (stagingCritical && productionCritical && stagingOverall && productionOverall) {
    log('🎉 EXCELLENT: Zero disruption confidence level - HIGH', 'green');
    log('   All critical endpoints are working correctly in both environments.', 'green');
    log('   You can deploy with confidence - no API disruptions expected.', 'green');
  } else if ((stagingCritical && stagingOverall) || (productionCritical && productionOverall)) {
    log('✅ GOOD: Moderate disruption confidence level', 'yellow');
    log('   Most critical endpoints are working, but some issues need attention.', 'yellow');
    log('   Review the failing endpoints before deployment.', 'yellow');
  } else {
    log('🚨 CRITICAL: High disruption risk detected', 'red');
    log('   Multiple critical endpoints are failing.', 'red');
    log('   DO NOT DEPLOY until these issues are resolved.', 'red');
  }
  
  // Deployment Confidence
  logSection('💡 Deployment Confidence Assessment');
  
  if (stagingCritical && stagingOverall) {
    log('✅ Staging Environment: READY FOR DEPLOYMENT', 'green');
    log('   Critical endpoints are healthy and ready for Vercel preview detection testing.', 'green');
  } else {
    log('❌ Staging Environment: NOT READY FOR DEPLOYMENT', 'red');
    log('   Fix critical endpoint issues before proceeding.', 'red');
  }
  
  if (productionCritical && productionOverall) {
    log('✅ Production Environment: STABLE', 'green');
    log('   Production is healthy and ready for new deployments.', 'green');
  } else {
    log('⚠️ Production Environment: NEEDS ATTENTION', 'yellow');
    log('   Some production endpoints need investigation.', 'yellow');
  }
  
  // Next Steps
  logSection('🎯 Next Steps for Zero Disruption');
  
  if (stagingCritical && stagingOverall) {
    log('1. ✅ Enable Vercel system environment variables', 'blue');
    log('2. ✅ Deploy a feature branch to test Vercel preview detection', 'blue');
    log('3. ✅ Monitor the test deployment for any issues', 'blue');
    log('4. ✅ If successful, proceed with confidence to production', 'blue');
  } else {
    log('1. ❌ Fix critical endpoint issues in staging', 'red');
    log('2. ❌ Re-run this test until all critical endpoints pass', 'red');
    log('3. ❌ Only then proceed with deployment', 'red');
  }
  
  console.log('\n' + '='.repeat(80));
  log('🏁 Actual endpoints test completed - Zero disruption validation', 'bold');
  console.log('='.repeat(80));
  
  return {
    success: stagingCritical && productionCritical && stagingOverall && productionOverall,
    staging: results.staging,
    production: results.production
  };
}

// Run tests if called directly
if (require.main === module) {
  runActualEndpointTests().catch(error => {
    log(`❌ Actual endpoints test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runActualEndpointTests,
  testActualEndpoints,
  testAuthenticationFlow,
  testCorsAndCrossOrigin,
  testEnvironmentDetection
}; 