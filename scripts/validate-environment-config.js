#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates all environment URLs and configurations before deployment
 */

const { ENVIRONMENTS } = require('./environment-config');
const https = require('https');
const http = require('http');

// HTTP request utility
function makeRequest(url, timeout = 5000) {
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
        'User-Agent': 'Novara-Config-Validator/1.0'
      },
      timeout: timeout
    };
    
    const req = client.request(requestOptions, (res) => {
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
    
    req.on('error', (error) => reject(error));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Validate environment configuration
async function validateEnvironment(envName, config) {
  console.log(`\n🔍 Validating ${envName} environment...`);
  
  const issues = [];
  
  // Check backend health
  try {
    console.log(`   Backend: ${config.backend}`);
    const backendResponse = await makeRequest(`${config.backend}/api/health`);
    
    if (backendResponse.statusCode === 200) {
      console.log(`   ✅ Backend: Healthy (${backendResponse.statusCode})`);
      
      // Parse health data
      try {
        const healthData = JSON.parse(backendResponse.data);
        if (healthData.environment !== envName) {
          issues.push(`Backend environment mismatch: expected ${envName}, got ${healthData.environment}`);
        }
      } catch (parseError) {
        issues.push('Backend health response is not valid JSON');
      }
    } else {
      issues.push(`Backend unhealthy: HTTP ${backendResponse.statusCode}`);
    }
  } catch (error) {
    issues.push(`Backend unreachable: ${error.message}`);
  }
  
  // Check frontend accessibility (skip for development and staging due to dynamic URLs)
  if (envName !== 'development' && envName !== 'staging') {
    try {
      console.log(`   Frontend: ${config.frontend}`);
      const frontendResponse = await makeRequest(config.frontend);
      
      if (frontendResponse.statusCode === 200) {
        console.log(`   ✅ Frontend: Accessible (${frontendResponse.statusCode})`);
      } else {
        issues.push(`Frontend inaccessible: HTTP ${frontendResponse.statusCode}`);
      }
    } catch (error) {
      issues.push(`Frontend unreachable: ${error.message}`);
    }
  } else if (envName === 'staging') {
    console.log(`   ⚠️  Frontend: Skipping validation (dynamic staging URL)`);
  }
  
  // Validate URL format
  const urlValidation = {
    backend: new URL(config.backend),
    frontend: new URL(config.frontend),
    healthUrl: new URL(config.healthUrl)
  };
  
  // Check that health URL matches backend
  if (urlValidation.healthUrl.hostname !== urlValidation.backend.hostname) {
    issues.push('Health URL hostname does not match backend URL');
  }
  
  return {
    environment: envName,
    config: config,
    issues: issues,
    valid: issues.length === 0
  };
}

// Main validation function
async function validateAllEnvironments() {
  console.log('🛡️  Environment Configuration Validator');
  console.log('=====================================');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const results = {};
  let hasIssues = false;
  
  // Skip development environment in CI/CD contexts
  const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
  const environmentsToValidate = isCI 
    ? Object.entries(ENVIRONMENTS).filter(([envName]) => envName !== 'development')
    : Object.entries(ENVIRONMENTS);
  
  if (isCI) {
    console.log('🔧 CI/CD detected - skipping development environment validation');
  }
  
  // Validate each environment
  for (const [envName, config] of environmentsToValidate) {
    results[envName] = await validateEnvironment(envName, config);
    
    if (results[envName].issues.length > 0) {
      hasIssues = true;
      console.log(`   ❌ Issues found:`);
      results[envName].issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    } else {
      console.log(`   ✅ All checks passed`);
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('=====================');
  
  Object.entries(results).forEach(([env, result]) => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${env}: ${result.valid ? 'Valid' : `${result.issues.length} issues`}`);
  });
  
  if (hasIssues) {
    console.log('\n🚨 Environment configuration issues detected!');
    console.log('Please fix these issues before deploying.');
    process.exit(1);
  } else {
    console.log('\n🎉 All environment configurations are valid!');
    process.exit(0);
  }
}

// CLI usage
if (require.main === module) {
  validateAllEnvironments().catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  validateEnvironment,
  validateAllEnvironments
}; 