#!/usr/bin/env node

// 🧪 Quick Test Script - No Hanging
// Runs basic tests without starting full servers

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Novara Quick Test Suite');
console.log('==========================');

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function runTest(name, command, cwd = process.cwd()) {
  console.log(`\n${YELLOW}Testing: ${name}${RESET}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
    console.log(`${GREEN}✅ ${name} passed${RESET}`);
    return true;
  } catch (error) {
    console.log(`${RED}❌ ${name} failed${RESET}`);
    return false;
  }
}

// Test results
let passed = 0;
let total = 0;

// 1. Test environment validation
total++;
if (runTest('Environment Validation', 'npm run validate-environments')) {
  passed++;
}

// 2. Test backend tests (with timeout)
total++;
if (runTest('Backend Tests', 'npm test', path.join(process.cwd(), 'backend'))) {
  passed++;
}

// 3. Test frontend build (without running tests)
total++;
if (runTest('Frontend Build', 'npm run build', path.join(process.cwd(), 'frontend'))) {
  passed++;
}

// 4. Test TypeScript compilation
total++;
if (runTest('TypeScript Check', 'npx tsc --noEmit', path.join(process.cwd(), 'frontend'))) {
  passed++;
}

// Summary
console.log(`\n${YELLOW}Test Summary:${RESET}`);
console.log(`${GREEN}✅ Passed: ${passed}${RESET}`);
console.log(`${RED}❌ Failed: ${total - passed}${RESET}`);
console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);

if (passed === total) {
  console.log(`\n${GREEN}🎉 All tests passed!${RESET}`);
  process.exit(0);
} else {
  console.log(`\n${RED}⚠️  Some tests failed${RESET}`);
  process.exit(1);
} 