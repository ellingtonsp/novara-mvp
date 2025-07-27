#!/usr/bin/env node

/**
 * Novara MVP - Deployment Orchestrator
 * Self-contained deployment system that works first time, every time
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Import our unified configuration
const {
  ENVIRONMENTS,
  PLATFORM_CONFIG,
  DEPLOYMENT_SEQUENCE,
  HEALTH_CHECK_CONFIG,
  REQUIRED_TOOLS,
  PROJECT_PATHS,
  getEnvironment,
  getPlatformConfig,
  validateEnvironment,
  isCloudEnvironment
} = require('./deployment-config');

// ANSI color codes for output
const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  PURPLE: '\x1b[0;35m',
  CYAN: '\x1b[0;36m',
  WHITE: '\x1b[1;37m',
  NC: '\x1b[0m' // No Color
};

class DeploymentOrchestrator {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.options = options;
    this.envConfig = getEnvironment(environment);
    this.logFile = path.join(PROJECT_PATHS.logs, `deployment-${environment}-${Date.now()}.log`);
    this.deploymentId = `deploy-${environment}-${Date.now()}`;
    this.startTime = Date.now();
    
    // Create deployment state tracking
    this.state = {
      id: this.deploymentId,
      environment: environment,
      status: 'initializing',
      steps: [],
      errors: [],
      warnings: [],
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      rollbackData: {}
    };
    
    this.log(`🚀 Deployment Orchestrator Started`, 'INFO');
    this.log(`Environment: ${environment}`, 'INFO');
    this.log(`Deployment ID: ${this.deploymentId}`, 'INFO');
  }

  // Enhanced logging system
  log(message, level = 'INFO', step = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${step ? `[${step}] ` : ''}${message}`;
    
    // Console output with colors
    const colorCode = {
      'ERROR': COLORS.RED,
      'WARN': COLORS.YELLOW,
      'INFO': COLORS.BLUE,
      'SUCCESS': COLORS.GREEN,
      'STEP': COLORS.PURPLE
    }[level] || COLORS.WHITE;
    
    console.log(`${colorCode}${logMessage}${COLORS.NC}`);
    
    // File logging
    fs.appendFileSync(this.logFile, logMessage + '\n');
    
    // State tracking
    if (level === 'ERROR') {
      this.state.errors.push({ timestamp, message, step });
    } else if (level === 'WARN') {
      this.state.warnings.push({ timestamp, message, step });
    }
  }

  // Update deployment state
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
    
    // Save state to file
    const stateFile = path.join(PROJECT_PATHS.logs, `deployment-state-${this.deploymentId}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
  }

  // Run shell command with enhanced error handling
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
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
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

  // Check if command exists
  async commandExists(command) {
    try {
      await this.runCommand('which', [command], { silent: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Install CLI tool if missing
  async ensureCLITool(toolName) {
    const tool = REQUIRED_TOOLS.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    this.log(`Checking ${toolName}...`, 'INFO', 'prerequisites');

    if (await this.commandExists(toolName)) {
      this.log(`✅ ${toolName} is available`, 'SUCCESS', 'prerequisites');
      return true;
    }

    if (tool.optional && tool.installCommand) {
      this.log(`Installing ${toolName}...`, 'INFO', 'prerequisites');
      try {
        await this.runCommand('npm', ['install', '-g', tool.installCommand.split(' ').pop()]);
        this.log(`✅ ${toolName} installed successfully`, 'SUCCESS', 'prerequisites');
        return true;
      } catch (error) {
        this.log(`❌ Failed to install ${toolName}: ${error.message}`, 'ERROR', 'prerequisites');
        throw error;
      }
    }

    throw new Error(`${toolName} is required but not available. ${tool.installInstructions}`);
  }

  // Check all prerequisites
  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'STEP', 'prerequisites');
    this.updateState('checking_prerequisites', 'prerequisites', 'running');

    try {
      // Check Node.js and npm
      await this.ensureCLITool('node');
      await this.ensureCLITool('npm');

      // Check cloud platform CLI tools for cloud environments
      if (isCloudEnvironment(this.environment)) {
        const sequence = DEPLOYMENT_SEQUENCE[this.environment];
        const platforms = [...new Set(sequence.map(step => step.platform))];
        
        for (const platform of platforms) {
          await this.ensureCLITool(platform);
        }
      }

      this.updateState('prerequisites_complete', 'prerequisites', 'completed');
      this.log('✅ All prerequisites satisfied', 'SUCCESS', 'prerequisites');
      return true;
    } catch (error) {
      this.updateState('prerequisites_failed', 'prerequisites', 'failed', { error: error.message });
      this.log(`❌ Prerequisites check failed: ${error.message}`, 'ERROR', 'prerequisites');
      throw error;
    }
  }

  // Validate environment configuration
  async validateConfiguration() {
    this.log('Validating environment configuration...', 'STEP', 'validation');
    this.updateState('validating_config', 'validation', 'running');

    try {
      if (!validateEnvironment(this.environment)) {
        throw new Error(`Invalid environment configuration for ${this.environment}`);
      }

      // Check that required directories exist
      const requiredDirs = [PROJECT_PATHS.frontend, PROJECT_PATHS.backend];
      for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
          throw new Error(`Required directory not found: ${dir}`);
        }
      }

      // Validate package.json files exist
      const packageFiles = [
        path.join(PROJECT_PATHS.frontend, 'package.json'),
        path.join(PROJECT_PATHS.backend, 'package.json')
      ];

      for (const packageFile of packageFiles) {
        if (!fs.existsSync(packageFile)) {
          throw new Error(`Package file not found: ${packageFile}`);
        }
      }

      this.updateState('config_validated', 'validation', 'completed');
      this.log('✅ Environment configuration is valid', 'SUCCESS', 'validation');
      return true;
    } catch (error) {
      this.updateState('config_validation_failed', 'validation', 'failed', { error: error.message });
      this.log(`❌ Configuration validation failed: ${error.message}`, 'ERROR', 'validation');
      throw error;
    }
  }

  // Create environment files
  async createEnvironmentFiles() {
    this.log('Creating environment files...', 'STEP', 'env_files');
    this.updateState('creating_env_files', 'env_files', 'running');

    try {
      // Frontend environment file
      const frontendEnvPath = path.join(PROJECT_PATHS.frontend, '.env.local');
      const frontendEnvContent = Object.entries(this.envConfig.frontend.env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n') + '\n';

      fs.writeFileSync(frontendEnvPath, frontendEnvContent);
      this.log(`✅ Created frontend environment file: ${frontendEnvPath}`, 'SUCCESS', 'env_files');

      // Backend environment file (for cloud deployments, these are set via platform)
      if (!isCloudEnvironment(this.environment)) {
        const backendEnvPath = path.join(PROJECT_PATHS.backend, '.env.local');
        const backendEnvContent = Object.entries(this.envConfig.backend.env)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n') + '\n';

        fs.writeFileSync(backendEnvPath, backendEnvContent);
        this.log(`✅ Created backend environment file: ${backendEnvPath}`, 'SUCCESS', 'env_files');
      }

      this.updateState('env_files_created', 'env_files', 'completed');
      return true;
    } catch (error) {
      this.updateState('env_files_failed', 'env_files', 'failed', { error: error.message });
      this.log(`❌ Failed to create environment files: ${error.message}`, 'ERROR', 'env_files');
      throw error;
    }
  }

  // Deploy a single component (frontend or backend)
  async deployComponent(component, platform) {
    const stepName = `deploy_${component}`;
    this.log(`Deploying ${component} to ${platform}...`, 'STEP', stepName);
    this.updateState('deploying', stepName, 'running');

    try {
      const componentConfig = this.envConfig[component];
      const platformConfig = getPlatformConfig(platform);

      if (platform === 'local') {
        // Local deployment (development)
        return this.deployLocal(component, componentConfig);
      } else if (platform === 'vercel') {
        // Vercel deployment
        return this.deployVercel(component, componentConfig, platformConfig);
      } else if (platform === 'railway') {
        // Railway deployment
        return this.deployRailway(component, componentConfig, platformConfig);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      this.updateState('deploy_failed', stepName, 'failed', { error: error.message });
      this.log(`❌ ${component} deployment failed: ${error.message}`, 'ERROR', stepName);
      throw error;
    }
  }

  // Deploy to Vercel
  async deployVercel(component, componentConfig, platformConfig) {
    const workingDir = PROJECT_PATHS[component];
    this.log(`Building ${component} for Vercel...`, 'INFO', `deploy_${component}`);

    // Install dependencies
    await this.runCommand('npm', ['ci'], { cwd: workingDir });

    // Build project
    const buildArgs = componentConfig.buildCommand.split(' ').slice(1); // Remove 'npm'
    await this.runCommand('npm', buildArgs, { cwd: workingDir });

    // Deploy to Vercel
    const deployArgs = [
      ...platformConfig.deployFlags[this.environment],
      '--yes', // Non-interactive
      '--token', process.env.VERCEL_TOKEN || 'auto'
    ];

    if (componentConfig.projectName) {
      deployArgs.push(...platformConfig.projectFlags(componentConfig.projectName));
    }

    await this.runCommand('vercel', deployArgs, { cwd: workingDir });
    
    this.updateState('deploy_completed', `deploy_${component}`, 'completed');
    this.log(`✅ ${component} deployed to Vercel successfully`, 'SUCCESS', `deploy_${component}`);
    
    return componentConfig.url;
  }

  // Deploy to Railway
  async deployRailway(component, componentConfig, platformConfig) {
    const workingDir = PROJECT_PATHS[component];
    this.log(`Deploying ${component} to Railway...`, 'INFO', `deploy_${component}`);

    // Link to Railway project
    const linkArgs = [
      'link',
      '--project', componentConfig.projectId,
      '--environment', componentConfig.environment,
      '--service', componentConfig.serviceName
    ];

    await this.runCommand('railway', linkArgs, { cwd: workingDir });

    // Deploy
    const deployArgs = [
      'up',
      '--environment', componentConfig.environment
    ];

    await this.runCommand('railway', deployArgs, { cwd: workingDir });
    
    this.updateState('deploy_completed', `deploy_${component}`, 'completed');
    this.log(`✅ ${component} deployed to Railway successfully`, 'SUCCESS', `deploy_${component}`);
    
    return componentConfig.url;
  }

  // Health check for deployed service
  async healthCheck(url, healthPath = '/api/health') {
    const stepName = 'health_check';
    this.log(`Performing health check: ${url}${healthPath}`, 'INFO', stepName);
    
    const fullUrl = `${url}${healthPath}`;
    const maxRetries = HEALTH_CHECK_CONFIG.retries;
    const timeout = HEALTH_CHECK_CONFIG.timeout;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeHttpRequest(fullUrl, { timeout });
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.log(`✅ Health check passed (${response.statusCode})`, 'SUCCESS', stepName);
          return { success: true, statusCode: response.statusCode, data: response.data };
        } else {
          throw new Error(`HTTP ${response.statusCode}`);
        }
      } catch (error) {
        this.log(`⚠️ Health check attempt ${attempt}/${maxRetries} failed: ${error.message}`, 'WARN', stepName);
        
        if (attempt === maxRetries) {
          throw new Error(`Health check failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await this.sleep(HEALTH_CHECK_CONFIG.retryDelay);
      }
    }
  }

  // HTTP request utility
  makeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: options.timeout || 30000,
        headers: {
          'User-Agent': 'Novara-Deployment-Orchestrator/1.0'
        }
      };
      
      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Complete deployment process
  async deploy() {
    try {
      this.log(`🚀 Starting deployment to ${this.environment}`, 'STEP');
      this.updateState('deploying', 'deployment', 'running');

      // Step 1: Prerequisites
      await this.checkPrerequisites();

      // Step 2: Validation
      await this.validateConfiguration();

      // Step 3: Environment files
      await this.createEnvironmentFiles();

      // Step 4: Deploy components
      if (isCloudEnvironment(this.environment)) {
        const sequence = DEPLOYMENT_SEQUENCE[this.environment];
        const deployedUrls = {};

        for (const step of sequence) {
          const url = await this.deployComponent(step.component, step.platform);
          deployedUrls[step.component] = url;
        }

        // Step 5: Wait for services to be ready
        this.log(`Waiting ${HEALTH_CHECK_CONFIG.warmupTime / 1000}s for services to warm up...`, 'INFO', 'warmup');
        await this.sleep(HEALTH_CHECK_CONFIG.warmupTime);

        // Step 6: Health checks
        for (const [component, url] of Object.entries(deployedUrls)) {
          if (this.envConfig[component].healthPath) {
            await this.healthCheck(url, this.envConfig[component].healthPath);
          }
        }
      }

      // Deployment successful
      this.updateState('completed', 'deployment', 'completed');
      this.log(`🎉 Deployment to ${this.environment} completed successfully!`, 'SUCCESS');
      
      this.printSummary();
      return true;

    } catch (error) {
      this.updateState('failed', 'deployment', 'failed', { error: error.message });
      this.log(`💥 Deployment failed: ${error.message}`, 'ERROR');
      
      this.printFailureSummary(error);
      throw error;
    }
  }

  // Print deployment summary
  printSummary() {
    const duration = Math.round(this.state.duration / 1000);
    
    console.log(`\n${COLORS.GREEN}🎉 DEPLOYMENT SUCCESSFUL${COLORS.NC}`);
    console.log(`${COLORS.WHITE}==================================${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Environment:${COLORS.NC} ${this.environment}`);
    console.log(`${COLORS.CYAN}Duration:${COLORS.NC} ${duration}s`);
    console.log(`${COLORS.CYAN}Deployment ID:${COLORS.NC} ${this.deploymentId}`);
    
    if (isCloudEnvironment(this.environment)) {
      console.log(`\n${COLORS.YELLOW}🔗 Deployed URLs:${COLORS.NC}`);
      console.log(`${COLORS.CYAN}Frontend:${COLORS.NC} ${this.envConfig.frontend.url}`);
      console.log(`${COLORS.CYAN}Backend:${COLORS.NC} ${this.envConfig.backend.url}`);
      console.log(`${COLORS.CYAN}Health:${COLORS.NC} ${this.envConfig.backend.url}${this.envConfig.backend.healthPath}`);
    }
    
    console.log(`\n${COLORS.YELLOW}📊 Deployment Log:${COLORS.NC} ${this.logFile}`);
    console.log(`${COLORS.YELLOW}📋 State File:${COLORS.NC} ${path.join(PROJECT_PATHS.logs, `deployment-state-${this.deploymentId}.json`)}`);
  }

  // Print failure summary
  printFailureSummary(error) {
    const duration = Math.round(this.state.duration / 1000);
    
    console.log(`\n${COLORS.RED}💥 DEPLOYMENT FAILED${COLORS.NC}`);
    console.log(`${COLORS.WHITE}==================================${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Environment:${COLORS.NC} ${this.environment}`);
    console.log(`${COLORS.CYAN}Duration:${COLORS.NC} ${duration}s`);
    console.log(`${COLORS.CYAN}Error:${COLORS.NC} ${error.message}`);
    
    console.log(`\n${COLORS.YELLOW}📊 Debug Information:${COLORS.NC}`);
    console.log(`${COLORS.CYAN}Log File:${COLORS.NC} ${this.logFile}`);
    console.log(`${COLORS.CYAN}State File:${COLORS.NC} ${path.join(PROJECT_PATHS.logs, `deployment-state-${this.deploymentId}.json`)}`);
    
    if (this.state.errors.length > 0) {
      console.log(`\n${COLORS.RED}❌ Errors:${COLORS.NC}`);
      this.state.errors.forEach(err => {
        console.log(`  • ${err.message}`);
      });
    }
    
    if (this.state.warnings.length > 0) {
      console.log(`\n${COLORS.YELLOW}⚠️ Warnings:${COLORS.NC}`);
      this.state.warnings.forEach(warn => {
        console.log(`  • ${warn.message}`);
      });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${COLORS.BLUE}Novara MVP Deployment Orchestrator${COLORS.NC}\n`);
    console.log('Usage:');
    console.log('  node scripts/deploy-orchestrator.js <environment> [options]\n');
    console.log('Environments:');
    console.log('  development  - Local development environment');
    console.log('  staging      - Staging environment (Railway + Vercel)');
    console.log('  production   - Production environment (Railway + Vercel)\n');
    console.log('Options:');
    console.log('  --dry-run    - Validate configuration without deploying');
    console.log('  --force      - Skip confirmation prompts');
    console.log('  --verbose    - Enable verbose logging\n');
    console.log('Examples:');
    console.log('  node scripts/deploy-orchestrator.js staging');
    console.log('  node scripts/deploy-orchestrator.js production --force');
    process.exit(0);
  }

  const environment = args[0];
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    verbose: args.includes('--verbose')
  };

  // Validate environment
  if (!validateEnvironment(environment)) {
    console.error(`${COLORS.RED}❌ Invalid environment: ${environment}${COLORS.NC}`);
    console.error(`Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    process.exit(1);
  }

  // Confirmation for production deployments
  if (environment === 'production' && !options.force) {
    console.log(`${COLORS.YELLOW}⚠️ You are about to deploy to PRODUCTION${COLORS.NC}`);
    console.log('This will affect live users. Make sure you have:');
    console.log('  ✅ Tested in staging environment');
    console.log('  ✅ Reviewed all changes');
    console.log('  ✅ Notified team members\n');
    
    // For now, require --force flag for production
    console.log(`${COLORS.RED}Production deployment requires --force flag${COLORS.NC}`);
    console.log('Use: node scripts/deploy-orchestrator.js production --force');
    process.exit(1);
  }

  // Create and run orchestrator
  const orchestrator = new DeploymentOrchestrator(environment, options);
  
  orchestrator.deploy()
    .then(() => {
      console.log(`\n${COLORS.GREEN}✅ Deployment completed successfully${COLORS.NC}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n${COLORS.RED}❌ Deployment failed: ${error.message}${COLORS.NC}`);
      process.exit(1);
    });
}

module.exports = DeploymentOrchestrator; 