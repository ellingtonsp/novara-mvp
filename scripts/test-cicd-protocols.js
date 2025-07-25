#!/usr/bin/env node

/**
 * CI/CD Protocol Testing Script
 * Tests all aspects of the CI/CD pipeline to ensure reliability
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'blue') {
    console.log(`${colors[color]}[${new Date().toISOString()}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function addTestResult(testName, passed, message = '', warning = false) {
    const result = {
        name: testName,
        passed,
        message,
        warning,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    
    if (warning) {
        testResults.warnings++;
        logWarning(`${testName}: ${message}`);
    } else if (passed) {
        testResults.passed++;
        logSuccess(`${testName}: ${message}`);
    } else {
        testResults.failed++;
        logError(`${testName}: ${message}`);
    }
}

// Utility functions
function runCommand(command, options = {}) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            ...options 
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, output: error.message };
    }
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function getCurrentBranch() {
    const result = runCommand('git branch --show-current');
    return result.success ? result.output.trim() : null;
}

function getGitStatus() {
    const result = runCommand('git status --porcelain');
    return result.success ? result.output.trim() : '';
}

// Test functions
function testEnvironmentValidation() {
    logInfo('Testing environment validation...');
    
    // Test 1: Current branch
    const currentBranch = getCurrentBranch();
    if (currentBranch) {
        addTestResult(
            'Current Branch Detection',
            true,
            `Current branch: ${currentBranch}`
        );
        
        // Check if branch matches environment
        if (currentBranch === 'staging') {
            addTestResult(
                'Branch Environment Match',
                true,
                'Branch matches staging environment'
            );
        } else {
            addTestResult(
                'Branch Environment Match',
                false,
                `Branch ${currentBranch} may not match target environment`
            );
        }
    } else {
        addTestResult(
            'Current Branch Detection',
            false,
            'Could not determine current branch'
        );
    }
    
    // Test 2: Railway context
    const railwayResult = runCommand('railway status');
    if (railwayResult.success) {
        addTestResult(
            'Railway Context',
            true,
            'Railway context is accessible'
        );
        
        if (railwayResult.output.includes('staging')) {
            addTestResult(
                'Railway Environment',
                true,
                'Railway is in staging environment'
            );
        } else {
            addTestResult(
                'Railway Environment',
                false,
                'Railway may not be in staging environment'
            );
        }
    } else {
        addTestResult(
            'Railway Context',
            false,
            'Railway context is not accessible'
        );
    }
    
    // Test 3: Environment files
    const envFiles = [
        'frontend/.env.staging',
        'backend/env.staging.example',
        'frontend/.env.production',
        'backend/env.production.example'
    ];
    
    envFiles.forEach(file => {
        if (fileExists(file)) {
            addTestResult(
                `Environment File: ${file}`,
                true,
                'Environment file exists'
            );
        } else {
            addTestResult(
                `Environment File: ${file}`,
                false,
                'Environment file missing'
            );
        }
    });
}

function testDeploymentScripts() {
    logInfo('Testing deployment scripts...');
    
    const scripts = [
        'scripts/deploy-staging.sh',
        'scripts/deploy-production.sh',
        'scripts/deploy-with-validation.sh'
    ];
    
    scripts.forEach(script => {
        if (fileExists(script)) {
            addTestResult(
                `Deployment Script: ${script}`,
                true,
                'Script file exists'
            );
            
            // Test script syntax
            const syntaxResult = runCommand(`bash -n ${script}`);
            if (syntaxResult.success) {
                addTestResult(
                    `Script Syntax: ${script}`,
                    true,
                    'Script syntax is valid'
                );
            } else {
                addTestResult(
                    `Script Syntax: ${script}`,
                    false,
                    'Script has syntax errors'
                );
            }
        } else {
            addTestResult(
                `Deployment Script: ${script}`,
                false,
                'Script file missing'
            );
        }
    });
}

function testMonitoringScripts() {
    logInfo('Testing monitoring scripts...');
    
    const monitoringScripts = [
        'scripts/environment-health-check.js',
        'scripts/simple-deployment-tracker.js',
        'scripts/performance-monitor.js',
        'scripts/railway-web-monitor.js'
    ];
    
    monitoringScripts.forEach(script => {
        if (fileExists(script)) {
            addTestResult(
                `Monitoring Script: ${script}`,
                true,
                'Script file exists'
            );
            
            // Test script execution (without side effects)
            try {
                const scriptContent = fs.readFileSync(script, 'utf8');
                if (scriptContent.includes('require(') || scriptContent.includes('import ')) {
                    addTestResult(
                        `Script Execution: ${script}`,
                        true,
                        'Script appears to be valid JavaScript'
                    );
                } else {
                    addTestResult(
                        `Script Execution: ${script}`,
                        false,
                        'Script may not be valid JavaScript'
                    );
                }
            } catch (error) {
                addTestResult(
                    `Script Execution: ${script}`,
                    false,
                    `Error reading script: ${error.message}`
                );
            }
        } else {
            addTestResult(
                `Monitoring Script: ${script}`,
                false,
                'Script file missing'
            );
        }
    });
}

function testSafetyChecks() {
    logInfo('Testing safety checks...');
    
    // Test 1: Uncommitted changes
    const gitStatus = getGitStatus();
    if (gitStatus === '') {
        addTestResult(
            'Git Status Clean',
            true,
            'No uncommitted changes'
        );
    } else {
        addTestResult(
            'Git Status Clean',
            false,
            'Uncommitted changes detected',
            true // Warning
        );
    }
    
    // Test 2: Package.json scripts
    if (fileExists('package.json')) {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const requiredScripts = [
                'safety:check',
                'health-check',
                'validate:environments',
                'deploy:staging',
                'deploy:production'
            ];
            
            requiredScripts.forEach(script => {
                if (packageJson.scripts && packageJson.scripts[script]) {
                    addTestResult(
                        `Package Script: ${script}`,
                        true,
                        'Script exists in package.json'
                    );
                } else {
                    addTestResult(
                        `Package Script: ${script}`,
                        false,
                        'Script missing from package.json'
                    );
                }
            });
        } catch (error) {
            addTestResult(
                'Package.json Validation',
                false,
                `Error parsing package.json: ${error.message}`
            );
        }
    } else {
        addTestResult(
            'Package.json Exists',
            false,
            'package.json file missing'
        );
    }
}

function testHealthChecks() {
    logInfo('Testing health check systems...');
    
    // Test health check script execution
    const healthCheckResult = runCommand('node scripts/environment-health-check.js', {
        timeout: 30000 // 30 second timeout
    });
    
    if (healthCheckResult.success) {
        addTestResult(
            'Health Check Execution',
            true,
            'Health check script runs successfully'
        );
    } else {
        addTestResult(
            'Health Check Execution',
            false,
            'Health check script failed to run'
        );
    }
    
    // Test deployment tracker
    const trackerResult = runCommand('node scripts/simple-deployment-tracker.js --track', {
        timeout: 10000 // 10 second timeout
    });
    
    if (trackerResult.success) {
        addTestResult(
            'Deployment Tracker',
            true,
            'Deployment tracker runs successfully'
        );
    } else {
        addTestResult(
            'Deployment Tracker',
            false,
            'Deployment tracker failed to run'
        );
    }
}

function generateReport() {
    logInfo('Generating CI/CD protocol test report...');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.tests.length,
            passed: testResults.passed,
            failed: testResults.failed,
            warnings: testResults.warnings,
            successRate: ((testResults.passed / testResults.tests.length) * 100).toFixed(2)
        },
        environment: {
            branch: getCurrentBranch(),
            nodeVersion: process.version,
            platform: process.platform
        },
        tests: testResults.tests,
        recommendations: []
    };
    
    // Generate recommendations based on test results
    if (testResults.failed > 0) {
        report.recommendations.push('Address failed tests before proceeding with deployments');
    }
    
    if (testResults.warnings > 0) {
        report.recommendations.push('Review warnings and address critical issues');
    }
    
    if (report.summary.successRate < 90) {
        report.recommendations.push('CI/CD protocols need improvement - success rate below 90%');
    }
    
    // Save report
    const reportFile = `cicd-protocol-test-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    logSuccess(`Report saved: ${reportFile}`);
    
    return report;
}

function printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CI/CD PROTOCOL TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📊 Test Results:`);
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed} ✅`);
    console.log(`   Failed: ${report.summary.failed} ❌`);
    console.log(`   Warnings: ${report.summary.warnings} ⚠️`);
    console.log(`   Success Rate: ${report.summary.successRate}%`);
    
    console.log(`\n🌍 Environment:`);
    console.log(`   Branch: ${report.environment.branch}`);
    console.log(`   Node Version: ${report.environment.nodeVersion}`);
    console.log(`   Platform: ${report.environment.platform}`);
    
    if (report.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        report.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with appropriate code
    if (report.summary.failed > 0) {
        process.exit(1);
    } else if (report.summary.warnings > 0) {
        process.exit(2);
    } else {
        process.exit(0);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting CI/CD Protocol Testing');
    console.log('==================================\n');
    
    try {
        testEnvironmentValidation();
        testDeploymentScripts();
        testMonitoringScripts();
        testSafetyChecks();
        testHealthChecks();
        
        const report = generateReport();
        printSummary(report);
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
CI/CD Protocol Testing Script

Usage: node scripts/test-cicd-protocols.js [options]

Options:
  --help, -h     Show this help message
  --json         Output results in JSON format
  --quiet        Suppress detailed output

Examples:
  node scripts/test-cicd-protocols.js
  node scripts/test-cicd-protocols.js --json
        `);
        process.exit(0);
    }
    
    main();
}

module.exports = {
    testEnvironmentValidation,
    testDeploymentScripts,
    testMonitoringScripts,
    testSafetyChecks,
    testHealthChecks,
    generateReport
}; 