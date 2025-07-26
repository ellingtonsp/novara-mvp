#!/usr/bin/env node

/**
 * Comprehensive Health Check Script
 * Validates all environments and provides detailed status reporting
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import centralized configuration
const { ENVIRONMENTS, MONITORING_CONFIG } = require('./environment-config');

// Configuration
const CONFIG = {
  timeout: MONITORING_CONFIG.timeout,
  retries: MONITORING_CONFIG.retries,
  healthEndpoints: MONITORING_CONFIG.healthEndpoints,
  logFile: path.join(__dirname, '../logs/comprehensive-health.log'),
  reportFile: path.join(__dirname, '../logs/health-report.json')
};

// Ensure logs directory exists
const logsDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
}

// HTTP request utility
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Novara-Health-Check/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
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
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Check endpoint with retries
async function checkEndpoint(baseUrl, endpoint, retries = CONFIG.retries) {
  const url = `${baseUrl}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(url);
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        statusCode: response.statusCode,
        responseTime,
        data: response.data,
        url,
        attempt
      };
    } catch (error) {
      if (attempt === retries) {
        return {
          success: false,
          error: error.message,
          url,
          attempt
        };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Check environment health
async function checkEnvironment(envName, envConfig) {
  log(`Checking ${envName} environment...`);
  
  const results = {
    environment: envName,
    name: envConfig.name,
    timestamp: new Date().toISOString(),
    backend: {
      healthy: false,
      endpoints: {},
      summary: 'Unknown'
    },
    frontend: {
      healthy: false,
      accessible: false,
      summary: 'Unknown'
    },
    overall: {
      healthy: false,
      issues: []
    }
  };
  
  // Check backend endpoints
  for (const endpoint of CONFIG.healthEndpoints) {
    const endpointResult = await checkEndpoint(envConfig.backend, endpoint);
    results.backend.endpoints[endpoint] = endpointResult;
    
    if (!endpointResult.success) {
      results.overall.issues.push(`${endpoint}: ${endpointResult.error}`);
    }
  }
  
  // Determine backend health
  const healthyEndpoints = Object.values(results.backend.endpoints).filter(r => r.success);
  results.backend.healthy = healthyEndpoints.length > 0;
  results.backend.summary = results.backend.healthy 
    ? `${healthyEndpoints.length}/${CONFIG.healthEndpoints.length} endpoints healthy`
    : 'All endpoints failed';
  
  // Check frontend accessibility
  try {
    const frontendResult = await makeRequest(envConfig.frontend);
    results.frontend.accessible = frontendResult.statusCode === 200;
    results.frontend.healthy = results.frontend.accessible;
    results.frontend.summary = results.frontend.accessible 
      ? 'Frontend accessible' 
      : `HTTP ${frontendResult.statusCode}`;
  } catch (error) {
    results.frontend.accessible = false;
    results.frontend.healthy = false;
    results.frontend.summary = `Error: ${error.message}`;
    results.overall.issues.push(`Frontend: ${error.message}`);
  }
  
  // Determine overall health
  results.overall.healthy = results.backend.healthy && results.frontend.healthy;
  
  return results;
}

// Generate health report
function generateReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(allResults).length,
      healthy: Object.values(allResults).filter(r => r.overall.healthy).length,
      unhealthy: Object.values(allResults).filter(r => !r.overall.healthy).length
    },
    environments: allResults,
    recommendations: []
  };
  
  // Generate recommendations
  const unhealthyEnvs = Object.values(allResults).filter(r => !r.overall.healthy);
  
  if (unhealthyEnvs.length > 0) {
    report.recommendations.push(`Found ${unhealthyEnvs.length} unhealthy environment(s)`);
    
    unhealthyEnvs.forEach(env => {
      if (!env.backend.healthy) {
        report.recommendations.push(`- ${env.name}: Check backend deployment and environment variables`);
      }
      if (!env.frontend.healthy) {
        report.recommendations.push(`- ${env.name}: Check frontend deployment and configuration`);
      }
    });
  } else {
    report.recommendations.push('All environments are healthy');
  }
  
  return report;
}

// Save report to file
function saveReport(report) {
  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
  log(`Health report saved to ${CONFIG.reportFile}`);
}

// Main health check function
async function runHealthCheck() {
  log('Starting comprehensive health check...');
  
  const allResults = {};
  
  // Check all environments
  for (const [envName, envConfig] of Object.entries(ENVIRONMENTS)) {
    try {
      const result = await checkEnvironment(envName, envConfig);
      allResults[envName] = result;
      
      // Log summary
      const status = result.overall.healthy ? '✅' : '❌';
      log(`${status} ${envName}: ${result.overall.healthy ? 'Healthy' : 'Unhealthy'}`);
      
      if (!result.overall.healthy) {
        log(`  Issues: ${result.overall.issues.join(', ')}`, 'WARN');
      }
      
    } catch (error) {
      log(`Error checking ${envName}: ${error.message}`, 'ERROR');
      allResults[envName] = {
        environment: envName,
        name: envConfig.name,
        timestamp: new Date().toISOString(),
        error: error.message,
        overall: { healthy: false, issues: [error.message] }
      };
    }
  }
  
  // Generate and save report
  const report = generateReport(allResults);
  saveReport(report);
  
  // Print summary
  console.log('\n📊 Health Check Summary:');
  console.log(`Total environments: ${report.summary.total}`);
  console.log(`Healthy: ${report.summary.healthy}`);
  console.log(`Unhealthy: ${report.summary.unhealthy}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  // Exit with appropriate code
  const exitCode = report.summary.unhealthy > 0 ? 1 : 0;
  process.exit(exitCode);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
    case undefined:
      runHealthCheck();
      break;
      
    case 'report':
      if (fs.existsSync(CONFIG.reportFile)) {
        const report = JSON.parse(fs.readFileSync(CONFIG.reportFile, 'utf8'));
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log('No health report found. Run "check" first.');
      }
      break;
      
    case 'environments':
      console.log('Available environments:');
      Object.entries(ENVIRONMENTS).forEach(([env, config]) => {
        console.log(`  ${env}: ${config.name}`);
        console.log(`    Backend: ${config.backend}`);
        console.log(`    Frontend: ${config.frontend}`);
        console.log(`    Health: ${config.healthUrl}`);
        console.log('');
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node comprehensive-health-check.js [check]     # Run health check');
      console.log('  node comprehensive-health-check.js report      # Show last report');
      console.log('  node comprehensive-health-check.js environments # List environments');
      break;
  }
}

module.exports = {
  runHealthCheck,
  checkEnvironment,
  generateReport
}; 