#!/usr/bin/env node

/**
 * Deployment Health Monitor
 * Real-time monitoring for deployment health check failures
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import centralized configuration
const { ENVIRONMENTS, MONITORING_CONFIG } = require('./environment-config');

// Configuration
const CONFIG = {
  environments: ENVIRONMENTS,
  healthEndpoint: '/api/health',
  timeout: 5000, // 5 seconds for quick health checks
  retries: 3,
  checkInterval: 10 * 1000, // 10 seconds during deployment
  normalInterval: 60 * 1000, // 1 minute during normal operation
  logFile: path.join(__dirname, '../logs/deployment-health.log'),
  alertThreshold: 3 // Alert after 3 consecutive failures
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
        'User-Agent': 'Novara-Deployment-Health-Monitor/1.0',
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

// Check health endpoint with retries
async function checkHealth(baseUrl, retries = CONFIG.retries) {
  const url = `${baseUrl}${CONFIG.healthEndpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(url);
      const responseTime = Date.now() - startTime;
      
      if (response.statusCode === 200) {
        try {
          const healthData = JSON.parse(response.data);
          return {
            success: true,
            statusCode: response.statusCode,
            responseTime,
            data: healthData,
            url,
            attempt
          };
        } catch (parseError) {
          return {
            success: false,
            error: 'Invalid JSON response',
            statusCode: response.statusCode,
            data: response.data,
            url,
            attempt
          };
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.statusCode}`,
          statusCode: response.statusCode,
          data: response.data,
          url,
          attempt
        };
      }
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

// Monitor environment health
async function monitorEnvironment(envName, envConfig) {
  log(`Checking ${envName} environment health...`);
  
  const result = await checkHealth(envConfig.backend);
  
  if (result.success) {
    const status = result.data.status === 'ok' ? '✅' : '⚠️';
    log(`${status} ${envName}: Healthy (${result.responseTime}ms)`, 'INFO');
    
    // Log health details
    log(`   Environment: ${result.data.environment}`, 'DEBUG');
    log(`   Service: ${result.data.service}`, 'DEBUG');
    log(`   Version: ${result.data.version}`, 'DEBUG');
    log(`   Airtable: ${result.data.airtable}`, 'DEBUG');
    log(`   JWT: ${result.data.jwt}`, 'DEBUG');
    
    return { healthy: true, data: result.data };
  } else {
    log(`❌ ${envName}: Unhealthy - ${result.error}`, 'ERROR');
    log(`   URL: ${result.url}`, 'ERROR');
    log(`   Attempt: ${result.attempt}/${CONFIG.retries}`, 'ERROR');
    
    if (result.statusCode) {
      log(`   Status Code: ${result.statusCode}`, 'ERROR');
    }
    
    if (result.data) {
      log(`   Response: ${result.data.substring(0, 200)}...`, 'ERROR');
    }
    
    return { healthy: false, error: result.error };
  }
}

// Load failure history
function loadFailureHistory() {
  const historyFile = path.join(__dirname, '../logs/deployment-health-history.json');
  
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  } catch (error) {
    log(`Failed to load failure history: ${error.message}`, 'WARN');
  }
  
  return {};
}

// Save failure history
function saveFailureHistory(data) {
  const historyFile = path.join(__dirname, '../logs/deployment-health-history.json');
  
  try {
    fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Failed to save failure history: ${error.message}`, 'ERROR');
  }
}

// Check for deployment failures
function checkForFailures(currentResults, previousResults) {
  const alerts = [];
  
  for (const [envName, currentResult] of Object.entries(currentResults)) {
    const previousResult = previousResults[envName];
    
    // Check if environment became unhealthy
    if (currentResult.healthy === false && (!previousResult || previousResult.healthy === true)) {
      alerts.push({
        type: 'environment_unhealthy',
        environment: envName,
        error: currentResult.error,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if environment became healthy
    if (currentResult.healthy === true && previousResult && previousResult.healthy === false) {
      alerts.push({
        type: 'environment_recovered',
        environment: envName,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return alerts;
}

// Send alert
function sendAlert(alert) {
  const alertMessage = `
🚨 **Deployment Health Alert**
Environment: ${alert.environment}
Type: ${alert.type}
Time: ${alert.timestamp}
${alert.error ? `Error: ${alert.error}` : ''}
  `.trim();
  
  log(alertMessage, 'ALERT');
  
  // In a real implementation, you would send this to Slack, email, etc.
  console.log('\n' + alertMessage);
}

// Main monitoring function
async function runHealthMonitoring() {
  log('Starting deployment health monitoring...');
  
  const allResults = {};
  const failureHistory = loadFailureHistory();
  
  // Check all environments
  for (const [envName, envConfig] of Object.entries(CONFIG.environments)) {
    try {
      const result = await monitorEnvironment(envName, envConfig);
      allResults[envName] = result;
    } catch (error) {
      log(`Error monitoring ${envName}: ${error.message}`, 'ERROR');
      allResults[envName] = { healthy: false, error: error.message };
    }
  }
  
  // Check for failures
  const alerts = checkForFailures(allResults, failureHistory);
  
  // Send alerts
  for (const alert of alerts) {
    sendAlert(alert);
  }
  
  // Save current results for next comparison
  saveFailureHistory(allResults);
  
  // Summary
  const healthyCount = Object.values(allResults).filter(r => r.healthy).length;
  const totalCount = Object.keys(allResults).length;
  
  log(`Health monitoring complete: ${healthyCount}/${totalCount} environments healthy`);
  
  return { results: allResults, alerts };
}

// Start continuous monitoring
async function startContinuousMonitoring() {
  log('Starting continuous deployment health monitoring...');
  
  // Initial check
  await runHealthMonitoring();
  
  // Set up interval for continuous monitoring
  setInterval(async () => {
    try {
      await runHealthMonitoring();
    } catch (error) {
      log(`Error in health monitoring: ${error.message}`, 'ERROR');
    }
  }, CONFIG.normalInterval);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
    case undefined:
      runHealthMonitoring().then(({ results, alerts }) => {
        if (alerts.length > 0) {
          console.log(`\n⚠️  ${alerts.length} alerts generated`);
          process.exit(1);
        } else {
          console.log('\n✅ All environments healthy');
          process.exit(0);
        }
      });
      break;
      
    case 'monitor':
      startContinuousMonitoring();
      break;
      
    case 'environments':
      console.log('Available environments:');
      Object.entries(CONFIG.environments).forEach(([env, config]) => {
        console.log(`  ${env}: ${config.backend}`);
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/deployment-health-monitor.js [check|monitor|environments]');
      console.log('');
      console.log('Commands:');
      console.log('  check        # Run single health check');
      console.log('  monitor      # Start continuous monitoring');
      console.log('  environments # List available environments');
      break;
  }
}

module.exports = {
  runHealthMonitoring,
  startContinuousMonitoring,
  checkHealth
}; 