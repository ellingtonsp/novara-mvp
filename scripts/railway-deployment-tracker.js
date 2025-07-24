#!/usr/bin/env node

/**
 * Railway Deployment Tracker
 * Automatically tracks deployment times using Railway API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Import deployment time monitor functions
const { addDeploymentTime, loadDeploymentHistory, calculateStatistics, formatDuration } = require('./deployment-time-monitor.js');

// Configuration
const CONFIG = {
  railway: {
    apiUrl: 'https://backboard.railway.app/graphql/v2',
    projectId: process.env.RAILWAY_PROJECT_ID,
    token: process.env.RAILWAY_TOKEN
  },
  logFile: path.join(__dirname, '../logs/railway-tracker.log'),
  checkInterval: 2 * 60 * 1000, // 2 minutes
  maxDeployments: 50 // Track last 50 deployments
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
        'User-Agent': 'Novara-Railway-Tracker/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
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

// Get Railway deployments
async function getRailwayDeployments() {
  if (!CONFIG.railway.token || !CONFIG.railway.projectId) {
    log('Railway credentials not configured', 'WARN');
    return null;
  }
  
  try {
    const query = `
      query {
        deployments(projectId: "${CONFIG.railway.projectId}", limit: ${CONFIG.maxDeployments}) {
          nodes {
            id
            status
            createdAt
            updatedAt
            meta {
              image
              buildLogs
              startTime
              endTime
            }
            service {
              name
            }
          }
        }
      }
    `;
    
    const response = await makeRequest(CONFIG.railway.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.railway.token}`
      },
      body: JSON.stringify({ query })
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      return data.data?.deployments?.nodes || [];
    } else {
      log(`Railway API error: HTTP ${response.statusCode}`, 'ERROR');
      return null;
    }
  } catch (error) {
    log(`Railway API request failed: ${error.message}`, 'ERROR');
    return null;
  }
}

// Calculate deployment duration
function calculateDeploymentDuration(deployment) {
  if (!deployment.meta?.startTime || !deployment.meta?.endTime) {
    return null;
  }
  
  const startTime = new Date(deployment.meta.startTime).getTime();
  const endTime = new Date(deployment.meta.endTime).getTime();
  
  return endTime - startTime;
}

// Check if deployment is already tracked
function isDeploymentTracked(deploymentId) {
  const history = loadDeploymentHistory();
  return history.deployments.some(d => d.id === deploymentId);
}

// Track new deployments
async function trackNewDeployments() {
  log('Checking for new Railway deployments...');
  
  const deployments = await getRailwayDeployments();
  if (!deployments) {
    return;
  }
  
  let newDeployments = 0;
  let failedDeployments = 0;
  
  for (const deployment of deployments) {
    // Skip if already tracked
    if (isDeploymentTracked(deployment.id)) {
      continue;
    }
    
    // Calculate duration
    const duration = calculateDeploymentDuration(deployment);
    const status = deployment.status === 'SUCCESS' ? 'success' : 'failed';
    
    if (duration) {
      // Add to tracking
      addDeploymentTime(deployment.id, duration, status);
      newDeployments++;
      
      log(`Tracked deployment: ${deployment.id} (${formatDuration(duration)}, ${status})`, 'INFO');
      
      // Alert on slow deployments
      if (duration > 300000) { // 5 minutes
        log(`⚠️ Slow deployment detected: ${deployment.id} took ${formatDuration(duration)}`, 'WARN');
      }
    } else {
      // Failed deployment or missing timing data
      if (deployment.status !== 'SUCCESS') {
        failedDeployments++;
        log(`Failed deployment: ${deployment.id} (${deployment.status})`, 'WARN');
      }
    }
  }
  
  if (newDeployments > 0) {
    log(`Tracked ${newDeployments} new deployments`, 'INFO');
  }
  
  if (failedDeployments > 0) {
    log(`Found ${failedDeployments} failed deployments`, 'WARN');
  }
  
  return { newDeployments, failedDeployments };
}

// Display deployment statistics
function displayStatistics() {
  const history = loadDeploymentHistory();
  
  if (history.deployments.length === 0) {
    console.log('No deployment history found.');
    return;
  }
  
  const stats = calculateStatistics(history.deployments);
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Railway Deployment Statistics (Auto-Tracked)');
  console.log('='.repeat(60));
  console.log(`📊 Total Deployments: ${stats.total}`);
  console.log(`⏱️  Average Duration: ${formatDuration(stats.average)}`);
  console.log(`⚡ Fastest Deployment: ${formatDuration(stats.fastest)}`);
  console.log(`🐌 Slowest Deployment: ${formatDuration(stats.slowest)}`);
  
  // Calculate success rate
  const successful = history.deployments.filter(d => d.status === 'success').length;
  const successRate = ((successful / stats.total) * 100).toFixed(1);
  console.log(`✅ Success Rate: ${successRate}%`);
  
  if (stats.recent.length > 0) {
    console.log('\n📈 Recent Deployments:');
    for (const deployment of stats.recent.slice(-5)) {
      const status = deployment.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${deployment.id}: ${formatDuration(deployment.duration)} (${deployment.timestamp})`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Continuous tracking
async function startContinuousTracking() {
  log('Starting continuous Railway deployment tracking...');
  
  // Initial check
  await trackNewDeployments();
  displayStatistics();
  
  // Set up interval
  setInterval(async () => {
    try {
      await trackNewDeployments();
    } catch (error) {
      log(`Error in continuous tracking: ${error.message}`, 'ERROR');
    }
  }, CONFIG.checkInterval);
  
  log(`Tracking active - checking every ${CONFIG.checkInterval / 1000 / 60} minutes`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    startContinuousTracking();
  } else if (args.includes('--once') || args.includes('-o')) {
    trackNewDeployments().then(() => {
      displayStatistics();
      process.exit(0);
    }).catch((error) => {
      log(`Tracking failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
  } else {
    console.log('Railway Deployment Tracker');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/railway-deployment-tracker.js --once    # Run single check');
    console.log('  node scripts/railway-deployment-tracker.js --continuous  # Start continuous tracking');
    console.log('');
    console.log('Environment Variables:');
    console.log('  RAILWAY_TOKEN      Railway API token');
    console.log('  RAILWAY_PROJECT_ID Railway project ID');
    process.exit(0);
  }
}

module.exports = {
  trackNewDeployments,
  getRailwayDeployments,
  startContinuousTracking,
  displayStatistics
}; 