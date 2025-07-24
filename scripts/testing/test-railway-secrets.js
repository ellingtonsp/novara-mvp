#!/usr/bin/env node

/**
 * Test Railway Secrets
 * Simple script to verify Railway credentials are working
 */

const https = require('https');

// Configuration
const CONFIG = {
  railway: {
    projectId: process.env.RAILWAY_PROJECT_ID,
    token: process.env.RAILWAY_TOKEN
  },
  healthUrls: {
    production: 'https://novara-mvp-production.up.railway.app/api/health',
    staging: 'https://novara-mvp-staging.up.railway.app/api/health'
  }
};

// Log function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

// Test Railway API access
async function testRailwayAPI() {
  log('Testing Railway API access...');
  
  if (!CONFIG.railway.token || !CONFIG.railway.projectId) {
    log('Railway credentials not configured', 'ERROR');
    return false;
  }
  
  try {
    const query = `
      query {
        project(id: "${CONFIG.railway.projectId}") {
          id
          name
        }
      }
    `;
    
    const response = await new Promise((resolve, reject) => {
      const urlObj = new URL('https://backboard.railway.app/graphql/v2');
      
      const req = https.request({
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.railway.token}`
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(JSON.stringify({ query }));
      req.end();
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      if (data.data?.project) {
        log(`✅ Railway API access successful - Project: ${data.data.project.name}`, 'SUCCESS');
        return true;
      } else {
        log('❌ Railway API returned no project data', 'ERROR');
        return false;
      }
    } else {
      log(`❌ Railway API error: HTTP ${response.statusCode}`, 'ERROR');
      return false;
    }
  } catch (error) {
    log(`❌ Railway API request failed: ${error.message}`, 'ERROR');
    return false;
  }
}

// Test health endpoints
async function testHealthEndpoints() {
  log('Testing health endpoints...');
  
  const results = {};
  
  for (const [environment, url] of Object.entries(CONFIG.healthUrls)) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Health check timeout'));
        });
      });
      
      results[environment] = {
        healthy: response.statusCode === 200,
        statusCode: response.statusCode,
        data: response.data
      };
      
      if (response.statusCode === 200) {
        log(`✅ ${environment} health check passed`, 'SUCCESS');
      } else {
        log(`❌ ${environment} health check failed: HTTP ${response.statusCode}`, 'WARN');
      }
    } catch (error) {
      results[environment] = {
        healthy: false,
        error: error.message
      };
      log(`❌ ${environment} health check failed: ${error.message}`, 'WARN');
    }
  }
  
  return results;
}

// Main test function
async function runTests() {
  log('🚀 Starting Railway Secrets Test');
  log('='.repeat(50));
  
  // Test 1: Railway API access
  const apiSuccess = await testRailwayAPI();
  
  // Test 2: Health endpoints
  const healthResults = await testHealthEndpoints();
  
  // Summary
  log('='.repeat(50));
  log('📊 Test Results Summary:');
  log(`Railway API Access: ${apiSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  for (const [env, result] of Object.entries(healthResults)) {
    log(`${env} Health: ${result.healthy ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  // Overall result
  const allHealthy = Object.values(healthResults).every(r => r.healthy);
  const overallSuccess = apiSuccess && allHealthy;
  
  log('='.repeat(50));
  log(`Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  // Exit with appropriate code for GitHub Actions
  if (overallSuccess) {
    log('🎉 Railway secrets are working correctly!', 'SUCCESS');
    process.exit(0);
  } else {
    log('⚠️ Some tests failed - check configuration', 'WARN');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`Test execution failed: ${error.message}`, 'ERROR');
  process.exit(1);
}); 