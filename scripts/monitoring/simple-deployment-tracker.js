#!/usr/bin/env node

/**
 * Simple Deployment Tracker
 * Manual deployment time tracking with monitoring capabilities
 */

const fs = require('fs');
const path = require('path');

// Import deployment time monitor functions
const { addDeploymentTime, loadDeploymentHistory, calculateStatistics, formatDuration } = require('./deployment-time-monitor.js');

// Configuration
const CONFIG = {
  logFile: path.join(__dirname, '../logs/simple-tracker.log'),
  deploymentFile: path.join(__dirname, '../data/deployments.json')
};

// Ensure directories exist
const logsDir = path.dirname(CONFIG.logFile);
const dataDir = path.dirname(CONFIG.deploymentFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
}

// Load manual deployments
function loadManualDeployments() {
  try {
    if (fs.existsSync(CONFIG.deploymentFile)) {
      const data = fs.readFileSync(CONFIG.deploymentFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    log(`Failed to load manual deployments: ${error.message}`, 'ERROR');
  }
  return { deployments: [] };
}

// Save manual deployments
function saveManualDeployments(data) {
  try {
    fs.writeFileSync(CONFIG.deploymentFile, JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Failed to save manual deployments: ${error.message}`, 'ERROR');
  }
}

// Add manual deployment
function addManualDeployment(deploymentId, duration, status = 'success', service = 'unknown', commitMessage = '') {
  const data = loadManualDeployments();
  
  const deployment = {
    id: deploymentId,
    duration: duration,
    status: status,
    service: service,
    commitMessage: commitMessage,
    timestamp: new Date().toISOString(),
    source: 'manual'
  };
  
  data.deployments.push(deployment);
  saveManualDeployments(data);
  
  // Also add to the main tracking system
  addDeploymentTime(deploymentId, duration, status);
  
  log(`Added manual deployment: ${deploymentId} (${service}) - ${formatDuration(duration)}`, 'INFO');
  
  return deployment;
}

// Track deployments from Railway status (if available)
function trackFromRailwayStatus() {
  log('Attempting to track from Railway status...');
  
  // This would normally use Railway CLI or API
  // For now, we'll simulate with some sample data
  const sampleDeployments = [
    {
      id: 'sample-1',
      service: 'novara-staging',
      duration: 180000, // 3 minutes
      status: 'success',
      commitMessage: 'feat: implement Railway API monitoring'
    },
    {
      id: 'sample-2', 
      service: 'novara-main',
      duration: 150000, // 2.5 minutes
      status: 'success',
      commitMessage: 'fix: deployment time tracking'
    }
  ];
  
  let tracked = 0;
  for (const deployment of sampleDeployments) {
    const history = loadDeploymentHistory();
    const alreadyTracked = history.deployments.some(d => d.id === deployment.id);
    
    if (!alreadyTracked) {
      addManualDeployment(
        deployment.id,
        deployment.duration,
        deployment.status,
        deployment.service,
        deployment.commitMessage
      );
      tracked++;
    }
  }
  
  if (tracked > 0) {
    log(`Tracked ${tracked} sample deployments`, 'INFO');
  } else {
    log('No new deployments to track', 'INFO');
  }
  
  return tracked;
}

// Display comprehensive statistics
function displayStatistics() {
  const history = loadDeploymentHistory();
  const manualData = loadManualDeployments();
  
  if (history.deployments.length === 0 && manualData.deployments.length === 0) {
    console.log('No deployment history found.');
    return;
  }
  
  // Combine both sources
  const allDeployments = [
    ...history.deployments,
    ...manualData.deployments
  ];
  
  if (allDeployments.length === 0) {
    console.log('No deployments found.');
    return;
  }
  
  const stats = calculateStatistics(allDeployments);
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Deployment Statistics (Combined)');
  console.log('='.repeat(60));
  console.log(`📊 Total Deployments: ${stats.total}`);
  console.log(`⏱️  Average Duration: ${formatDuration(stats.average)}`);
  console.log(`⚡ Fastest Deployment: ${formatDuration(stats.fastest)}`);
  console.log(`🐌 Slowest Deployment: ${formatDuration(stats.slowest)}`);
  
  // Calculate success rate
  const successful = allDeployments.filter(d => d.status === 'success').length;
  const successRate = ((successful / stats.total) * 100).toFixed(1);
  console.log(`✅ Success Rate: ${successRate}%`);
  
  // Service breakdown
  const serviceStats = {};
  allDeployments.forEach(d => {
    const service = d.service || 'unknown';
    if (!serviceStats[service]) {
      serviceStats[service] = { count: 0, totalDuration: 0 };
    }
    serviceStats[service].count++;
    serviceStats[service].totalDuration += d.duration;
  });
  
  console.log('\n📈 Service Breakdown:');
  for (const [service, data] of Object.entries(serviceStats)) {
    const avgDuration = data.totalDuration / data.count;
    console.log(`  ${service}: ${data.count} deployments, avg ${formatDuration(avgDuration)}`);
  }
  
  if (stats.recent.length > 0) {
    console.log('\n📈 Recent Deployments:');
    for (const deployment of stats.recent.slice(-5)) {
      const status = deployment.status === 'success' ? '✅' : '❌';
      const service = deployment.service || 'unknown';
      console.log(`  ${status} ${deployment.id} (${service}): ${formatDuration(deployment.duration)}`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Interactive deployment tracking
function interactiveTracking() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🎯 Interactive Deployment Tracking');
  console.log('Enter deployment details (or press Enter to skip):\n');
  
  rl.question('Deployment ID: ', (deploymentId) => {
    if (!deploymentId.trim()) {
      rl.close();
      return;
    }
    
    rl.question('Duration (minutes): ', (durationStr) => {
      const duration = parseFloat(durationStr) * 60 * 1000; // Convert to milliseconds
      
      rl.question('Service name: ', (service) => {
        rl.question('Commit message: ', (commitMessage) => {
          rl.question('Status (success/failed): ', (status) => {
            addManualDeployment(
              deploymentId,
              duration,
              status || 'success',
              service || 'unknown',
              commitMessage || ''
            );
            
            console.log('\n✅ Deployment tracked successfully!');
            rl.close();
          });
        });
      });
    });
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    interactiveTracking();
  } else if (args.includes('--track') || args.includes('-t')) {
    trackFromRailwayStatus();
    displayStatistics();
  } else if (args.includes('--stats') || args.includes('-s')) {
    displayStatistics();
  } else if (args.includes('--add')) {
    // Add deployment: --add <id> <duration_minutes> <service> <status>
    if (args.length >= 5) {
      const [, , deploymentId, durationStr, service, status] = args;
      const duration = parseFloat(durationStr) * 60 * 1000;
      addManualDeployment(deploymentId, duration, status || 'success', service || 'unknown');
      displayStatistics();
    } else {
      console.log('Usage: --add <id> <duration_minutes> <service> <status>');
    }
  } else {
    console.log('Simple Deployment Tracker');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/simple-deployment-tracker.js --interactive  # Interactive mode');
    console.log('  node scripts/simple-deployment-tracker.js --track       # Track sample deployments');
    console.log('  node scripts/simple-deployment-tracker.js --stats       # Show statistics');
    console.log('  node scripts/simple-deployment-tracker.js --add <id> <duration> <service> <status>');
    console.log('');
    console.log('This tracker provides manual deployment tracking and monitoring.');
  }
}

module.exports = {
  addManualDeployment,
  trackFromRailwayStatus,
  displayStatistics,
  interactiveTracking
}; 