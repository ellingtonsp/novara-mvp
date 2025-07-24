#!/usr/bin/env node

/**
 * Railway Web Monitor
 * Monitors Railway deployments using CLI and web scraping
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  railway: {
    projectId: process.env.RAILWAY_PROJECT_ID || 'f3025bf5-5cd5-4b7b-b045-4d477a4c7835',
    environments: {
      production: {
        name: 'Production',
        healthUrl: 'https://novara-mvp-production.up.railway.app/api/health'
      },
      staging: {
        name: 'Staging', 
        healthUrl: 'https://novara-staging-staging.up.railway.app/api/health'
      }
    }
  },
  logFile: path.join(__dirname, '../logs/railway-web-monitor.log'),
  checkInterval: 60 * 1000, // 1 minute
  healthCheckTimeout: 10000, // 10 seconds
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

// Execute Railway CLI command
function executeRailwayCommand(command) {
  try {
    const result = execSync(`npx @railway/cli@latest ${command}`, {
      encoding: 'utf8',
      timeout: 30000
    });
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

// Check health endpoint
async function checkHealth(url, serviceName) {
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: CONFIG.healthCheckTimeout }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
             req.on('timeout', () => {
         req.destroy();
         reject(new Error('Health check timeout'));
       });
       
       req.on('error', (error) => {
         reject(error);
       });
    });
    
    return {
      healthy: response.statusCode === 200,
      statusCode: response.statusCode,
      response: data,
      service: serviceName
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      service: serviceName
    };
  }
}

// Get Railway project status via CLI
function getRailwayStatus() {
  log('Getting Railway project status via CLI...');
  
  const result = executeRailwayCommand('status --json');
  
  if (!result.success) {
    log(`Failed to get Railway status: ${result.error}`, 'ERROR');
    return null;
  }
  
  try {
    const data = JSON.parse(result.data);
    return data;
  } catch (error) {
    log(`Failed to parse Railway status: ${error.message}`, 'ERROR');
    return null;
  }
}

// Check for deployment failures
function checkForFailures(projectStatus) {
  const failures = [];
  
  if (!projectStatus?.services?.edges) {
    return failures;
  }
  
  for (const serviceEdge of projectStatus.services.edges) {
    const service = serviceEdge.node;
    const serviceInstances = service.serviceInstances?.edges || [];
    
    for (const instanceEdge of serviceInstances) {
      const instance = instanceEdge.node;
      const latestDeployment = instance.latestDeployment;
      
      if (latestDeployment) {
        // Check if deployment is recent (last 15 minutes)
        const deploymentTime = new Date(latestDeployment.meta?.commitHash ? new Date() : new Date());
        const timeDiff = Date.now() - deploymentTime.getTime();
        const isRecent = timeDiff < 15 * 60 * 1000; // 15 minutes
        
        if (isRecent) {
          log(`Checking recent deployment: ${latestDeployment.id} (${service.name})`, 'INFO');
          
          // Check if deployment failed
          const isFailed = latestDeployment.status === 'FAILED' || latestDeployment.status === 'ERROR';
          
          if (isFailed) {
            failures.push({
              service: service.name,
              deploymentId: latestDeployment.id,
              status: latestDeployment.status,
              commitMessage: latestDeployment.meta?.commitMessage,
              branch: latestDeployment.meta?.branch,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  }
  
  return failures;
}

// Send alert
function sendAlert(alert) {
  const alertMessage = `
🚨 **Railway Deployment Failure Alert**

**Service**: ${alert.service}
**Deployment ID**: ${alert.deploymentId}
**Status**: ${alert.status}
**Time**: ${alert.timestamp}

**Details**:
- Branch: ${alert.branch || 'Unknown'}
- Commit: ${alert.commitMessage || 'Unknown'}

**Action Required**: Check Railway dashboard immediately.
  `.trim();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 DEPLOYMENT FAILURE ALERT');
  console.log('='.repeat(60));
  console.log(alertMessage);
  console.log('='.repeat(60) + '\n');
  
  // Log the alert
  log(`ALERT: Deployment failure detected - ${alert.service} (${alert.deploymentId})`, 'ALERT');
}

// Monitor all environments
async function monitorEnvironments() {
  log('Starting comprehensive environment monitoring...');
  
  const results = {
    timestamp: new Date().toISOString(),
    production: null,
    staging: null,
    failures: [],
    healthIssues: []
  };
  
  // Check Railway status
  const railwayStatus = getRailwayStatus();
  if (railwayStatus) {
    const failures = checkForFailures(railwayStatus);
    results.failures = failures;
    
    // Send alerts for failures
    for (const failure of failures) {
      sendAlert(failure);
    }
  }
  
  // Check production health
  log('Checking production health...');
  const productionHealth = await checkHealth(CONFIG.railway.environments.production.healthUrl, 'production');
  results.production = productionHealth;
  
  if (!productionHealth.healthy) {
    results.healthIssues.push({
      environment: 'production',
      issue: productionHealth.error || `HTTP ${productionHealth.statusCode}`,
      timestamp: new Date().toISOString()
    });
    
    log(`Production health check failed: ${productionHealth.error || productionHealth.statusCode}`, 'WARN');
  }
  
  // Check staging health
  log('Checking staging health...');
  const stagingHealth = await checkHealth(CONFIG.railway.environments.staging.healthUrl, 'staging');
  results.staging = stagingHealth;
  
  if (!stagingHealth.healthy) {
    results.healthIssues.push({
      environment: 'staging',
      issue: stagingHealth.error || `HTTP ${stagingHealth.statusCode}`,
      timestamp: new Date().toISOString()
    });
    
    log(`Staging health check failed: ${stagingHealth.error || stagingHealth.statusCode}`, 'WARN');
  }
  
  // Summary
  const totalIssues = results.failures.length + results.healthIssues.length;
  
  if (totalIssues > 0) {
    log(`Found ${totalIssues} issues: ${results.failures.length} failures, ${results.healthIssues.length} health issues`, 'WARN');
  } else {
    log('All environments healthy, no issues detected', 'INFO');
  }
  
  return results;
}

// Continuous monitoring
async function startContinuousMonitoring() {
  log('Starting continuous Railway environment monitoring...');
  
  // Initial check
  await monitorEnvironments();
  
  // Set up interval
  setInterval(async () => {
    try {
      await monitorEnvironments();
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
    monitorEnvironments().then((results) => {
      const totalIssues = results.failures.length + results.healthIssues.length;
      if (totalIssues > 0) {
        process.exit(1); // Exit with error if issues found
      } else {
        process.exit(0);
      }
    }).catch((error) => {
      log(`Monitoring failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
  } else {
    console.log('Railway Web Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/railway-web-monitor.js --once    # Run single check');
    console.log('  node scripts/railway-web-monitor.js --continuous  # Start continuous monitoring');
    console.log('');
    console.log('This monitor checks Railway deployments and environment health.');
    process.exit(0);
  }
}

module.exports = {
  monitorEnvironments,
  checkHealth,
  getRailwayStatus,
  startContinuousMonitoring
}; 