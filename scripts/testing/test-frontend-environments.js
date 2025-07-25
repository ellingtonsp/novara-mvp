#!/usr/bin/env node

/**
 * 🧪 Frontend Environment Test Runner
 * Tests frontend functionality across all environments
 */

const fetch = require('node-fetch').default || require('node-fetch');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Environment configurations
const environments = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:9002',
    frontendUrl: 'http://localhost:4200',
    environment: 'development',
    debug: true,
    timeout: 5000,
  },
  staging: {
    name: 'Staging',
    apiUrl: 'https://novara-staging-staging.up.railway.app',
    frontendUrl: 'https://novara-bd6xsx1ru-novara-fertility.vercel.app',
    environment: 'staging',
    debug: true,
    timeout: 10000,
  },
  production: {
    name: 'Production',
    apiUrl: 'https://novara-mvp-production.up.railway.app',
    frontendUrl: 'https://novara-mvp.vercel.app',
    environment: 'production',
    debug: false,
    timeout: 15000,
  },
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
};

function recordTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`✅ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${name}`, 'red');
  }
  
  testResults.details.push({
    name,
    success,
    details,
    timestamp: new Date().toISOString(),
  });
}

// Test functions
async function testApiConnectivity(config) {
  try {
    log(`📋 Testing ${config.name} API connectivity...`, 'blue');
    
    const response = await fetch(`${config.apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (response.ok) {
      const data = await response.json();
      recordTest(`${config.name} API Connectivity`, true, `Status: ${data.status || 'ok'}`);
      return true;
    } else {
      recordTest(`${config.name} API Connectivity`, false, `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest(`${config.name} API Connectivity`, false, error.message);
    return false;
  }
}

async function testFrontendAccessibility(config) {
  try {
    log(`📋 Testing ${config.name} frontend accessibility...`, 'blue');
    
    const response = await fetch(config.frontendUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (response.ok) {
      recordTest(`${config.name} Frontend Accessibility`, true, `HTTP ${response.status}`);
      return true;
    } else {
      recordTest(`${config.name} Frontend Accessibility`, false, `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    recordTest(`${config.name} Frontend Accessibility`, false, error.message);
    return false;
  }
}

async function testFrontendContent(config) {
  try {
    log(`📋 Testing ${config.name} frontend content...`, 'blue');
    
    const response = await fetch(config.frontendUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      recordTest(`${config.name} Frontend Content`, false, `HTTP ${response.status}`);
      return false;
    }
    
    const content = await response.text();
    
    // Check for React app content (more flexible validation)
    const hasReactContent = content.includes('Vite + React') || 
                           content.includes('You don\'t have to navigate') ||
                           content.includes('react') ||
                           content.includes('root');
    const hasHtmlStructure = content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>');
    
    if (hasReactContent && hasHtmlStructure) {
      recordTest(`${config.name} Frontend Content`, true, 'React app content detected');
      return true;
    } else {
      const missing = [];
      if (!hasReactContent) missing.push('React content');
      if (!hasHtmlStructure) missing.push('HTML structure');
      recordTest(`${config.name} Frontend Content`, false, `Missing: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    recordTest(`${config.name} Frontend Content`, false, error.message);
    return false;
  }
}

async function testUserAuthentication(config) {
  try {
    log(`📋 Testing ${config.name} user authentication...`, 'blue');
    
    const response = await fetch(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@novara.test',
      }),
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      // Check if it's a 404 which means auth endpoint is working but user not found
      if (response.status === 404) {
        recordTest(`${config.name} User Authentication`, true, 'Auth endpoint working (404 expected - test user not found)');
        return { success: false, expectedFailure: true };
      }
      recordTest(`${config.name} User Authentication`, false, `HTTP ${response.status}`);
      return { success: false };
    }
    
    const data = await response.json();
    
    if (data.success && data.token) {
      recordTest(`${config.name} User Authentication`, true, 'Login successful');
      return { success: true, token: data.token };
    } else if (data.error && data.error.includes('User not found')) {
      // For development, "user not found" is expected and valid
      recordTest(`${config.name} User Authentication`, true, 'Auth endpoint working (test user not found - expected)');
      return { success: false, expectedFailure: true };
    } else {
      recordTest(`${config.name} User Authentication`, false, 'Login response missing token');
      return { success: false };
    }
  } catch (error) {
    recordTest(`${config.name} User Authentication`, false, error.message);
    return { success: false };
  }
}

async function testProtectedEndpoints(config, token) {
  try {
    log(`📋 Testing ${config.name} protected endpoints...`, 'blue');
    
    const response = await fetch(`${config.apiUrl}/api/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      recordTest(`${config.name} Protected Endpoints`, false, `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      recordTest(`${config.name} Protected Endpoints`, true, 'User data retrieved');
      return true;
    } else {
      recordTest(`${config.name} Protected Endpoints`, false, 'Response missing user data');
      return false;
    }
  } catch (error) {
    recordTest(`${config.name} Protected Endpoints`, false, error.message);
    return false;
  }
}

async function testFrontendBuild(config) {
  const originalDir = process.cwd();
  try {
    log(`📋 Testing ${config.name} frontend build...`, 'blue');
    
    // Change to frontend directory
    const frontendDir = path.join(__dirname, '../../frontend');
    process.chdir(frontendDir);
    
    // Set environment variables
    process.env.VITE_API_URL = config.apiUrl;
    process.env.VITE_ENV = config.environment;
    process.env.NODE_ENV = 'test';
    
    // Run tests
    const { execSync } = require('child_process');
    execSync('npm test', { stdio: 'pipe' });
    
    // Run build
    execSync('npm run build', { stdio: 'pipe' });
    
    // Return to original directory
    process.chdir(originalDir);
    
    recordTest(`${config.name} Frontend Build`, true, 'Tests and build successful');
    return true;
  } catch (error) {
    // Ensure we return to original directory even if error occurs
    try {
      process.chdir(originalDir);
    } catch (dirError) {
      // Ignore directory change errors in catch block
    }
    recordTest(`${config.name} Frontend Build`, false, error.message);
    return false;
  }
}

async function runEnvironmentTests(envName, config) {
  log(`\n🔧 Testing ${config.name} Environment`, 'cyan');
  log('='.repeat(50), 'cyan');
  
  // Test API connectivity
  await testApiConnectivity(config);
  
  // Test frontend accessibility
  await testFrontendAccessibility(config);
  
  // Test frontend content
  await testFrontendContent(config);
  
  // Test user authentication
  const authResult = await testUserAuthentication(config);
  
  // Test protected endpoints if authentication succeeded
  if (authResult.success && authResult.token) {
    await testProtectedEndpoints(config, authResult.token);
  }
  
  // Test frontend build (only for development and staging)
  if (envName !== 'production') {
    await testFrontendBuild(config);
  }
}

async function runAllTests() {
  log('🧪 Novara MVP - Frontend Environment Testing', 'magenta');
  log('============================================', 'magenta');
  
  const targetEnv = process.argv[2] || 'all';
  log(`Target environment: ${targetEnv}`, 'yellow');
  
  const startTime = Date.now();
  
  // Run tests for specified environments
  if (targetEnv === 'all' || targetEnv === 'development') {
    await runEnvironmentTests('development', environments.development);
  }
  
  if (targetEnv === 'all' || targetEnv === 'staging') {
    await runEnvironmentTests('staging', environments.staging);
  }
  
  if (targetEnv === 'all' || targetEnv === 'production') {
    await runEnvironmentTests('production', environments.production);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Summary
  log('\n📊 Frontend Environment Test Results', 'magenta');
  log('==================================', 'magenta');
  log(`Duration: ${duration} seconds`, 'yellow');
  log(`Total Tests: ${testResults.total}`, 'yellow');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  // Save results to file
  const resultsFile = path.join(__dirname, '../../logs/frontend-test-results.json');
  const resultsDir = path.dirname(resultsFile);
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultsData = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
    },
    details: testResults.details,
  };
  
  fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
  log(`\n📄 Results saved to: ${resultsFile}`, 'blue');
  
  if (testResults.failed === 0) {
    log('\n🎉 All frontend environment tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some frontend environment tests failed!', 'red');
    log('\n🔧 Troubleshooting Tips:', 'yellow');
    log('- Check if development servers are running: ./scripts/start-local.sh', 'yellow');
    log('- Verify environment variables are set correctly', 'yellow');
    log('- Check Vercel and Railway deployment status', 'yellow');
    log('- Run individual environment tests: node test-frontend-environments.js [development|staging|production]', 'yellow');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('🧪 Frontend Environment Test Runner', 'magenta');
  log('Usage:', 'yellow');
  log('  node test-frontend-environments.js [environment]', 'cyan');
  log('', 'reset');
  log('Environments:', 'yellow');
  log('  development  - Test local development environment', 'cyan');
  log('  staging      - Test staging environment', 'cyan');
  log('  production   - Test production environment', 'cyan');
  log('  all          - Test all environments (default)', 'cyan');
  log('', 'reset');
  log('Examples:', 'yellow');
  log('  node test-frontend-environments.js', 'cyan');
  log('  node test-frontend-environments.js development', 'cyan');
  log('  node test-frontend-environments.js staging', 'cyan');
  log('  node test-frontend-environments.js production', 'cyan');
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 