#!/usr/bin/env node

/**
 * Pre-deployment Validation Script
 * 
 * Runs essential checks before deployment to prevent broken builds
 * 
 * Usage:
 *   npm run validate:pre-deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Running pre-deployment validation...\n');

let hasErrors = false;
const errors = [];

// Helper to run commands
function runCommand(command, description, throwOnError = false) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`✅ ${description} - PASSED`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    errors.push({ description, error: error.message });
    hasErrors = true;
    if (throwOnError) throw error;
    return { success: false, error };
  }
}

// 1. Check Node version
console.log('\n1️⃣ Environment Checks');
const nodeVersion = process.version;
console.log(`   Node version: ${nodeVersion}`);
if (!nodeVersion.match(/^v(18|19|20|21|22)/)) {
  console.log('   ⚠️  Warning: Node version should be 18+ for optimal compatibility');
}

// 2. Check dependencies
console.log('\n2️⃣ Dependency Checks');
runCommand('cd backend && npm list --depth=0', 'Backend dependencies');
runCommand('cd frontend && npm list --depth=0', 'Frontend dependencies');

// 3. Check for TypeScript errors
console.log('\n3️⃣ TypeScript Compilation');
runCommand('cd frontend && npm run type-check', 'Frontend TypeScript check');

// 4. Check for linting errors
console.log('\n4️⃣ Code Quality Checks');
const frontendLint = runCommand('cd frontend && npm run lint:check', 'Frontend linting');

// 5. Run backend tests if they exist
console.log('\n5️⃣ Backend Tests');
const backendTestPath = path.join(__dirname, '..', 'backend', 'tests');
if (fs.existsSync(backendTestPath)) {
  runCommand('cd backend && npm test', 'Backend unit tests');
} else {
  console.log('   ⚠️  No backend tests found - skipping');
}

// 6. Check environment variables
console.log('\n6️⃣ Environment Configuration');
const requiredEnvVars = {
  backend: [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ],
  frontend: [
    'VITE_API_URL',
    'VITE_ENV'
  ]
};

// Check backend .env.example
const backendEnvExample = path.join(__dirname, '..', 'backend', '.env.example');
if (fs.existsSync(backendEnvExample)) {
  console.log('✅ Backend .env.example exists');
} else {
  console.log('❌ Backend .env.example missing');
  hasErrors = true;
}

// Check frontend .env.example
const frontendEnvExample = path.join(__dirname, '..', 'frontend', '.env.example');
if (fs.existsSync(frontendEnvExample)) {
  console.log('✅ Frontend .env.example exists');
} else {
  console.log('❌ Frontend .env.example missing');
  hasErrors = true;
}

// 7. Build tests
console.log('\n7️⃣ Build Tests');
runCommand('cd frontend && npm run build', 'Frontend production build');
runCommand('cd backend && node -c server-refactored.js', 'Backend syntax check');

// 8. Check for common issues
console.log('\n8️⃣ Common Issue Checks');

// Check for console.log statements in production code
const productionFiles = [
  'backend/server-refactored.js',
  'backend/routes/*.js',
  'backend/services/*.js'
];

let consoleLogCount = 0;
productionFiles.forEach(pattern => {
  try {
    const output = execSync(`grep -r "console\\.log" ${pattern} 2>/dev/null || true`, { encoding: 'utf8' });
    if (output.trim()) {
      consoleLogCount += output.split('\n').filter(line => line.trim()).length;
    }
  } catch (e) {
    // Ignore errors
  }
});

if (consoleLogCount > 50) {
  console.log(`⚠️  Warning: Found ${consoleLogCount} console.log statements - consider reducing for production`);
} else {
  console.log(`✅ Console.log usage is reasonable (${consoleLogCount} found)`);
}

// Check for TODO comments
const todoCount = execSync('grep -r "TODO" backend/src backend/routes backend/services 2>/dev/null | wc -l || echo 0', { encoding: 'utf8' }).trim();
console.log(`📝 Found ${todoCount} TODO comments`);

// 9. Database schema validation
console.log('\n9️⃣ Database Schema Validation');
const schemaCheckPath = path.join(__dirname, '..', 'backend', 'scripts', 'pre-deployment-check.js');
if (fs.existsSync(schemaCheckPath)) {
  runCommand('cd backend && node scripts/pre-deployment-check.js', 'Airtable schema validation');
} else {
  console.log('   ℹ️  No schema validation script found');
}

// 10. Security checks
console.log('\n🔐 Security Checks');
const securityIssues = [];

// Check for exposed secrets
const secretPatterns = [
  { pattern: 'sk_live_', name: 'Stripe Live Key' },
  { pattern: 'AKID', name: 'AWS Access Key' },
  { pattern: 'AIza', name: 'Google API Key' },
  { pattern: 'ghp_', name: 'GitHub Personal Token' }
];

secretPatterns.forEach(({ pattern, name }) => {
  try {
    const found = execSync(`grep -r "${pattern}" backend frontend --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || true`, { encoding: 'utf8' });
    if (found.trim()) {
      securityIssues.push(`Found potential ${name} in code`);
      hasErrors = true;
    }
  } catch (e) {
    // Ignore
  }
});

if (securityIssues.length > 0) {
  console.log('❌ Security issues found:');
  securityIssues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ No obvious security issues found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 VALIDATION SUMMARY\n');

if (hasErrors) {
  console.log('❌ Validation FAILED\n');
  console.log('Errors found:');
  errors.forEach(({ description, error }) => {
    console.log(`\n• ${description}`);
    console.log(`  ${error.split('\n')[0]}`);
  });
  console.log('\n⚠️  Please fix these issues before deploying!');
  process.exit(1);
} else {
  console.log('✅ All validations PASSED');
  console.log('\n🚀 Ready for deployment!');
  process.exit(0);
}