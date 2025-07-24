#!/usr/bin/env node

/**
 * Platform-Specific Deployment Monitor
 * Monitors Railway and Vercel deployment status through their APIs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  railway: {
    apiUrl: 'https://backboard.railway.app/graphql/v2',
    projectId: process.env.RAILWAY_PROJECT_ID,
    token: process.env.RAILWAY_TOKEN
  },
  vercel: {
    apiUrl: 'https://api.vercel.com/v1',
    token: process.env.VERCEL_TOKEN,
    teamId: process.env.VERCEL_TEAM_ID
  },
  logFile: path.join(__dirname, '../logs/platform-monitor.log'),
  statusFile: path.join(__dirname, '../logs/platform-status.json')
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
        'User-Agent': 'Novara-Platform-Monitor/1.0',
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

// Check Railway deployment status
async function checkRailwayStatus() {
  if (!CONFIG.railway.token || !CONFIG.railway.projectId) {
    log('Railway credentials not configured', 'WARN');
    return { status: 'not_configured' };
  }
  
  try {
    // First, get project information
    const projectQuery = `
      query {
        project(id: "${CONFIG.railway.projectId}") {
          id
          name
          services {
            nodes {
              id
              name
              deployments {
                nodes {
                  id
                  status
                  createdAt
                  meta {
                    image
                    buildLogs
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const projectResponse = await makeRequest(CONFIG.railway.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.railway.token}`
      },
      body: JSON.stringify({ query: projectQuery })
    });
    
    if (projectResponse.statusCode === 200) {
      const projectData = JSON.parse(projectResponse.data);
      
      // Get detailed deployment information
      const deploymentsQuery = `
        query {
          deployments(projectId: "${CONFIG.railway.projectId}", limit: 20) {
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
      
      const deploymentsResponse = await makeRequest(CONFIG.railway.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.railway.token}`
        },
        body: JSON.stringify({ query: deploymentsQuery })
      });
      
      if (deploymentsResponse.statusCode === 200) {
        const deploymentsData = JSON.parse(deploymentsResponse.data);
        
        return {
          status: 'success',
          data: {
            project: projectData.data?.project,
            deployments: deploymentsData.data?.deployments
          }
        };
      } else {
        return {
          status: 'error',
          error: `Deployments API: HTTP ${deploymentsResponse.statusCode}`,
          data: deploymentsResponse.data
        };
      }
    } else {
      return {
        status: 'error',
        error: `Project API: HTTP ${projectResponse.statusCode}`,
        data: projectResponse.data
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Check Vercel deployment status
async function checkVercelStatus() {
  if (!CONFIG.vercel.token) {
    log('Vercel token not configured', 'WARN');
    return { status: 'not_configured' };
  }
  
  try {
    const url = `${CONFIG.vercel.apiUrl}/deployments?teamId=${CONFIG.vercel.teamId || ''}&limit=10`;
    
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.vercel.token}`
      }
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      return {
        status: 'success',
        data: data
      };
    } else {
      return {
        status: 'error',
        error: `HTTP ${response.statusCode}`,
        data: response.data
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Analyze deployment status
function analyzeDeployments(railwayStatus, vercelStatus) {
  const analysis = {
    timestamp: new Date().toISOString(),
    railway: {
      status: 'unknown',
      deployments: [],
      issues: []
    },
    vercel: {
      status: 'unknown',
      deployments: [],
      issues: []
    },
    overall: 'unknown'
  };
  
  // Analyze Railway
  if (railwayStatus.status === 'success') {
    const services = railwayStatus.data?.project?.services?.nodes || [];
    let hasFailures = false;
    
    for (const service of services) {
      const deployments = service.deployments?.nodes || [];
      const latestDeployment = deployments[0];
      
      if (latestDeployment) {
        analysis.railway.deployments.push({
          service: service.name,
          status: latestDeployment.status,
          createdAt: latestDeployment.createdAt,
          id: latestDeployment.id
        });
        
        if (latestDeployment.status === 'FAILED') {
          hasFailures = true;
          analysis.railway.issues.push({
            service: service.name,
            deploymentId: latestDeployment.id,
            status: 'FAILED',
            createdAt: latestDeployment.createdAt
          });
        }
      }
    }
    
    analysis.railway.status = hasFailures ? 'unhealthy' : 'healthy';
  } else if (railwayStatus.status === 'not_configured') {
    analysis.railway.status = 'not_configured';
  } else {
    analysis.railway.status = 'error';
    analysis.railway.issues.push({
      error: railwayStatus.error
    });
  }
  
  // Analyze Vercel
  if (vercelStatus.status === 'success') {
    const deployments = vercelStatus.data?.deployments || [];
    let hasFailures = false;
    
    for (const deployment of deployments) {
      analysis.vercel.deployments.push({
        id: deployment.uid,
        status: deployment.readyState,
        createdAt: deployment.createdAt,
        url: deployment.url
      });
      
      if (deployment.readyState === 'ERROR') {
        hasFailures = true;
        analysis.vercel.issues.push({
          deploymentId: deployment.uid,
          status: 'ERROR',
          createdAt: deployment.createdAt,
          url: deployment.url
        });
      }
    }
    
    analysis.vercel.status = hasFailures ? 'unhealthy' : 'healthy';
  } else if (vercelStatus.status === 'not_configured') {
    analysis.vercel.status = 'not_configured';
  } else {
    analysis.vercel.status = 'error';
    analysis.vercel.issues.push({
      error: vercelStatus.error
    });
  }
  
  // Determine overall status
  const railwayHealthy = analysis.railway.status === 'healthy' || analysis.railway.status === 'not_configured';
  const vercelHealthy = analysis.vercel.status === 'healthy' || analysis.vercel.status === 'not_configured';
  
  analysis.overall = railwayHealthy && vercelHealthy ? 'healthy' : 'unhealthy';
  
  return analysis;
}

// Check for new issues
function checkForNewIssues(currentAnalysis, previousAnalysis) {
  const alerts = [];
  
  if (!previousAnalysis) {
    // First run - just log current status
    return alerts;
  }
  
  // Check Railway issues
  if (currentAnalysis.railway.status === 'unhealthy' && 
      previousAnalysis.railway.status === 'healthy') {
    alerts.push({
      type: 'railway_deployment_failure',
      message: '🚨 Railway deployment failure detected!',
      details: {
        issues: currentAnalysis.railway.issues,
        timestamp: currentAnalysis.timestamp
      }
    });
  }
  
  // Check Vercel issues
  if (currentAnalysis.vercel.status === 'unhealthy' && 
      previousAnalysis.vercel.status === 'healthy') {
    alerts.push({
      type: 'vercel_deployment_failure',
      message: '🚨 Vercel deployment failure detected!',
      details: {
        issues: currentAnalysis.vercel.issues,
        timestamp: currentAnalysis.timestamp
      }
    });
  }
  
  // Check for new specific deployment failures
  const currentRailwayIssues = currentAnalysis.railway.issues.map(i => i.deploymentId || i.service);
  const previousRailwayIssues = previousAnalysis.railway.issues.map(i => i.deploymentId || i.service);
  
  for (const issue of currentAnalysis.railway.issues) {
    const issueId = issue.deploymentId || issue.service;
    if (!previousRailwayIssues.includes(issueId)) {
      alerts.push({
        type: 'railway_new_failure',
        message: `⚠️ New Railway deployment failure: ${issue.service || issueId}`,
        details: {
          issue: issue,
          timestamp: currentAnalysis.timestamp
        }
      });
    }
  }
  
  return alerts;
}

// Send alert
function sendAlert(alert) {
  log(`🚨 PLATFORM ALERT: ${alert.message}`, 'ALERT');
  log(`Details: ${JSON.stringify(alert.details, null, 2)}`, 'ALERT');
  
  console.log('\n' + '='.repeat(60));
  console.log(`🚨 PLATFORM ALERT: ${alert.message}`);
  console.log('='.repeat(60));
  console.log(`Type: ${alert.type}`);
  console.log(`Time: ${alert.details.timestamp}`);
  console.log(`Details: ${JSON.stringify(alert.details, null, 2)}`);
  console.log('='.repeat(60) + '\n');
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
  return null;
}

// Save current status
function saveStatus(status) {
  try {
    fs.writeFileSync(CONFIG.statusFile, JSON.stringify(status, null, 2));
  } catch (error) {
    log(`Error saving status: ${error.message}`, 'ERROR');
  }
}

// Main monitoring function
async function runPlatformCheck() {
  log('Starting platform deployment check...');
  
  const previousAnalysis = loadPreviousStatus();
  
  // Check both platforms
  const railwayStatus = await checkRailwayStatus();
  const vercelStatus = await checkVercelStatus();
  
  // Analyze results
  const analysis = analyzeDeployments(railwayStatus, vercelStatus);
  
  // Save current status
  saveStatus(analysis);
  
  // Check for new issues
  const alerts = checkForNewIssues(analysis, previousAnalysis);
  
  // Send alerts
  for (const alert of alerts) {
    sendAlert(alert);
  }
  
  // Log summary
  log('Platform check completed');
  log(`Railway: ${analysis.railway.status} (${analysis.railway.deployments.length} deployments, ${analysis.railway.issues.length} issues)`);
  log(`Vercel: ${analysis.vercel.status} (${analysis.vercel.deployments.length} deployments, ${analysis.vercel.issues.length} issues)`);
  log(`Overall: ${analysis.overall}`);
  
  if (alerts.length > 0) {
    log(`${alerts.length} platform alerts generated`, 'WARN');
  } else {
    log('All platforms healthy', 'INFO');
  }
  
  return { analysis, alerts };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--once') || args.includes('-o')) {
    runPlatformCheck().then(() => {
      process.exit(0);
    }).catch((error) => {
      log(`Platform check failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
  } else {
    console.log('Novara Platform Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/platform-monitor.js --once    # Run single check');
    console.log('');
    console.log('Environment Variables:');
    console.log('  RAILWAY_TOKEN      Railway API token');
    console.log('  RAILWAY_PROJECT_ID Railway project ID');
    console.log('  VERCEL_TOKEN       Vercel API token');
    console.log('  VERCEL_TEAM_ID     Vercel team ID (optional)');
    process.exit(0);
  }
}

module.exports = {
  runPlatformCheck,
  checkRailwayStatus,
  checkVercelStatus,
  CONFIG
}; 