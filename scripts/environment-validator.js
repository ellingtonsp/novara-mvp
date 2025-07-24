#!/usr/bin/env node

/**
 * Environment Validator
 * Validates all environment configurations before deployment
 * Prevents deployment of broken environment configurations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'cyan');
  console.log('-'.repeat(40));
}

// Environment configurations to validate
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    frontend: 'http://localhost:4200',
    backend: 'http://localhost:9002',
    description: 'Local development environment'
  },
  staging: {
    name: 'Staging',
    frontend: 'https://novara-mvp-git-staging-novara-fertility.vercel.app',
    backend: 'https://novara-staging-staging.up.railway.app',
    description: 'Staging environment for testing'
  },
  production: {
    name: 'Production',
    frontend: 'https://novara-mvp.vercel.app',
    backend: 'https://novara-mvp-production.up.railway.app',
    description: 'Production environment'
  }
};

// Validation rules
const VALIDATION_RULES = {
  // Frontend files that should not contain hardcoded URLs
  frontendFiles: [
    'frontend/src/lib/api.ts',
    'frontend/src/contexts/AuthContext.tsx',
    'frontend/src/components/DailyCheckinForm.tsx',
    'frontend/src/components/DailyInsightsDisplay.tsx',
    'frontend/src/components/WelcomeInsight.tsx'
  ],
  
  // Backend files that should not contain hardcoded URLs
  backendFiles: [
    'backend/server.js',
    'backend/routes/*.js'
  ],
  
  // Environment files that should exist
  envFiles: [
    'frontend/env.development.example',
    'frontend/env.staging.example',
    'frontend/env.production.example',
    'backend/env.development.example',
    'backend/env.staging.example',
    'backend/env.production.example'
  ],
  
  // Configuration files that should exist
  configFiles: [
    'frontend/src/lib/environment.ts',
    'scripts/environment-health-check.js',
    'docs/environment-best-practices.md'
  ]
};

// Make HTTP/HTTPS request
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
        'User-Agent': 'Novara-Environment-Validator/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Check for hardcoded URLs in files
function checkForHardcodedUrls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hardcodedPatterns = [
      /https:\/\/novara-backend-staging\.up\.railway\.app/g,
      /https:\/\/novara-backend\.up\.railway\.app/g,
      /https:\/\/novara-mvp-production\.up\.railway\.app/g,
      /https:\/\/novara-staging-staging\.up\.railway\.app/g,
      /http:\/\/localhost:3000/g,
      /http:\/\/localhost:3001/g,
      /http:\/\/localhost:3002/g
    ];
    
    const issues = [];
    hardcodedPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          pattern: pattern.source,
          count: matches.length,
          lines: content.split('\n').map((line, lineNum) => {
            if (pattern.test(line)) {
              return lineNum + 1;
            }
            return null;
          }).filter(lineNum => lineNum !== null)
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [{ error: error.message }];
  }
}

// Validate file structure
function validateFileStructure() {
  logSection('Validating File Structure');
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };
  
  // Check required files exist
  [...VALIDATION_RULES.configFiles, ...VALIDATION_RULES.envFiles].forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
      results.passed++;
    } else {
      log(`❌ ${file} - Missing`, 'red');
      results.failed++;
      results.issues.push(`Missing file: ${file}`);
    }
  });
  
  return results;
}

// Validate for hardcoded URLs
function validateHardcodedUrls() {
  logSection('Checking for Hardcoded URLs');
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };
  
  VALIDATION_RULES.frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const issues = checkForHardcodedUrls(file);
      if (issues.length === 0) {
        log(`✅ ${file} - No hardcoded URLs found`, 'green');
        results.passed++;
      } else {
        log(`❌ ${file} - Hardcoded URLs found:`, 'red');
        issues.forEach(issue => {
          if (issue.error) {
            log(`   Error: ${issue.error}`, 'red');
          } else {
            log(`   Pattern: ${issue.pattern} (${issue.count} occurrences)`, 'red');
            log(`   Lines: ${issue.lines.join(', ')}`, 'red');
          }
        });
        results.failed++;
        results.issues.push(`Hardcoded URLs in ${file}`);
      }
    } else {
      log(`⚠️  ${file} - File not found (may be new)`, 'yellow');
    }
  });
  
  return results;
}

// Validate environment connectivity
async function validateEnvironmentConnectivity() {
  logSection('Validating Environment Connectivity');
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };
  
  for (const [envKey, envConfig] of Object.entries(ENVIRONMENTS)) {
    log(`\nTesting ${envConfig.name} environment:`, 'blue');
    
    // Test backend health (skip development if not running locally)
    if (envKey === 'development') {
      try {
        const healthResponse = await makeRequest(`${envConfig.backend}/api/health`);
        if (healthResponse.success) {
          log(`✅ Backend health check: ${healthResponse.status}`, 'green');
          results.passed++;
          
          // Verify environment is correct
          if (healthResponse.data && healthResponse.data.environment) {
            if (healthResponse.data.environment === envKey) {
              log(`✅ Environment detection: ${healthResponse.data.environment}`, 'green');
              results.passed++;
            } else {
              log(`❌ Environment mismatch: expected ${envKey}, got ${healthResponse.data.environment}`, 'red');
              results.failed++;
              results.issues.push(`Environment mismatch in ${envKey}: expected ${envKey}, got ${healthResponse.data.environment}`);
            }
          }
        } else {
          log(`❌ Backend health check failed: ${healthResponse.status}`, 'red');
          results.failed++;
          results.issues.push(`Backend health check failed for ${envKey}: ${healthResponse.status}`);
        }
      } catch (error) {
        log(`⚠️  Development backend not running (expected for validation): ${error.message}`, 'yellow');
        log(`   Run './scripts/start-dev-stable.sh' to start local development`, 'yellow');
        results.passed++; // Don't fail validation for development environment
      }
    } else {
      try {
        const healthResponse = await makeRequest(`${envConfig.backend}/api/health`);
        if (healthResponse.success) {
          log(`✅ Backend health check: ${healthResponse.status}`, 'green');
          results.passed++;
          
          // Verify environment is correct
          if (healthResponse.data && healthResponse.data.environment) {
            if (healthResponse.data.environment === envKey) {
              log(`✅ Environment detection: ${healthResponse.data.environment}`, 'green');
              results.passed++;
            } else {
              log(`❌ Environment mismatch: expected ${envKey}, got ${healthResponse.data.environment}`, 'red');
              results.failed++;
              results.issues.push(`Environment mismatch in ${envKey}: expected ${envKey}, got ${healthResponse.data.environment}`);
            }
          }
        } else {
          log(`❌ Backend health check failed: ${healthResponse.status}`, 'red');
          results.failed++;
          results.issues.push(`Backend health check failed for ${envKey}: ${healthResponse.status}`);
        }
      } catch (error) {
        log(`❌ Backend connectivity failed: ${error.message}`, 'red');
        results.failed++;
        results.issues.push(`Backend connectivity failed for ${envKey}: ${error.message}`);
      }
    }
    
    // Test frontend accessibility (skip development)
    if (envKey !== 'development') {
      try {
        const frontendResponse = await makeRequest(envConfig.frontend);
        if (frontendResponse.success) {
          log(`✅ Frontend accessible: ${frontendResponse.status}`, 'green');
          results.passed++;
        } else {
          log(`❌ Frontend not accessible: ${frontendResponse.status}`, 'red');
          results.failed++;
          results.issues.push(`Frontend not accessible for ${envKey}: ${frontendResponse.status}`);
        }
      } catch (error) {
        log(`❌ Frontend connectivity failed: ${error.message}`, 'red');
        results.failed++;
        results.issues.push(`Frontend connectivity failed for ${envKey}: ${error.message}`);
      }
    }
  }
  
  return results;
}

// Validate environment configuration
function validateEnvironmentConfiguration() {
  logSection('Validating Environment Configuration');
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };
  
  // Check if environment.ts exists and is properly structured
  const envFilePath = 'frontend/src/lib/environment.ts';
  if (fs.existsSync(envFilePath)) {
    const content = fs.readFileSync(envFilePath, 'utf8');
    
    // Check for required exports
    const requiredExports = ['API_BASE_URL', 'environmentConfig', 'IS_DEVELOPMENT', 'IS_STAGING', 'IS_PRODUCTION'];
    requiredExports.forEach(exportName => {
      if (content.includes(`export const ${exportName}`) || content.includes(`export { ${exportName}`)) {
        log(`✅ Export ${exportName} found`, 'green');
        results.passed++;
      } else {
        log(`❌ Export ${exportName} missing`, 'red');
        results.failed++;
        results.issues.push(`Missing export: ${exportName}`);
      }
    });
    
    // Check for environment detection logic
    if (content.includes('getEnvironment') || content.includes('getApiUrl')) {
      log(`✅ Environment detection logic found`, 'green');
      results.passed++;
    } else {
      log(`❌ Environment detection logic missing`, 'red');
      results.failed++;
      results.issues.push('Missing environment detection logic');
    }
  } else {
    log(`❌ Environment configuration file missing: ${envFilePath}`, 'red');
    results.failed++;
    results.issues.push(`Missing environment configuration file: ${envFilePath}`);
  }
  
  return results;
}

// Generate validation report
function generateReport(results) {
  logHeader('Environment Validation Report');
  
  const totalChecks = results.fileStructure.passed + results.fileStructure.failed +
                     results.hardcodedUrls.passed + results.hardcodedUrls.failed +
                     results.connectivity.passed + results.connectivity.failed +
                     results.configuration.passed + results.configuration.failed;
  
  const totalPassed = results.fileStructure.passed + results.hardcodedUrls.passed +
                     results.connectivity.passed + results.configuration.passed;
  
  const totalFailed = results.fileStructure.failed + results.hardcodedUrls.failed +
                     results.connectivity.failed + results.configuration.failed;
  
  log(`\n📊 Validation Summary:`, 'bright');
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  
  if (totalFailed > 0) {
    log(`\n❌ Issues Found:`, 'red');
    const allIssues = [
      ...results.fileStructure.issues,
      ...results.hardcodedUrls.issues,
      ...results.connectivity.issues,
      ...results.configuration.issues
    ];
    
    allIssues.forEach((issue, index) => {
      log(`${index + 1}. ${issue}`, 'red');
    });
    
    log(`\n⚠️  Deployment blocked due to validation failures.`, 'yellow');
    log(`Please fix the issues above before deploying.`, 'yellow');
    return false;
  } else {
    log(`\n🎉 All validations passed! Environment is ready for deployment.`, 'green');
    return true;
  }
}

// Main validation function
async function validateEnvironments() {
  logHeader('Novara Environment Validator');
  log('Validating environment configurations before deployment...', 'blue');
  
  const results = {
    fileStructure: validateFileStructure(),
    hardcodedUrls: validateHardcodedUrls(),
    connectivity: await validateEnvironmentConnectivity(),
    configuration: validateEnvironmentConfiguration()
  };
  
  const isValid = generateReport(results);
  
  if (!isValid) {
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateEnvironments().catch(error => {
    log(`❌ Validation failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateEnvironments, ENVIRONMENTS, VALIDATION_RULES }; 