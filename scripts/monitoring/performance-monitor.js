#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors application performance and generates reports
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  environments: {
    staging: {
      backend: 'https://novara-staging-staging.up.railway.app',
      frontend: 'https://novara-mvp-git-staging-novara-fertility.vercel.app'
    },
    production: {
      backend: 'https://novara-mvp-production.up.railway.app',
      frontend: 'https://novara-mvp.vercel.app'
    }
  },
  endpoints: [
    '/api/health',
    '/api/auth/login',
    '/api/users',
    '/api/checkins/questions',
    '/api/checkins/daily',
    '/api/insights/daily'
  ],
  thresholds: {
    responseTime: 1000, // 1 second
    errorRate: 0.05, // 5%
    availability: 0.99 // 99%
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
  log('\n' + '='.repeat(60), 'blue');
  log(message, 'bright');
  log('='.repeat(60), 'blue');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'cyan');
  log(message, 'cyan');
  log('-'.repeat(40), 'cyan');
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          duration: duration,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - start;
      reject({
        error: error,
        duration: duration,
        url: url
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        error: new Error('Request timeout'),
        duration: 10000,
        url: url
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Performance test for a single endpoint
async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  const results = [];
  
  // Test endpoint multiple times
  for (let i = 0; i < 5; i++) {
    try {
      const result = await makeRequest(url);
      results.push(result);
    } catch (error) {
      results.push(error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate metrics
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  const avgResponseTime = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
    : 0;
    
  const errorRate = results.length > 0 ? failed.length / results.length : 0;
  const availability = 1 - errorRate;
  
  return {
    endpoint,
    url,
    totalRequests: results.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    avgResponseTime,
    errorRate,
    availability,
    results
  };
}

// Test all endpoints for an environment
async function testEnvironment(envName, envConfig) {
  logHeader(`Testing ${envName.toUpperCase()} Environment`);
  
  const results = {
    environment: envName,
    timestamp: new Date().toISOString(),
    backend: {},
    frontend: {},
    summary: {}
  };
  
  // Test backend endpoints
  logSection('Testing Backend Endpoints');
  for (const endpoint of config.endpoints) {
    log(`Testing ${endpoint}...`, 'blue');
    const result = await testEndpoint(envConfig.backend, endpoint);
    results.backend[endpoint] = result;
    
    const status = result.availability >= config.thresholds.availability ? '✅' : '❌';
    const responseTime = result.avgResponseTime <= config.thresholds.responseTime ? '✅' : '⚠️';
    
    log(`  ${status} Availability: ${(result.availability * 100).toFixed(1)}%`);
    log(`  ${responseTime} Avg Response Time: ${result.avgResponseTime}ms`);
    log(`  📊 Total Requests: ${result.totalRequests}, Success: ${result.successfulRequests}, Failed: ${result.failedRequests}`);
  }
  
  // Test frontend
  logSection('Testing Frontend');
  try {
    const frontendResult = await makeRequest(envConfig.frontend);
    results.frontend = {
      statusCode: frontendResult.statusCode,
      responseTime: frontendResult.duration,
      available: frontendResult.statusCode === 200
    };
    
    const status = frontendResult.statusCode === 200 ? '✅' : '❌';
    log(`${status} Frontend Status: ${frontendResult.statusCode}`);
    log(`⏱️  Response Time: ${frontendResult.duration}ms`);
  } catch (error) {
    results.frontend = {
      error: error.message,
      available: false
    };
    log(`❌ Frontend Error: ${error.message}`, 'red');
  }
  
  // Calculate summary
  const backendEndpoints = Object.values(results.backend);
  const totalBackendRequests = backendEndpoints.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalBackendSuccess = backendEndpoints.reduce((sum, r) => sum + r.successfulRequests, 0);
  const avgBackendResponseTime = backendEndpoints.reduce((sum, r) => sum + r.avgResponseTime, 0) / backendEndpoints.length;
  
  results.summary = {
    backendAvailability: totalBackendRequests > 0 ? totalBackendSuccess / totalBackendRequests : 0,
    avgBackendResponseTime,
    frontendAvailable: results.frontend.available,
    overallHealth: 'healthy'
  };
  
  // Determine overall health
  if (results.summary.backendAvailability < config.thresholds.availability || 
      !results.summary.frontendAvailable ||
      results.summary.avgBackendResponseTime > config.thresholds.responseTime) {
    results.summary.overallHealth = 'degraded';
  }
  
  logSection('Environment Summary');
  log(`🏥 Overall Health: ${results.summary.overallHealth === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}`);
  log(`📊 Backend Availability: ${(results.summary.backendAvailability * 100).toFixed(1)}%`);
  log(`⏱️  Avg Backend Response Time: ${results.summary.avgBackendResponseTime.toFixed(0)}ms`);
  log(`🌐 Frontend Available: ${results.summary.frontendAvailable ? '✅ Yes' : '❌ No'}`);
  
  return results;
}

// Generate performance report
function generateReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      environments: Object.keys(allResults).length,
      totalEndpoints: config.endpoints.length,
      overallHealth: 'healthy'
    },
    environments: allResults,
    recommendations: []
  };
  
  // Analyze results and generate recommendations
  for (const [envName, envResults] of Object.entries(allResults)) {
    if (envResults.summary.overallHealth === 'degraded') {
      report.summary.overallHealth = 'degraded';
      report.recommendations.push(`${envName}: Environment shows degraded performance`);
    }
    
    if (envResults.summary.avgBackendResponseTime > config.thresholds.responseTime) {
      report.recommendations.push(`${envName}: Backend response times are slow (${envResults.summary.avgBackendResponseTime.toFixed(0)}ms)`);
    }
    
    if (envResults.summary.backendAvailability < config.thresholds.availability) {
      report.recommendations.push(`${envName}: Backend availability is below threshold (${(envResults.summary.backendAvailability * 100).toFixed(1)}%)`);
    }
    
    if (!envResults.summary.frontendAvailable) {
      report.recommendations.push(`${envName}: Frontend is not accessible`);
    }
  }
  
  return report;
}

// Save report to file
function saveReport(report) {
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(reportsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  log(`📄 Report saved to: ${filepath}`, 'green');
}

// Main function
async function main() {
  logHeader('Novara Performance Monitor');
  
  const allResults = {};
  
  // Test all environments
  for (const [envName, envConfig] of Object.entries(config.environments)) {
    try {
      allResults[envName] = await testEnvironment(envName, envConfig);
    } catch (error) {
      log(`❌ Error testing ${envName}: ${error.message}`, 'red');
    }
  }
  
  // Generate and save report
  const report = generateReport(allResults);
  saveReport(report);
  
  // Final summary
  logHeader('Final Summary');
  log(`🏥 Overall Health: ${report.summary.overallHealth === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}`);
  log(`🌍 Environments Tested: ${report.summary.environments}`);
  log(`🔗 Endpoints Tested: ${report.summary.totalEndpoints}`);
  
  if (report.recommendations.length > 0) {
    logSection('Recommendations');
    report.recommendations.forEach(rec => log(`• ${rec}`, 'yellow'));
  } else {
    log('✅ No issues detected - all systems performing well!', 'green');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`❌ Performance monitoring failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testEnvironment,
  generateReport,
  config
}; 