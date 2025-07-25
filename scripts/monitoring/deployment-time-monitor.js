#!/usr/bin/env node

/**
 * Railway Deployment Time Monitor
 * Tracks deployment duration and alerts on slow deployments
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  logFile: path.join(__dirname, '../logs/deployment-times.log'),
  statusFile: path.join(__dirname, '../logs/deployment-times.json'),
  thresholds: {
    warning: 300000, // 5 minutes
    critical: 600000  // 10 minutes
  }
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

// Load deployment history
function loadDeploymentHistory() {
  try {
    if (fs.existsSync(CONFIG.statusFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.statusFile, 'utf8'));
    }
  } catch (error) {
    log(`Error loading deployment history: ${error.message}`, 'WARN');
  }
  return { deployments: [], statistics: {} };
}

// Save deployment history
function saveDeploymentHistory(history) {
  try {
    fs.writeFileSync(CONFIG.statusFile, JSON.stringify(history, null, 2));
  } catch (error) {
    log(`Error saving deployment history: ${error.message}`, 'ERROR');
  }
}

// Calculate deployment statistics
function calculateStatistics(deployments) {
  if (deployments.length === 0) {
    return {
      total: 0,
      average: 0,
      fastest: 0,
      slowest: 0,
      recent: []
    };
  }
  
  const durations = deployments.map(d => d.duration);
  const recent = deployments.slice(-10); // Last 10 deployments
  
  return {
    total: deployments.length,
    average: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    fastest: Math.min(...durations),
    slowest: Math.max(...durations),
    recent: recent.map(d => ({
      id: d.id,
      duration: d.duration,
      timestamp: d.timestamp,
      status: d.status
    }))
  };
}

// Check for slow deployments
function checkSlowDeployments(deployments) {
  const alerts = [];
  
  for (const deployment of deployments) {
    if (deployment.duration > CONFIG.thresholds.critical) {
      alerts.push({
        type: 'critical_slow_deployment',
        deployment: deployment,
        message: `🚨 CRITICAL: Deployment took ${Math.round(deployment.duration / 1000)}s (${Math.round(deployment.duration / 60000)}min)`,
        severity: 'critical'
      });
    } else if (deployment.duration > CONFIG.thresholds.warning) {
      alerts.push({
        type: 'warning_slow_deployment',
        deployment: deployment,
        message: `⚠️ WARNING: Deployment took ${Math.round(deployment.duration / 1000)}s (${Math.round(deployment.duration / 60000)}min)`,
        severity: 'warning'
      });
    }
  }
  
  return alerts;
}

// Format duration for display
function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(ms / 60000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Display deployment statistics
function displayStatistics(statistics) {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Railway Deployment Statistics');
  console.log('='.repeat(60));
  console.log(`📊 Total Deployments: ${statistics.total}`);
  console.log(`⏱️  Average Duration: ${formatDuration(statistics.average)}`);
  console.log(`⚡ Fastest Deployment: ${formatDuration(statistics.fastest)}`);
  console.log(`🐌 Slowest Deployment: ${formatDuration(statistics.slowest)}`);
  
  if (statistics.recent.length > 0) {
    console.log('\n📈 Recent Deployments:');
    for (const deployment of statistics.recent) {
      const status = deployment.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${deployment.id}: ${formatDuration(deployment.duration)} (${deployment.timestamp})`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Manual deployment time entry (for tracking)
function addDeploymentTime(deploymentId, duration, status = 'success') {
  const history = loadDeploymentHistory();
  
  const deployment = {
    id: deploymentId,
    duration: duration,
    timestamp: new Date().toISOString(),
    status: status
  };
  
  history.deployments.push(deployment);
  
  // Keep only last 100 deployments
  if (history.deployments.length > 100) {
    history.deployments = history.deployments.slice(-100);
  }
  
  // Recalculate statistics
  history.statistics = calculateStatistics(history.deployments);
  
  saveDeploymentHistory(history);
  
  // Check for slow deployments
  const alerts = checkSlowDeployments([deployment]);
  
  if (alerts.length > 0) {
    for (const alert of alerts) {
      log(alert.message, alert.severity.toUpperCase());
    }
  }
  
  return deployment;
}

// Main function
function main() {
  const history = loadDeploymentHistory();
  
  if (history.deployments.length === 0) {
    console.log('No deployment history found.');
    console.log('Use this script to track deployment times:');
    console.log('  node scripts/deployment-time-monitor.js add <deployment-id> <duration-ms>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/deployment-time-monitor.js add "deploy_123" 180000');
    return;
  }
  
  displayStatistics(history.statistics);
  
  // Check for slow deployments
  const alerts = checkSlowDeployments(history.deployments);
  
  if (alerts.length > 0) {
    console.log('🚨 Slow Deployment Alerts:');
    for (const alert of alerts) {
      console.log(`  ${alert.message}`);
    }
  } else {
    console.log('✅ All deployments within acceptable time limits');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'add' && args.length >= 3) {
    const deploymentId = args[1];
    const duration = parseInt(args[2]);
    const status = args[3] || 'success';
    
    if (isNaN(duration)) {
      console.error('Duration must be a number (milliseconds)');
      process.exit(1);
    }
    
    const deployment = addDeploymentTime(deploymentId, duration, status);
    console.log(`✅ Added deployment: ${deployment.id} (${formatDuration(duration)})`);
    
    // Show updated statistics
    const history = loadDeploymentHistory();
    displayStatistics(history.statistics);
  } else {
    main();
  }
}

module.exports = {
  addDeploymentTime,
  loadDeploymentHistory,
  calculateStatistics,
  checkSlowDeployments,
  formatDuration
}; 