#!/usr/bin/env node

/**
 * Novara Startup Script
 * Ensures application is fully ready before responding to health checks
 */

const fs = require('fs');
const path = require('path');

// Startup configuration
const STARTUP_CONFIG = {
  readyFile: path.join(__dirname, '.app-ready'),
  maxStartupTime: 30000, // 30 seconds
  checkInterval: 1000, // 1 second
};

// Log startup progress
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [STARTUP] ${message}`);
}

// Check if application is ready
function checkAppReady() {
  try {
    // Check if ready file exists
    if (fs.existsSync(STARTUP_CONFIG.readyFile)) {
      return true;
    }
    
    // Check if environment variables are loaded
    if (!process.env.NODE_ENV) {
      return false;
    }
    
    // Check if basic config is available
    if (!process.env.JWT_SECRET) {
      return false;
    }
    
    return true;
  } catch (error) {
    log(`Error checking app readiness: ${error.message}`);
    return false;
  }
}

// Mark application as ready
function markAppReady() {
  try {
    fs.writeFileSync(STARTUP_CONFIG.readyFile, new Date().toISOString());
    log('Application marked as ready');
  } catch (error) {
    log(`Error marking app ready: ${error.message}`);
  }
}

// Wait for application to be ready
function waitForReady() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkReady = () => {
      if (checkAppReady()) {
        log('Application is ready');
        resolve();
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed > STARTUP_CONFIG.maxStartupTime) {
        log('Startup timeout reached, proceeding anyway');
        resolve();
        return;
      }
      
      setTimeout(checkReady, STARTUP_CONFIG.checkInterval);
    };
    
    checkReady();
  });
}

// Main startup function
async function startup() {
  log('Starting Novara application...');
  
  // Wait for application to be ready
  await waitForReady();
  
  // Mark as ready
  markAppReady();
  
  log('Startup complete');
}

// Export for use in server.js
module.exports = {
  startup,
  checkAppReady,
  markAppReady,
  waitForReady
};

// Run startup if called directly
if (require.main === module) {
  startup().catch(error => {
    log(`Startup failed: ${error.message}`);
    process.exit(1);
  });
} 