#!/usr/bin/env node

/**
 * Quick Health Check Script
 * Immediately test deployment health after Railway deployment
 */

const https = require('https');
const http = require('http');

// Import environment configuration
const { ENVIRONMENTS } = require('./environment-config');

// Map to expected format
const ENVIRONMENT_URLS = {
  production: ENVIRONMENTS.production.backend,
  staging: ENVIRONMENTS.staging.backend
};

// HTTP request utility
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Novara-Quick-Health-Check/1.0'
      },
      timeout: timeout
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
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
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test environment health
async function testEnvironment(envName, baseUrl) {
  console.log(`\n🔍 Testing ${envName} environment...`);
  console.log(`   URL: ${baseUrl}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${baseUrl}/api/health`);
    const responseTime = Date.now() - startTime;
    
    console.log(`   ✅ Status: HTTP ${response.statusCode}`);
    console.log(`   ⏱️  Response Time: ${responseTime}ms`);
    
    if (response.statusCode === 200) {
      try {
        const healthData = JSON.parse(response.data);
        console.log(`   📊 Health Data:`);
        console.log(`      - Status: ${healthData.status}`);
        console.log(`      - Environment: ${healthData.environment}`);
        console.log(`      - Service: ${healthData.service}`);
        console.log(`      - Version: ${healthData.version}`);
        console.log(`      - Airtable: ${healthData.airtable}`);
        console.log(`      - JWT: ${healthData.jwt}`);
        
        if (healthData.note) {
          console.log(`      - Note: ${healthData.note}`);
        }
        
        return { healthy: true, data: healthData };
      } catch (parseError) {
        console.log(`   ⚠️  Response is not valid JSON: ${response.data.substring(0, 100)}...`);
        return { healthy: false, error: 'Invalid JSON response' };
      }
    } else {
      console.log(`   ❌ Unexpected status code: ${response.statusCode}`);
      console.log(`   📄 Response: ${response.data.substring(0, 200)}...`);
      return { healthy: false, error: `HTTP ${response.statusCode}` };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { healthy: false, error: error.message };
  }
}

// Main function
async function runQuickHealthCheck() {
  console.log('🚀 Novara Quick Health Check');
  console.log('============================');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const results = {};
  
  // Test production
  results.production = await testEnvironment('Production', ENVIRONMENT_URLS.production);
  
  // Test staging
  results.staging = await testEnvironment('Staging', ENVIRONMENT_URLS.staging);
  
  // Summary
  console.log('\n📊 Health Check Summary:');
  console.log('========================');
  
  const healthyCount = Object.values(results).filter(r => r.healthy).length;
  const totalCount = Object.keys(results).length;
  
  Object.entries(results).forEach(([env, result]) => {
    const status = result.healthy ? '✅' : '❌';
    console.log(`${status} ${env}: ${result.healthy ? 'Healthy' : result.error}`);
  });
  
  console.log(`\n🎯 Overall: ${healthyCount}/${totalCount} environments healthy`);
  
  if (healthyCount === totalCount) {
    console.log('🎉 All environments are healthy!');
    process.exit(0);
  } else {
    console.log('⚠️  Some environments have issues. Check the details above.');
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'production':
      testEnvironment('Production', ENVIRONMENT_URLS.production);
      break;
      
    case 'staging':
      testEnvironment('Staging', ENVIRONMENT_URLS.staging);
      break;
      
    case 'all':
    case undefined:
      runQuickHealthCheck();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/quick-health-check.js [all|production|staging]');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/quick-health-check.js          # Check all environments');
      console.log('  node scripts/quick-health-check.js production # Check production only');
      console.log('  node scripts/quick-health-check.js staging   # Check staging only');
      break;
  }
}

module.exports = {
  testEnvironment,
  runQuickHealthCheck
}; 