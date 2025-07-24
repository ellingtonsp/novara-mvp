#!/usr/bin/env node

/**
 * Railway Deployment Failure Monitor
 * Real-time monitoring for deployment failures and health check issues
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Import centralized configuration
const { RAILWAY_CONFIG, MONITORING_CONFIG } = require('./environment-config');

// Configuration
const CONFIG = {
  railway: RAILWAY_CONFIG,
  logFile: path.join(__dirname, '../logs/railway-failures.log'),
  checkInterval: 30 * 1000, // 30 seconds
  healthCheckTimeout: 300000, // 5 minutes
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
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'User-Agent': 'Novara-Railway-Failure-Monitor/1.0',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.railway.token}`,
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
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

// Get Railway project status
async function getRailwayStatus() {
  try {
    // Use a simpler query that should work
    const query = `
      query {
        project(id: "${CONFIG.railway.projectId}") {
          id
          name
          services {
            nodes {
              id
              name
              serviceInstances {
                nodes {
                  id
                  latestDeployment {
                    id
                    status
                    createdAt
                    meta {
                      reason
                      commitMessage
                      branch
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await makeRequest(CONFIG.railway.apiUrl, {
      body: JSON.stringify({ query })
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      return data.data?.project;
    } else {
      log(`Railway API error: HTTP ${response.statusCode}`, 'ERROR');
      log(`Response: ${response.data}`, 'ERROR');
      return null;
    }
  } catch (error) {
    log(`Railway API request failed: ${error.message}`, 'ERROR');
    return null;
  }
}

// Check deployment health
async function checkDeploymentHealth(deploymentId, serviceName) {
  try {
    // Try to access the health endpoint
    const healthUrl = `https://novara-mvp-production.up.railway.app/api/health`;
    
    const response = await new Promise((resolve, reject) => {
      const req = https.get(healthUrl, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });
    
    return {
      healthy: response.statusCode === 200,
      statusCode: response.statusCode,
      response: data
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

// Load failure history
function loadFailureHistory() {
  const historyFile = path.join(__dirname, '../data/failure-history.json');
  try {
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    log(`Failed to load failure history: ${error.message}`, 'ERROR');
  }
  return { failures: [], lastCheck: null };
}

// Save failure history
function saveFailureHistory(data) {
  const historyFile = path.join(__dirname, '../data/failure-history.json');
  const dataDir = path.dirname(historyFile);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Failed to save failure history: ${error.message}`, 'ERROR');
  }
}

// Send alert
function sendAlert(alert) {
  const alertMessage = `
🚨 **Railway Deployment Failure Alert**

**Service**: ${alert.service}
**Deployment ID**: ${alert.deploymentId}
**Status**: ${alert.status}
**Error**: ${alert.error}
**Time**: ${alert.timestamp}

**Details**:
- Build Time: ${alert.buildTime || 'Unknown'}
- Health Check: ${alert.healthCheck ? 'Failed' : 'Unknown'}
- Branch: ${alert.branch || 'Unknown'}
- Commit: ${alert.commitMessage || 'Unknown'}

**Action Required**: Check Railway dashboard and logs immediately.
  `.trim();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 DEPLOYMENT FAILURE ALERT');
  console.log('='.repeat(60));
  console.log(alertMessage);
  console.log('='.repeat(60) + '\n');
  
  // Log the alert
  log(`ALERT: Deployment failure detected - ${alert.service} (${alert.deploymentId})`, 'ALERT');
  
  // TODO: Send to Slack, email, or other notification systems
  // For now, we'll just log it and display it prominently
}

// Monitor deployments for failures
async function monitorDeployments() {
  log('Checking Railway deployments for failures...');
  
  const project = await getRailwayStatus();
  if (!project) {
    log('Failed to get Railway project status', 'ERROR');
    return;
  }
  
  const history = loadFailureHistory();
  const currentTime = new Date().toISOString();
  let failuresFound = 0;
  
  for (const service of project.services?.nodes || []) {
    const serviceInstances = service.serviceInstances?.nodes || [];
    
    for (const instance of serviceInstances) {
      const deployment = instance.latestDeployment;
      
      if (!deployment) {
        continue;
      }
      
      // Check if this is a recent deployment (last 10 minutes)
      const deploymentTime = new Date(deployment.createdAt);
      const timeDiff = Date.now() - deploymentTime.getTime();
      const isRecent = timeDiff < 10 * 60 * 1000; // 10 minutes
      
      if (isRecent) {
        log(`Checking recent deployment: ${deployment.id} (${service.name})`, 'INFO');
        
        // Check deployment status
        const isFailed = deployment.status === 'FAILED' || deployment.status === 'ERROR';
        
        if (isFailed) {
          failuresFound++;
          
          // Check health endpoint
          const healthCheck = await checkDeploymentHealth(deployment.id, service.name);
          
          const alert = {
            service: service.name,
            deploymentId: deployment.id,
            status: deployment.status,
            error: 'Deployment failed',
            timestamp: currentTime,
            branch: deployment.meta?.branch,
            commitMessage: deployment.meta?.commitMessage,
            healthCheck: healthCheck.healthy,
            buildTime: 'Unknown' // Would need more detailed API access
          };
          
          // Check if we should alert (avoid spam)
          const recentFailures = history.failures.filter(f => 
            f.service === service.name && 
            Date.now() - new Date(f.timestamp).getTime() < 30 * 60 * 1000 // 30 minutes
          );
          
          if (recentFailures.length < CONFIG.alertThreshold) {
            sendAlert(alert);
          }
          
          // Record the failure
          history.failures.push(alert);
        }
      }
    }
  }
  
  history.lastCheck = currentTime;
  saveFailureHistory(history);
  
  if (failuresFound > 0) {
    log(`Found ${failuresFound} deployment failures`, 'WARN');
  } else {
    log('No deployment failures detected', 'INFO');
  }
  
  return failuresFound;
}

// Continuous monitoring
async function startContinuousMonitoring() {
  log('Starting continuous Railway deployment failure monitoring...');
  
  // Initial check
  await monitorDeployments();
  
  // Set up interval
  setInterval(async () => {
    try {
      await monitorDeployments();
    } catch (error) {
      log(`Error in continuous monitoring: ${error.message}`, 'ERROR');
    }
  }, CONFIG.checkInterval);
  
  log(`Monitoring active - checking every ${CONFIG.checkInterval / 1000} seconds`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    startContinuousMonitoring();
  } else if (args.includes('--once') || args.includes('-o')) {
    monitorDeployments().then((failures) => {
      if (failures > 0) {
        process.exit(1); // Exit with error if failures found
      } else {
        process.exit(0);
      }
    }).catch((error) => {
      log(`Monitoring failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
  } else {
    console.log('Railway Deployment Failure Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/railway-failure-monitor.js --once    # Run single check');
    console.log('  node scripts/railway-failure-monitor.js --continuous  # Start continuous monitoring');
    console.log('');
    console.log('This monitor checks for deployment failures and health check issues.');
    process.exit(0);
  }
}

module.exports = {
  monitorDeployments,
  getRailwayStatus,
  checkDeploymentHealth,
  startContinuousMonitoring
}; 