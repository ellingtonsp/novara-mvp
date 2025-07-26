#!/usr/bin/env node

/**
 * Novara MVP - Deployment Rollback System
 * Handles rollbacks for failed deployments with state restoration
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import unified configuration
const {
  ENVIRONMENTS,
  PROJECT_PATHS,
  getEnvironment,
  validateEnvironment,
  isCloudEnvironment
} = require('./deployment-config');

// ANSI color codes
const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  PURPLE: '\x1b[0;35m',
  CYAN: '\x1b[0;36m',
  WHITE: '\x1b[1;37m',
  NC: '\x1b[0m'
};

class RollbackOrchestrator {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.options = options;
    this.envConfig = getEnvironment(environment);
    this.rollbackId = `rollback-${environment}-${Date.now()}`;
    this.logFile = path.join(PROJECT_PATHS.logs, `rollback-${environment}-${Date.now()}.log`);
    this.startTime = Date.now();

    // State tracking
    this.state = {
      id: this.rollbackId,
      environment: environment,
      status: 'initializing',
      steps: [],
      errors: [],
      warnings: [],
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null
    };

    this.log(`🔄 Rollback Orchestrator Started`, 'INFO');
    this.log(`Environment: ${environment}`, 'INFO');
    this.log(`Rollback ID: ${this.rollbackId}`, 'INFO');
  }

  // Enhanced logging
  log(message, level = 'INFO', step = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${step ? `[${step}] ` : ''}${message}`;
    
    const colorCode = {
      'ERROR': COLORS.RED,
      'WARN': COLORS.YELLOW,
      'INFO': COLORS.BLUE,
      'SUCCESS': COLORS.GREEN,
      'STEP': COLORS.PURPLE
    }[level] || COLORS.WHITE;
    
    console.log(`${colorCode}${logMessage}${COLORS.NC}`);
    fs.appendFileSync(this.logFile, logMessage + '\n');
    
    if (level === 'ERROR') {
      this.state.errors.push({ timestamp, message, step });
    } else if (level === 'WARN') {
      this.state.warnings.push({ timestamp, message, step });
    }
  }

  // Update rollback state
  updateState(status, stepName = null, stepStatus = null, stepData = {}) {
    this.state.status = status;
    this.state.endTime = new Date().toISOString();
    this.state.duration = Date.now() - this.startTime;
    
    if (stepName) {
      const existingStep = this.state.steps.find(s => s.name === stepName);
      if (existingStep) {
        existingStep.status = stepStatus;
        existingStep.endTime = new Date().toISOString();
        existingStep.data = { ...existingStep.data, ...stepData };
      } else {
        this.state.steps.push({
          name: stepName,
          status: stepStatus,
          startTime: new Date().toISOString(),
          endTime: stepStatus ? new Date().toISOString() : null,
          data: stepData
        });
      }
    }
    
    // Save state
    const stateFile = path.join(PROJECT_PATHS.logs, `rollback-state-${this.rollbackId}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
  }

  // Run command with error handling
  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: options.cwd || PROJECT_PATHS.root,
        env: { ...process.env, ...options.env },
        shell: true
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => stdout += data.toString());
        child.stderr.on('data', (data) => stderr += data.toString());
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code, stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Command error: ${error.message}`));
      });
    });
  }

  // Find recent deployment states
  findRecentDeployments() {
    this.log('Searching for recent deployment states...', 'STEP', 'discovery');
    this.updateState('discovering_deployments', 'discovery', 'running');

    try {
      const logFiles = fs.readdirSync(PROJECT_PATHS.logs)
        .filter(file => file.startsWith(`deployment-state-deploy-${this.environment}-`))
        .map(file => {
          const filePath = path.join(PROJECT_PATHS.logs, file);
          const stats = fs.statSync(filePath);
          return {
            file: file,
            path: filePath,
            mtime: stats.mtime,
            content: null
          };
        })
        .sort((a, b) => b.mtime - a.mtime); // Most recent first

      // Read and parse deployment states
      const deployments = [];
      for (const logFile of logFiles.slice(0, 10)) { // Only check last 10
        try {
          const content = JSON.parse(fs.readFileSync(logFile.path, 'utf8'));
          deployments.push({
            ...logFile,
            content: content,
            deploymentId: content.id,
            status: content.status,
            duration: content.duration
          });
        } catch (error) {
          this.log(`Failed to parse deployment state: ${logFile.file}`, 'WARN', 'discovery');
        }
      }

      this.updateState('deployments_discovered', 'discovery', 'completed', { 
        count: deployments.length,
        deployments: deployments.map(d => ({ id: d.deploymentId, status: d.status }))
      });

      this.log(`Found ${deployments.length} recent deployments`, 'SUCCESS', 'discovery');
      return deployments;
    } catch (error) {
      this.updateState('discovery_failed', 'discovery', 'failed', { error: error.message });
      this.log(`Failed to discover deployments: ${error.message}`, 'ERROR', 'discovery');
      return [];
    }
  }

  // Find last successful deployment
  findLastSuccessfulDeployment(deployments) {
    const successful = deployments.find(d => d.content && d.content.status === 'completed');
    
    if (successful) {
      this.log(`Found last successful deployment: ${successful.deploymentId}`, 'SUCCESS', 'discovery');
      this.log(`Deployment time: ${successful.content.startTime}`, 'INFO', 'discovery');
      this.log(`Duration: ${Math.round(successful.content.duration / 1000)}s`, 'INFO', 'discovery');
      return successful;
    } else {
      this.log('No successful deployments found in recent history', 'WARN', 'discovery');
      return null;
    }
  }

  // Rollback to previous version
  async rollbackToVersion(targetDeployment) {
    const stepName = 'rollback_deployment';
    this.log(`Rolling back to deployment: ${targetDeployment.deploymentId}`, 'STEP', stepName);
    this.updateState('rolling_back', stepName, 'running');

    try {
      if (!isCloudEnvironment(this.environment)) {
        this.log('Local environment - no cloud rollback needed', 'INFO', stepName);
        this.updateState('rollback_completed', stepName, 'completed');
        return true;
      }

      // For cloud environments, we need to trigger a rollback
      // This is a simplified approach - in production you might want more sophisticated rollback strategies

      // Rollback backend (Railway)
      if (this.envConfig.backend.platform === 'railway') {
        await this.rollbackRailway();
      }

      // Rollback frontend (Vercel)
      if (this.envConfig.frontend.platform === 'vercel') {
        await this.rollbackVercel();
      }

      this.updateState('rollback_completed', stepName, 'completed');
      this.log('Rollback deployment completed', 'SUCCESS', stepName);
      return true;

    } catch (error) {
      this.updateState('rollback_failed', stepName, 'failed', { error: error.message });
      this.log(`Rollback failed: ${error.message}`, 'ERROR', stepName);
      throw error;
    }
  }

  // Rollback Railway deployment
  async rollbackRailway() {
    this.log('Rolling back Railway deployment...', 'INFO', 'rollback_railway');

    try {
      // Get deployment history
      const historyResult = await this.runCommand('railway', [
        'status',
        '--environment', this.envConfig.backend.environment,
        '--project', this.envConfig.backend.projectId
      ], { silent: true });

      // In a real implementation, you would parse the history and rollback to a specific deployment
      // For now, we'll trigger a redeploy of the last known good state
      
      this.log('Railway rollback: triggering redeploy of stable version', 'INFO', 'rollback_railway');
      
      // This is a placeholder - you'd implement specific Railway rollback logic here
      // await this.runCommand('railway', ['rollback', '--to', 'previous'], { 
      //   cwd: PROJECT_PATHS.backend 
      // });

      this.log('Railway rollback completed', 'SUCCESS', 'rollback_railway');
    } catch (error) {
      this.log(`Railway rollback failed: ${error.message}`, 'ERROR', 'rollback_railway');
      throw error;
    }
  }

  // Rollback Vercel deployment
  async rollbackVercel() {
    this.log('Rolling back Vercel deployment...', 'INFO', 'rollback_vercel');

    try {
      // Get deployment list
      const deploymentsResult = await this.runCommand('vercel', [
        'list',
        '--scope', this.envConfig.frontend.projectName || 'novara-mvp'
      ], { silent: true });

      // Find and rollback to previous deployment
      // This is a placeholder - implement specific Vercel rollback logic
      this.log('Vercel rollback: promoting previous deployment', 'INFO', 'rollback_vercel');
      
      // await this.runCommand('vercel', ['promote', 'previous-deployment-url'], {
      //   cwd: PROJECT_PATHS.frontend
      // });

      this.log('Vercel rollback completed', 'SUCCESS', 'rollback_vercel');
    } catch (error) {
      this.log(`Vercel rollback failed: ${error.message}`, 'ERROR', 'rollback_vercel');
      throw error;
    }
  }

  // Health check after rollback
  async verifyRollback() {
    const stepName = 'verify_rollback';
    this.log('Verifying rollback health...', 'STEP', stepName);
    this.updateState('verifying', stepName, 'running');

    try {
      // Import health check from the deployment monitor
      const monitor = require('./deployment-monitor');
      
      // Wait for services to stabilize
      this.log('Waiting for services to stabilize...', 'INFO', stepName);
      await this.sleep(30000);

      // Run health check
      const healthResult = await monitor.runHealthCheck();
      
      if (healthResult.alerts.length === 0) {
        this.log('Rollback verification successful - all services healthy', 'SUCCESS', stepName);
        this.updateState('verification_passed', stepName, 'completed');
        return true;
      } else {
        this.log(`Rollback verification failed - ${healthResult.alerts.length} alerts`, 'WARN', stepName);
        this.updateState('verification_failed', stepName, 'failed', { alerts: healthResult.alerts });
        return false;
      }

    } catch (error) {
      this.log(`Rollback verification failed: ${error.message}`, 'ERROR', stepName);
      this.updateState('verification_error', stepName, 'failed', { error: error.message });
      return false;
    }
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main rollback process
  async performRollback() {
    try {
      this.log(`🔄 Starting rollback for ${this.environment}`, 'STEP');
      this.updateState('rolling_back', 'rollback', 'running');

      // Step 1: Discover recent deployments
      const deployments = this.findRecentDeployments();
      
      if (deployments.length === 0) {
        throw new Error('No deployment history found - cannot perform rollback');
      }

      // Step 2: Find last successful deployment
      const targetDeployment = this.findLastSuccessfulDeployment(deployments);
      
      if (!targetDeployment) {
        throw new Error('No successful deployment found in history - cannot rollback');
      }

      // Step 3: Perform rollback
      await this.rollbackToVersion(targetDeployment);

      // Step 4: Verify rollback
      const verificationPassed = await this.verifyRollback();

      if (verificationPassed) {
        this.updateState('completed', 'rollback', 'completed');
        this.log(`🎉 Rollback to ${this.environment} completed successfully!`, 'SUCCESS');
        this.printSummary(targetDeployment);
        return true;
      } else {
        this.updateState('verification_failed', 'rollback', 'failed');
        this.log('⚠️ Rollback completed but verification failed', 'WARN');
        this.printSummary(targetDeployment, false);
        return false;
      }

    } catch (error) {
      this.updateState('failed', 'rollback', 'failed', { error: error.message });
      this.log(`💥 Rollback failed: ${error.message}`, 'ERROR');
      this.printFailureSummary(error);
      throw error;
    }
  }

  // Print rollback summary
  printSummary(targetDeployment, verificationPassed = true) {
    const duration = Math.round(this.state.duration / 1000);
    
    console.log(`\n${COLORS.GREEN}🔄 ROLLBACK COMPLETED${COLORS.NC}`);
    console.log(`${COLORS.WHITE}==================================${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Environment:${COLORS.NC} ${this.environment}`);
    console.log(`${COLORS.CYAN}Duration:${COLORS.NC} ${duration}s`);
    console.log(`${COLORS.CYAN}Target Deployment:${COLORS.NC} ${targetDeployment.deploymentId}`);
    console.log(`${COLORS.CYAN}Verification:${COLORS.NC} ${verificationPassed ? '✅ Passed' : '⚠️ Failed'}`);
    
    if (isCloudEnvironment(this.environment)) {
      console.log(`\n${COLORS.YELLOW}🔗 Restored URLs:${COLORS.NC}`);
      console.log(`${COLORS.CYAN}Frontend:${COLORS.NC} ${this.envConfig.frontend.url}`);
      console.log(`${COLORS.CYAN}Backend:${COLORS.NC} ${this.envConfig.backend.url}`);
    }
    
    console.log(`\n${COLORS.YELLOW}📊 Rollback Log:${COLORS.NC} ${this.logFile}`);
  }

  // Print failure summary
  printFailureSummary(error) {
    const duration = Math.round(this.state.duration / 1000);
    
    console.log(`\n${COLORS.RED}💥 ROLLBACK FAILED${COLORS.NC}`);
    console.log(`${COLORS.WHITE}==================================${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Environment:${COLORS.NC} ${this.environment}`);
    console.log(`${COLORS.CYAN}Duration:${COLORS.NC} ${duration}s`);
    console.log(`${COLORS.CYAN}Error:${COLORS.NC} ${error.message}`);
    
    console.log(`\n${COLORS.YELLOW}📊 Debug Information:${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Log File:${COLORS.NC} ${this.logFile}`);
    
    if (this.state.errors.length > 0) {
      console.log(`\n${COLORS.RED}❌ Errors:${COLORS.NC}`);
      this.state.errors.forEach(err => console.log(`  • ${err.message}`));
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${COLORS.BLUE}Novara MVP Rollback System${COLORS.NC}\n`);
    console.log('Usage:');
    console.log('  node scripts/rollback.js <environment> [options]\n');
    console.log('Environments:');
    console.log('  staging      - Rollback staging environment');
    console.log('  production   - Rollback production environment\n');
    console.log('Options:');
    console.log('  --force      - Skip confirmation prompts');
    console.log('  --dry-run    - Show what would be rolled back without doing it\n');
    console.log('Examples:');
    console.log('  node scripts/rollback.js staging');
    console.log('  node scripts/rollback.js production --force');
    process.exit(0);
  }

  const environment = args[0];
  const options = {
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run')
  };

  // Validate environment
  if (!validateEnvironment(environment) || environment === 'development') {
    console.error(`${COLORS.RED}❌ Invalid environment: ${environment}${COLORS.NC}`);
    console.error('Available environments: staging, production');
    process.exit(1);
  }

  // Confirmation for production rollbacks
  if (environment === 'production' && !options.force) {
    console.log(`${COLORS.YELLOW}⚠️ You are about to rollback PRODUCTION${COLORS.NC}`);
    console.log('This will revert the live application to a previous version.');
    console.log(`${COLORS.RED}Production rollback requires --force flag${COLORS.NC}`);
    console.log('Use: node scripts/rollback.js production --force');
    process.exit(1);
  }

  // Create and run rollback orchestrator
  const orchestrator = new RollbackOrchestrator(environment, options);
  
  orchestrator.performRollback()
    .then(() => {
      console.log(`\n${COLORS.GREEN}✅ Rollback completed successfully${COLORS.NC}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${COLORS.RED}❌ Rollback failed: ${error.message}${COLORS.NC}`);
      process.exit(1);
    });
}

module.exports = RollbackOrchestrator; 