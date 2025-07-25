#!/usr/bin/env node

/**
 * Quick Vercel Preview Detection Test
 * Focuses on core functionality validation
 */

const https = require('https');
const http = require('http');

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
      timeout: 10000,
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

// Test core functionality
async function testCoreFunctionality() {
  logSection('🚀 Quick Vercel Preview Detection Test');
  log(`Testing core functionality - ${new Date().toISOString()}`, 'blue');
  
  const testResults = {
    stagingBackend: false,
    productionBackend: false,
    stagingFrontend: false,
    productionFrontend: false,
    environmentFile: false
  };
  
  // Test staging backend
  try {
    log('Testing staging backend...', 'blue');
    const stagingResponse = await makeRequest('https://novara-staging-staging.up.railway.app/api/health');
    if (stagingResponse.statusCode === 200) {
      log('✅ Staging backend: Healthy', 'green');
      testResults.stagingBackend = true;
    } else {
      log('❌ Staging backend: Unhealthy', 'red');
    }
  } catch (error) {
    log('❌ Staging backend: Error', 'red');
  }
  
  // Test production backend
  try {
    log('Testing production backend...', 'blue');
    const productionResponse = await makeRequest('https://novara-mvp-production.up.railway.app/api/health');
    if (productionResponse.statusCode === 200) {
      log('✅ Production backend: Healthy', 'green');
      testResults.productionBackend = true;
    } else {
      log('❌ Production backend: Unhealthy', 'red');
    }
  } catch (error) {
    log('❌ Production backend: Error', 'red');
  }
  
  // Test staging frontend
  try {
    log('Testing staging frontend...', 'blue');
    const stagingFrontendResponse = await makeRequest('https://novara-staging-staging.up.railway.app');
    if (stagingFrontendResponse.statusCode === 200) {
      log('✅ Staging frontend: Accessible', 'green');
      testResults.stagingFrontend = true;
    } else {
      log('❌ Staging frontend: Error', 'red');
    }
  } catch (error) {
    log('❌ Staging frontend: Error', 'red');
  }
  
  // Test production frontend
  try {
    log('Testing production frontend...', 'blue');
    const productionFrontendResponse = await makeRequest('https://novara-mvp.vercel.app');
    if (productionFrontendResponse.statusCode === 200) {
      log('✅ Production frontend: Accessible', 'green');
      testResults.productionFrontend = true;
    } else {
      log('❌ Production frontend: Error', 'red');
    }
  } catch (error) {
    log('❌ Production frontend: Error', 'red');
  }
  
  // Test environment file
  try {
    const fs = require('fs');
    const path = require('path');
    const envFilePath = path.join(__dirname, '..', 'frontend', 'src', 'lib', 'environment.ts');
    
    if (fs.existsSync(envFilePath)) {
      const content = fs.readFileSync(envFilePath, 'utf8');
      const hasPreviewDetection = content.includes('VITE_VERCEL_ENV') && content.includes("case 'preview'");
      
      if (hasPreviewDetection) {
        log('✅ Environment file: Preview detection implemented', 'green');
        testResults.environmentFile = true;
      } else {
        log('❌ Environment file: Preview detection missing', 'red');
      }
    } else {
      log('❌ Environment file: Not found', 'red');
    }
  } catch (error) {
    log('❌ Environment file: Error checking', 'red');
  }
  
  // Summary
  logSection('📊 Quick Test Results');
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const percentage = (passedTests / totalTests) * 100;
  
  log(`Tests Passed: ${passedTests}/${totalTests} (${percentage.toFixed(1)}%)`, 
      percentage > 80 ? 'green' : percentage > 60 ? 'yellow' : 'red');
  
  // Assessment
  logSection('🎯 Assessment');
  
  if (percentage >= 80) {
    log('🎉 EXCELLENT: Core functionality is working!', 'green');
    log('   Vercel preview detection is ready for testing.', 'green');
  } else if (percentage >= 60) {
    log('✅ GOOD: Most core functionality is working.', 'yellow');
    log('   Some components need attention but the system is functional.', 'yellow');
  } else {
    log('⚠️ ATTENTION: Core functionality has issues.', 'red');
    log('   Review the failing components before proceeding.', 'red');
  }
  
  // Next Steps
  logSection('🎯 Next Steps');
  
  if (testResults.stagingBackend && testResults.stagingFrontend) {
    log('✅ Ready to test Vercel preview detection:', 'green');
    log('   1. Enable Vercel system environment variables', 'blue');
    log('   2. Deploy a feature branch to test preview detection', 'blue');
    log('   3. Check browser console for environment logs', 'blue');
  } else {
    log('❌ Fix staging environment issues first:', 'red');
    log('   1. Ensure staging backend is healthy', 'blue');
    log('   2. Ensure staging frontend is accessible', 'blue');
    log('   3. Then test Vercel preview detection', 'blue');
  }
  
  console.log('\n' + '='.repeat(60));
  log('🏁 Quick test completed', 'bold');
  console.log('='.repeat(60));
  
  return {
    success: percentage >= 80,
    percentage: percentage,
    results: testResults
  };
}

// Run test if called directly
if (require.main === module) {
  testCoreFunctionality().catch(error => {
    log(`❌ Quick test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testCoreFunctionality
}; 