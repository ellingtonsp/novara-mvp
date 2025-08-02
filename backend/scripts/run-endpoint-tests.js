#!/usr/bin/env node

/**
 * Test Runner for New Endpoints
 * Runs comprehensive tests for the newly implemented endpoints
 * Uses the refactored server on port 9002
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color helpers
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

// Configuration
const config = {
  port: 9002,
  testTimeout: 30000,
  serverStartupDelay: 3000,
  useRefactoredServer: true,
  testPattern: 'test/endpoints.test.js',
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  coverage: process.argv.includes('--coverage') || process.argv.includes('-c'),
  watch: process.argv.includes('--watch') || process.argv.includes('-w'),
};

console.log(colors.bold('\n🧪 Novara Backend - Endpoint Test Runner\n'));
console.log(colors.blue('Configuration:'));
console.log(`  ${colors.dim('Port:')} ${config.port}`);
console.log(`  ${colors.dim('Server:')} Refactored`);
console.log(`  ${colors.dim('Test Pattern:')} ${config.testPattern}`);
console.log(`  ${colors.dim('Coverage:')} ${config.coverage ? 'Enabled' : 'Disabled'}`);
console.log(`  ${colors.dim('Watch Mode:')} ${config.watch ? 'Enabled' : 'Disabled'}`);

/**
 * Check if required dependencies are installed
 */
function checkDependencies() {
  console.log(colors.yellow('\n📦 Checking dependencies...'));
  
  const requiredDeps = ['jest', 'supertest'];
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  
  const missing = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missing.length > 0) {
    console.log(colors.red(`❌ Missing dependencies: ${missing.join(', ')}`));
    console.log(colors.yellow('Install with: npm install --save-dev jest supertest'));
    process.exit(1);
  }
  
  console.log(colors.green('✅ All dependencies found'));
}

/**
 * Set up test environment variables
 */
function setupEnvironment() {
  console.log(colors.yellow('\n🔧 Setting up test environment...'));
  
  process.env.NODE_ENV = 'test';
  process.env.PORT = config.port.toString();
  process.env.USE_REFACTORED_SERVER = 'true';
  process.env.USE_LOCAL_DATABASE = 'true';
  process.env.JWT_SECRET = 'test-jwt-secret-for-endpoint-tests';
  process.env.LOG_LEVEL = config.verbose ? 'debug' : 'error';
  
  // Disable external services in test mode
  delete process.env.AIRTABLE_API_KEY;
  delete process.env.AIRTABLE_BASE_ID;
  delete process.env.SENTRY_DSN;
  delete process.env.REDIS_URL;
  
  console.log(colors.green('✅ Environment configured for testing'));
}

/**
 * Check if port is available
 */
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

/**
 * Run Jest tests
 */
function runTests() {
  return new Promise((resolve, reject) => {
    console.log(colors.yellow('\n🏃 Running endpoint tests...\n'));
    
    const jestArgs = [
      '--config=jest.endpoints.config.js',
      '--forceExit',
      '--detectOpenHandles',
      `--testTimeout=${config.testTimeout}`,
    ];
    
    if (config.coverage) {
      jestArgs.push('--coverage');
      jestArgs.push('--coverageDirectory=coverage/endpoints');
    }
    
    if (config.watch) {
      jestArgs.push('--watch');
    }
    
    if (config.verbose) {
      jestArgs.push('--verbose');
    }
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      env: process.env,
      cwd: path.join(__dirname, '..'),
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      reject(error);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(colors.yellow('\n\n⏹️  Stopping tests...'));
      jest.kill('SIGINT');
    });
  });
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log(colors.yellow('\n📊 Generating test report...'));
  
  const reportPath = path.join(__dirname, '../test-results.json');
  const coveragePath = path.join(__dirname, '../coverage/endpoints');
  
  console.log(colors.blue('\nTest Results:'));
  
  // Check if Jest generated any reports
  if (fs.existsSync(reportPath)) {
    console.log(`  ${colors.dim('Results:')} ${reportPath}`);
  }
  
  if (config.coverage && fs.existsSync(coveragePath)) {
    console.log(`  ${colors.dim('Coverage:')} ${coveragePath}/lcov-report/index.html`);
  }
  
  console.log(colors.green('\n✅ Test report generated'));
}

/**
 * Display helpful information
 */
function displayHelp() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(colors.bold('\n📖 Endpoint Test Runner - Usage\n'));
    console.log('npm run test:endpoints [options]');
    console.log('node scripts/run-endpoint-tests.js [options]\n');
    console.log('Options:');
    console.log('  -v, --verbose    Enable verbose output');
    console.log('  -c, --coverage   Generate coverage report');
    console.log('  -w, --watch      Run in watch mode');
    console.log('  -h, --help       Show this help message\n');
    console.log('Examples:');
    console.log('  npm run test:endpoints -- --coverage');
    console.log('  node scripts/run-endpoint-tests.js --watch --verbose\n');
    process.exit(0);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    displayHelp();
    
    // Pre-flight checks
    checkDependencies();
    setupEnvironment();
    
    // Check if port is available
    const portAvailable = await checkPortAvailable(config.port);
    if (!portAvailable) {
      console.log(colors.yellow(`⚠️  Port ${config.port} is in use. Tests will continue but may conflict with running server.`));
    }
    
    // Run the tests
    await runTests();
    
    // Generate report
    if (!config.watch) {
      generateTestReport();
      console.log(colors.green('\n🎉 All endpoint tests completed successfully!'));
    }
    
  } catch (error) {
    console.log(colors.red('\n❌ Test execution failed:'));
    console.log(colors.red(error.message));
    
    if (config.verbose) {
      console.log(colors.dim('\nStack trace:'));
      console.log(colors.dim(error.stack));
    }
    
    process.exit(1);
  }
}

// Execute if this script is run directly
if (require.main === module) {
  main();
}

module.exports = {
  runEndpointTests: main,
  config,
};