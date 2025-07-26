#!/usr/bin/env node

/**
 * Novara Deployment Health Monitor
 * Proactively monitors all deployment environments and alerts on failures
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import centralized configuration
const { ENVIRONMENTS, MONITORING_CONFIG } = require('./environment-config');

// Configuration
const CONFIG = {
  environments: {
    staging: {
      backend: ENVIRONMENTS.staging.backend,
      frontend: ENVIRONMENTS.staging.frontend,
      name: ENVIRONMENTS.staging.name
    },
    production: {
      backend: ENVIRONMENTS.production.backend,
      frontend: ENVIRONMENTS.production.frontend,
      name: ENVIRONMENTS.production.name
    }
  },
  healthEndpoints: MONITORING_CONFIG.healthEndpoints,
  timeout: MONITORING_CONFIG.timeout,
  retries: MONITORING_CONFIG.retries,
  checkInterval: MONITORING_CONFIG.checkInterval,
  alertThreshold: MONITORING_CONFIG.alertThreshold,
  logFile: path.join(__dirname, '../logs/deployment-monitor.log'),
  statusFile: path.join(__dirname, '../logs/deployment-status.json')
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
  
  // Append to log file
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
        'User-Agent': 'Novara-Deployment-Monitor/1.0',
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

// Health check for a single endpoint
async function checkEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await makeRequest(url);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Try to parse JSON response
      try {
        const data = JSON.parse(response.data);
        return {
          success: true,
          statusCode: response.statusCode,
          responseTime: response.headers['x-response-time'] || 'unknown',
          data: data
        };
      } catch (parseError) {
        return {
          success: true,
          statusCode: response.statusCode,
          responseTime: response.headers['x-response-time'] || 'unknown',
          data: 'Non-JSON response'
        };
      }
    } else {
      return {
        success: false,
        statusCode: response.statusCode,
        error: `HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

// Check environment health
async function checkEnvironment(envName, envConfig) {
  log(`Checking ${envName} environment...`);
  
  const results = {
    environment: envName,
    timestamp: new Date().toISOString(),
    backend: {
      status: 'unknown',
      endpoints: {},
      overall: 'unknown'
    },
    frontend: {
      status: 'unknown',
      overall: 'unknown'
    },
    overall: 'unknown'
  };
  
  // Check backend endpoints
  const backendChecks = [];
  for (const endpoint of CONFIG.healthEndpoints) {
    const result = await checkEndpoint(envConfig.backend, endpoint);
    results.backend.endpoints[endpoint] = result;
    backendChecks.push(result.success);
  }
  
  // Determine backend overall status
  const backendSuccessRate = backendChecks.filter(Boolean).length / backendChecks.length;
  results.backend.overall = backendSuccessRate >= 0.8 ? 'healthy' : 'unhealthy';
  results.backend.status = backendSuccessRate >= 0.8 ? '✅' : '❌';
  
  // Check frontend
  try {
    const frontendResponse = await makeRequest(envConfig.frontend);
    results.frontend.status = frontendResponse.statusCode >= 200 && frontendResponse.statusCode < 300 ? '✅' : '❌';
    results.frontend.overall = frontendResponse.statusCode >= 200 && frontendResponse.statusCode < 300 ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.frontend.status = '❌';
    results.frontend.overall = 'unhealthy';
    results.frontend.error = error.message;
  }
  
  // Determine overall environment status
  const isHealthy = results.backend.overall === 'healthy' && results.frontend.overall === 'healthy';
  results.overall = isHealthy ? 'healthy' : 'unhealthy';
  
  return results;
}

// Load previous status
function loadPreviousStatus() {
  try {
    if (fs.existsSync(CONFIG.statusFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.statusFile, 'utf8'));
    }
  } catch (error) {
    log(`Error loading previous status: ${error.message}`, 'WARN');
  }
  return {};
}

// Save current status
function saveStatus(status) {
  try {
    fs.writeFileSync(CONFIG.statusFile, JSON.stringify(status, null, 2));
  } catch (error) {
    log(`Error saving status: ${error.message}`, 'ERROR');
  }
}

// Check for failures and alert
function checkForFailures(currentStatus, previousStatus) {
  const alerts = [];
  
  for (const [envName, envStatus] of Object.entries(currentStatus)) {
    const prevEnvStatus = previousStatus[envName];
    
    // Check if environment just became unhealthy
    if (envStatus.overall === 'unhealthy' && 
        (!prevEnvStatus || prevEnvStatus.overall === 'healthy')) {
      alerts.push({
        type: 'environment_down',
        environment: envName,
        message: `🚨 ${envName} environment is DOWN!`,
        details: {
          backend: envStatus.backend.overall,
          frontend: envStatus.frontend.overall,
          timestamp: envStatus.timestamp
        }
      });
    }
    
    // Check for specific endpoint failures
    for (const [endpoint, result] of Object.entries(envStatus.backend.endpoints)) {
      if (!result.success) {
        const prevResult = prevEnvStatus?.backend?.endpoints?.[endpoint];
        
        if (!prevResult || prevResult.success) {
          alerts.push({
            type: 'endpoint_failure',
            environment: envName,
            endpoint: endpoint,
            message: `⚠️ ${envName} ${endpoint} endpoint is failing`,
            details: {
              error: result.error,
              statusCode: result.statusCode,
              timestamp: envStatus.timestamp
            }
          });
        }
      }
    }
  }
  
  return alerts;
}

// Send alert (placeholder for integration with notification services)
function sendAlert(alert) {
  log(`🚨 ALERT: ${alert.message}`, 'ALERT');
  log(`Details: ${JSON.stringify(alert.details, null, 2)}`, 'ALERT');
  
  // TODO: Integrate with notification services like:
  // - Slack webhook
  // - Email notification
  // - SMS alert
  // - Discord webhook
  // - PagerDuty
  
  console.log('\n' + '='.repeat(60));
  console.log(`🚨 DEPLOYMENT ALERT: ${alert.message}`);
  console.log('='.repeat(60));
  console.log(`Environment: ${alert.environment}`);
  console.log(`Type: ${alert.type}`);
  console.log(`Time: ${alert.details.timestamp}`);
  console.log(`Details: ${JSON.stringify(alert.details, null, 2)}`);
  console.log('='.repeat(60) + '\n');
}

// Main monitoring function
async function runHealthCheck() {
  log('Starting deployment health check...');
  
  const previousStatus = loadPreviousStatus();
  const currentStatus = {};
  
  // Check all environments
  for (const [envName, envConfig] of Object.entries(CONFIG.environments)) {
    try {
      currentStatus[envName] = await checkEnvironment(envName, envConfig);
    } catch (error) {
      log(`Error checking ${envName}: ${error.message}`, 'ERROR');
      currentStatus[envName] = {
        environment: envName,
        timestamp: new Date().toISOString(),
        overall: 'unknown',
        error: error.message
      };
    }
  }
  
  // Save current status
  saveStatus(currentStatus);
  
  // Check for failures and send alerts
  const alerts = checkForFailures(currentStatus, previousStatus);
  
  // Send alerts
  for (const alert of alerts) {
    sendAlert(alert);
  }
  
  // Log summary
  log('Deployment health check completed');
  for (const [envName, envStatus] of Object.entries(currentStatus)) {
    log(`${envName}: ${envStatus.overall} (Backend: ${envStatus.backend?.overall || 'unknown'}, Frontend: ${envStatus.frontend?.overall || 'unknown'})`);
  }
  
  if (alerts.length > 0) {
    log(`${alerts.length} alerts generated`, 'WARN');
  } else {
    log('All environments healthy', 'INFO');
  }
  
  return { currentStatus, alerts };
}

// Continuous monitoring
async function startContinuousMonitoring() {
  log('Starting continuous deployment monitoring...');
  
  // Run initial check
  await runHealthCheck();
  
  // Set up interval
  setInterval(async () => {
    try {
      await runHealthCheck();
    } catch (error) {
      log(`Error in continuous monitoring: ${error.message}`, 'ERROR');
    }
  }, CONFIG.checkInterval);
  
  log(`Monitoring active - checking every ${CONFIG.checkInterval / 1000 / 60} minutes`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    startContinuousMonitoring();
  } else if (args.includes('--once') || args.includes('-o')) {
    runHealthCheck().then(() => {
      process.exit(0);
    }).catch((error) => {
      log(`Health check failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
  } else {
    console.log('Novara Deployment Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/deployment-monitor.js --once    # Run single check');
    console.log('  node scripts/deployment-monitor.js --continuous  # Start continuous monitoring');
    console.log('');
    console.log('Options:');
    console.log('  --once, -o        Run a single health check');
    console.log('  --continuous, -c  Start continuous monitoring');
    process.exit(0);
  }
}

module.exports = {
  runHealthCheck,
  startContinuousMonitoring,
  CONFIG
}; 