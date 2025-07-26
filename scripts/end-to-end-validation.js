#!/usr/bin/env node

/**
 * Novara MVP End-to-End Validation Script
 * Comprehensive validation of all environmental connections and APIs
 * Following .cursorrules requirements for deployment safety
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// Environment configurations
const ENVIRONMENTS = {
  staging: {
    name: 'Staging',
    frontend: 'https://novara-c8wy65gjr-novara-fertility.vercel.app',
    backend: 'https://novara-staging-staging.up.railway.app',
    airtable: {
      baseId: 'appEOWvLjCn5c7Ght',
      apiKey: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7'
    }
  },
  production: {
    name: 'Production',
    frontend: 'https://novara-mvp.vercel.app',
    backend: 'https://novara-mvp-production.up.railway.app',
    airtable: {
      baseId: process.env.AIRTABLE_BASE_ID,
      apiKey: process.env.AIRTABLE_API_KEY
    }
  }
};

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
  console.log('\n' + '='.repeat(80));
  log(message, 'bright');
  console.log('='.repeat(80));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(50));
  log(message, 'cyan');
  console.log('-'.repeat(50));
}

function logSubSection(message) {
  console.log('\n' + '─'.repeat(40));
  log(message, 'yellow');
  console.log('─'.repeat(40));
}

// Make HTTP/HTTPS request with detailed error handling
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
        'User-Agent': 'Novara-E2E-Validation/1.0',
        ...options.headers
      },
      timeout: 15000 // 15 second timeout for comprehensive testing
    };

    const startTime = Date.now();
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({ error: error.message, duration, url });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      reject({ error: 'Request timeout', duration, url });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test Railway deployment status
async function testRailwayDeployment(environment) {
  logSubSection('Testing Railway Deployment Status');
  
  try {
    // Check Railway CLI status
    const railwayStatus = execSync('railway status', { encoding: 'utf8' });
    log('✅ Railway CLI accessible', 'green');
    
    // Parse status for environment verification
    if (railwayStatus.includes(environment)) {
      log(`✅ Railway environment: ${environment}`, 'green');
    } else {
      log(`⚠️  Railway environment mismatch: ${railwayStatus}`, 'yellow');
    }
    
    return { success: true, status: railwayStatus };
  } catch (error) {
    log(`❌ Railway CLI error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test Vercel deployment status
async function testVercelDeployment(environment) {
  logSubSection('Testing Vercel Deployment Status');
  
  try {
    // Check Vercel CLI status
    const vercelStatus = execSync('vercel ls', { encoding: 'utf8' });
    log('✅ Vercel CLI accessible', 'green');
    
    // Parse status for environment verification
    if (vercelStatus.includes(environment)) {
      log(`✅ Vercel environment: ${environment}`, 'green');
    } else {
      log(`⚠️  Vercel environment mismatch: ${vercelStatus}`, 'yellow');
    }
    
    return { success: true, status: vercelStatus };
  } catch (error) {
    log(`❌ Vercel CLI error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test backend infrastructure endpoints
async function testBackendInfrastructure(envConfig) {
  logSubSection('Testing Backend Infrastructure');
  
  const infrastructureEndpoints = [
    { path: '/api/health', name: 'Health Check', critical: true },
    { path: '/api/auth/login', name: 'Authentication Service', method: 'POST', body: { email: 'test@example.com' }, critical: true },
    { path: '/api/checkins/questions', name: 'Questions API', critical: true },
    { path: '/api/insights/daily', name: 'Daily Insights API', critical: true },
    { path: '/api/insights/micro', name: 'Micro Insights API', method: 'POST', body: { onboardingData: { email: 'test@example.com' } }, critical: true }
  ];

  const results = [];
  
  for (const endpoint of infrastructureEndpoints) {
    try {
      log(`Testing ${endpoint.name}...`, 'yellow');
      const response = await makeRequest(`${envConfig.backend}${endpoint.path}`, {
        method: endpoint.method || 'GET',
        body: endpoint.body
      });
      
      if (response.success) {
        log(`✅ ${endpoint.name}: ${response.status} (${response.duration}ms)`, 'green');
        
        // Check environment detection
        if (response.data && response.data.environment) {
          const expectedEnv = envConfig.name.toLowerCase();
          if (response.data.environment === expectedEnv) {
            log(`   Environment: ${response.data.environment} ✅`, 'green');
          } else {
            log(`   Environment: ${response.data.environment} (expected: ${expectedEnv}) ⚠️`, 'yellow');
          }
        }
        
        results.push({ 
          endpoint: endpoint.name, 
          success: true, 
          status: response.status, 
          duration: response.duration,
          critical: endpoint.critical 
        });
      } else {
        // For authenticated endpoints, 401 is expected without tokens
        if (response.status === 401 && endpoint.path.includes('/checkins') || endpoint.path.includes('/insights')) {
          log(`✅ ${endpoint.name}: ${response.status} (Authentication working - expected 401)`, 'green');
          results.push({ 
            endpoint: endpoint.name, 
            success: true, 
            status: response.status, 
            duration: response.duration,
            critical: endpoint.critical,
            note: 'Authentication working correctly'
          });
        } else {
          log(`❌ ${endpoint.name}: ${response.status}`, 'red');
          if (response.data && response.data.error) {
            log(`   Error: ${response.data.error}`, 'red');
          }
          results.push({ 
            endpoint: endpoint.name, 
            success: false, 
            status: response.status, 
            duration: response.duration,
            critical: endpoint.critical 
          });
        }
      }
    } catch (error) {
      log(`❌ ${endpoint.name}: ${error.error || error.message}`, 'red');
      results.push({ 
        endpoint: endpoint.name, 
        success: false, 
        error: error.error || error.message,
        duration: error.duration,
        critical: endpoint.critical 
      });
    }
  }
  
  return results;
}

// Test frontend infrastructure
async function testFrontendInfrastructure(envConfig) {
  logSubSection('Testing Frontend Infrastructure');
  
  try {
    log('Testing frontend accessibility...', 'yellow');
    const response = await makeRequest(envConfig.frontend);
    
    if (response.success) {
      log(`✅ Frontend accessible: ${response.status} (${response.duration}ms)`, 'green');
      
      // Check for critical frontend elements
      if (response.data && typeof response.data === 'string') {
        const hasReactApp = response.data.includes('react') || response.data.includes('Novara');
        const hasSecurityHeaders = response.headers['x-frame-options'] || response.headers['x-content-type-options'];
        
        if (hasReactApp) {
          log('   React application detected ✅', 'green');
        }
        if (hasSecurityHeaders) {
          log('   Security headers present ✅', 'green');
        }
      }
      
      return { success: true, status: response.status, duration: response.duration };
    } else {
      log(`❌ Frontend test failed: ${response.status}`, 'red');
      return { success: false, status: response.status, duration: response.duration };
    }
  } catch (error) {
    log(`❌ Frontend test failed: ${error.error || error.message}`, 'red');
    return { success: false, error: error.error || error.message, duration: error.duration };
  }
}

// Test CORS configuration comprehensively
async function testCORSConfiguration(envConfig) {
  logSubSection('Testing CORS Configuration');
  
  const testOrigins = [
    envConfig.frontend,
    'https://novara-mvp.vercel.app',
    'https://novara-mvp-git-staging-novara-fertility.vercel.app',
    'http://localhost:4200'
  ];

  const results = [];
  
  for (const origin of testOrigins) {
    try {
      const response = await makeRequest(`${envConfig.backend}/api/health`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      const corsMethods = response.headers['access-control-allow-methods'];
      const corsHeaders = response.headers['access-control-allow-headers'];
      
      if (corsHeader && (corsHeader === origin || corsHeader === '*')) {
        log(`✅ CORS for ${origin}: ${corsHeader}`, 'green');
        if (corsMethods) log(`   Methods: ${corsMethods}`, 'green');
        if (corsHeaders) log(`   Headers: ${corsHeaders}`, 'green');
        results.push({ origin, success: true, corsHeader, corsMethods, corsHeaders });
      } else {
        log(`❌ CORS for ${origin}: ${corsHeader || 'missing'}`, 'red');
        results.push({ origin, success: false, corsHeader });
      }
    } catch (error) {
      log(`❌ CORS test failed for ${origin}: ${error.error || error.message}`, 'red');
      results.push({ origin, success: false, error: error.error || error.message });
    }
  }
  
  return results;
}

// Test Airtable connectivity and schema
async function testAirtableConnectivity(envConfig) {
  logSubSection('Testing Airtable Connectivity');
  
  if (!envConfig.airtable.baseId || !envConfig.airtable.apiKey) {
    log('⚠️  Airtable credentials not configured for this environment', 'yellow');
    return { success: false, error: 'Credentials not configured' };
  }
  
  try {
    const url = `https://api.airtable.com/v0/${envConfig.airtable.baseId}/DailyCheckins?maxRecords=1`;
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Bearer ${envConfig.airtable.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.success) {
      log('✅ Airtable connection successful', 'green');
      log(`   Base ID: ${envConfig.airtable.baseId}`, 'green');
      
      // Check for CM-01 fields
      if (response.data && response.data.records && response.data.records.length > 0) {
        const fields = Object.keys(response.data.records[0].fields);
        const cm01Fields = ['sentiment', 'sentiment_confidence', 'sentiment_scores', 'journey_reflection_today'];
        const missingFields = cm01Fields.filter(field => !fields.includes(field));
        
        if (missingFields.length === 0) {
          log('   CM-01 fields present ✅', 'green');
        } else {
          log(`   Missing CM-01 fields: ${missingFields.join(', ')} ⚠️`, 'yellow');
        }
      }
      
      return { success: true, status: response.status, duration: response.duration };
    } else {
      log(`❌ Airtable connection failed: ${response.status}`, 'red');
      return { success: false, status: response.status, duration: response.duration };
    }
  } catch (error) {
    log(`❌ Airtable connection error: ${error.error || error.message}`, 'red');
    return { success: false, error: error.error || error.message, duration: error.duration };
  }
}

// Test performance metrics
async function testPerformanceMetrics(envConfig) {
  logSubSection('Testing Performance Metrics');
  
  const performanceTests = [
    { path: '/api/health', name: 'Health Check Performance' },
    { path: '/api/auth/login', name: 'Auth Performance', method: 'POST', body: { email: 'test@example.com' } }
  ];

  const results = [];
  
  for (const test of performanceTests) {
    try {
      const response = await makeRequest(`${envConfig.backend}${test.path}`, {
        method: test.method || 'GET',
        body: test.body
      });
      
      if (response.success) {
        const performance = response.duration < 1000 ? 'excellent' : 
                          response.duration < 2000 ? 'good' : 
                          response.duration < 5000 ? 'acceptable' : 'poor';
        
        const color = performance === 'excellent' ? 'green' : 
                     performance === 'good' ? 'green' : 
                     performance === 'acceptable' ? 'yellow' : 'red';
        
        log(`✅ ${test.name}: ${response.duration}ms (${performance})`, color);
        results.push({ 
          test: test.name, 
          success: true, 
          duration: response.duration, 
          performance 
        });
      } else {
        log(`❌ ${test.name}: Failed`, 'red');
        results.push({ test: test.name, success: false });
      }
    } catch (error) {
      log(`❌ ${test.name}: ${error.error || error.message}`, 'red');
      results.push({ test: test.name, success: false, error: error.error || error.message });
    }
  }
  
  return results;
}

// Generate comprehensive validation report
function generateValidationReport(environment, results) {
  logHeader(`${environment.name} Environment - End-to-End Validation Report`);
  
  const allTests = [
    ...results.railway.map(r => ({ ...r, category: 'Railway' })),
    ...results.vercel.map(r => ({ ...r, category: 'Vercel' })),
    ...results.backend.map(r => ({ ...r, category: 'Backend' })),
    ...results.frontend.map(r => ({ ...r, category: 'Frontend' })),
    ...results.cors.map(r => ({ ...r, category: 'CORS' })),
    ...results.airtable.map(r => ({ ...r, category: 'Airtable' })),
    ...results.performance.map(r => ({ ...r, category: 'Performance' }))
  ];
  
  const totalTests = allTests.length;
  const passedTests = allTests.filter(r => r.success).length;
  const criticalTests = allTests.filter(r => r.critical && r.success).length;
  const totalCritical = allTests.filter(r => r.critical).length;
  
  log(`\n${colors.green}✅ OVERALL: ${passedTests}/${totalTests} tests passed${colors.reset}`);
  log(`${colors.blue}🔧 CRITICAL: ${criticalTests}/${totalCritical} critical tests passed${colors.reset}`);
  
  if (passedTests === totalTests && criticalTests === totalCritical) {
    log('\n🎉 ALL TESTS PASSED - ENVIRONMENT FULLY OPERATIONAL!', 'green');
  } else if (criticalTests === totalCritical) {
    log('\n⚠️  CRITICAL TESTS PASSED - Some non-critical issues detected', 'yellow');
  } else {
    log('\n❌ CRITICAL ISSUES DETECTED - Environment needs attention', 'red');
  }
  
  log('\n' + '='.repeat(80));
  log('Detailed Results by Category:', 'bright');
  
  // Group by category
  const categories = ['Railway', 'Vercel', 'Backend', 'Frontend', 'CORS', 'Airtable', 'Performance'];
  
  categories.forEach(category => {
    const categoryTests = allTests.filter(t => t.category === category);
    if (categoryTests.length > 0) {
      log(`\n${category}:`, 'cyan');
      categoryTests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        const critical = test.critical ? ' [CRITICAL]' : '';
        const duration = test.duration ? ` (${test.duration}ms)` : '';
        const note = test.note ? ` - ${test.note}` : '';
        log(`  ${status} ${test.endpoint || test.test || test.origin || 'Status'}: ${test.status || test.error || 'OK'}${duration}${critical}${note}`);
      });
    }
  });
  
  return {
    totalTests,
    passedTests,
    criticalTests,
    totalCritical,
    allPassed: passedTests === totalTests,
    criticalPassed: criticalTests === totalCritical
  };
}

// Main validation function
async function validateEnvironment(envKey) {
  const envConfig = ENVIRONMENTS[envKey];
  if (!envConfig) {
    log(`❌ Unknown environment: ${envKey}`, 'red');
    process.exit(1);
  }
  
  logHeader(`Starting End-to-End Validation for ${envConfig.name}`);
  log(`Frontend: ${envConfig.frontend}`, 'blue');
  log(`Backend: ${envConfig.backend}`, 'blue');
  
  const results = {
    railway: [],
    vercel: [],
    backend: [],
    frontend: [],
    cors: [],
    airtable: [],
    performance: []
  };
  
  try {
    // Test deployment platforms
    results.railway = [await testRailwayDeployment(envKey)];
    results.vercel = [await testVercelDeployment(envKey)];
    
    // Test infrastructure
    results.backend = await testBackendInfrastructure(envConfig);
    results.frontend = [await testFrontendInfrastructure(envConfig)];
    results.cors = await testCORSConfiguration(envConfig);
    results.airtable = [await testAirtableConnectivity(envConfig)];
    results.performance = await testPerformanceMetrics(envConfig);
    
    // Generate report
    const report = generateValidationReport(envConfig, results);
    
    return report;
    
  } catch (error) {
    log(`\n❌ Validation failed: ${error.message}`, 'red');
    return { error: error.message };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'staging';
  
  if (!ENVIRONMENTS[environment]) {
    log(`❌ Invalid environment. Use: staging or production`, 'red');
    process.exit(1);
  }
  
  logHeader('Novara MVP End-to-End Validation');
  log(`Following .cursorrules requirements for deployment safety`, 'blue');
  log(`Environment: ${environment}`, 'blue');
  
  const report = await validateEnvironment(environment);
  
  if (report.error) {
    process.exit(1);
  }
  
  if (report.allPassed && report.criticalPassed) {
    log('\n🚀 Environment is ready for deployment!', 'green');
    process.exit(0);
  } else if (report.criticalPassed) {
    log('\n⚠️  Environment has issues but critical systems are operational', 'yellow');
    process.exit(0);
  } else {
    log('\n❌ Critical issues detected - deployment blocked', 'red');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, ENVIRONMENTS }; 