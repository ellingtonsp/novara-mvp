#!/usr/bin/env node

/**
 * Novara MVP - Unified Deployment Configuration
 * Single source of truth for all deployment environments and platforms
 */

const path = require('path');

// Get the project root directory
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Environment definitions with all necessary configuration
const ENVIRONMENTS = {
  development: {
    name: 'development',
    type: 'local',
    frontend: {
      url: 'http://localhost:4200',
      platform: 'local',
      port: 4200,
      buildCommand: 'npm run dev',
      env: {
        VITE_API_URL: 'http://localhost:9002',
        VITE_ENV: 'development',
        VITE_NODE_ENV: 'development',
        VITE_ENABLE_ANALYTICS: 'false',
        VITE_ENABLE_ERROR_TRACKING: 'true'
      }
    },
    backend: {
      url: 'http://localhost:9002',
      platform: 'local',
      port: 9002,
      startCommand: 'npm run dev',
      healthPath: '/api/health',
      env: {
        NODE_ENV: 'development',
        PORT: '9002',
        USE_LOCAL_DATABASE: 'true',
        DATABASE_TYPE: 'sqlite',
        JWT_SECRET: 'dev_secret_key_not_for_production',
        CORS_ORIGIN: 'http://localhost:4200'
      }
    },
    database: {
      type: 'sqlite',
      path: './data/novara-local.db'
    }
  },

  staging: {
    name: 'staging',
    type: 'cloud',
    frontend: {
      url: 'https://novara-mvp-staging.vercel.app',
      platform: 'vercel',
      projectName: 'novara-mvp-staging',
      buildCommand: 'npm run build',
      env: {
        VITE_API_URL: 'https://novara-staging.up.railway.app',
        VITE_ENV: 'staging',
        VITE_NODE_ENV: 'staging',
        VITE_ENABLE_ANALYTICS: 'true',
        VITE_ENABLE_ERROR_TRACKING: 'true',
        VITE_POSTHOG_API_KEY: 'phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt',
        VITE_POSTHOG_HOST: 'https://app.posthog.com'
      }
    },
    backend: {
      url: 'https://novara-staging.up.railway.app',
      platform: 'railway',
      projectId: 'novara-mvp',
      environment: 'staging',
      serviceName: 'backend',
      healthPath: '/api/health',
      env: {
        NODE_ENV: 'staging',
        USE_LOCAL_DATABASE: 'false',
        DATABASE_TYPE: 'airtable',
        AIRTABLE_BASE_ID: 'appEOWvLjCn5c7Ght',
        JWT_EXPIRES_IN: '90d',
        CORS_ORIGIN: 'https://novara-mvp-staging.vercel.app',
        LOG_LEVEL: 'info'
      }
    },
    database: {
      type: 'airtable',
      baseId: 'appEOWvLjCn5c7Ght'
    }
  },

  production: {
    name: 'production',
    type: 'cloud',
    frontend: {
      url: 'https://novara-mvp.vercel.app',
      platform: 'vercel',
      projectName: 'novara-mvp',
      buildCommand: 'npm run build:production',
      env: {
        VITE_API_URL: 'https://novara-mvp-production.up.railway.app',
        VITE_ENV: 'production',
        VITE_NODE_ENV: 'production',
        VITE_ENABLE_ANALYTICS: 'true',
        VITE_ENABLE_ERROR_TRACKING: 'true',
        VITE_POSTHOG_API_KEY: 'phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt',
        VITE_POSTHOG_HOST: 'https://app.posthog.com'
      }
    },
    backend: {
      url: 'https://novara-mvp-production.up.railway.app',
      platform: 'railway',
      projectId: 'novara-mvp',
      environment: 'production',
      serviceName: 'backend',
      healthPath: '/api/health',
      env: {
        NODE_ENV: 'production',
        USE_LOCAL_DATABASE: 'false',
        DATABASE_TYPE: 'airtable',
        AIRTABLE_BASE_ID: 'app5QWCcVbCnVg2Gg',
        JWT_EXPIRES_IN: '90d',
        CORS_ORIGIN: 'https://novara-mvp.vercel.app',
        LOG_LEVEL: 'warn'
      }
    },
    database: {
      type: 'airtable',
      baseId: 'app5QWCcVbCnVg2Gg'
    }
  }
};

// Platform-specific configuration
const PLATFORM_CONFIG = {
  vercel: {
    cliCommand: 'vercel',
    installCommand: 'npm install -g vercel',
    deployFlags: {
      staging: ['--env', 'staging'],
      production: ['--prod', '--env', 'production']
    },
    projectFlags: (projectName) => ['--name', projectName]
  },
  
  railway: {
    cliCommand: 'railway',
    installCommand: 'npm install -g @railway/cli',
    deployFlags: {
      staging: ['--environment', 'staging'],
      production: ['--environment', 'production']
    },
    projectFlags: (projectId) => ['--project', projectId]
  }
};

// Deployment sequence configuration
const DEPLOYMENT_SEQUENCE = {
  staging: [
    { component: 'backend', platform: 'railway' },
    { component: 'frontend', platform: 'vercel' }
  ],
  production: [
    { component: 'backend', platform: 'railway' },
    { component: 'frontend', platform: 'vercel' }
  ]
};

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 10000,
  expectedEndpoints: ['/api/health', '/api/version'],
  expectedResponseCodes: [200, 201],
  warmupTime: 45000 // Time to wait after deployment before health checks
};

// Monitoring configuration
const MONITORING_CONFIG = {
  checkInterval: 30 * 60 * 1000, // 30 minutes
  alertThreshold: 3, // Number of failures before alerting
  healthEndpoints: ['/api/health', '/api/version'],
  timeout: 30000,
  retries: 2
};

// Required CLI tools
const REQUIRED_TOOLS = [
  {
    name: 'node',
    command: 'node --version',
    minVersion: '18.0.0',
    installInstructions: 'Install Node.js from https://nodejs.org/'
  },
  {
    name: 'npm',
    command: 'npm --version',
    minVersion: '8.0.0',
    installInstructions: 'Comes with Node.js'
  },
  {
    name: 'vercel',
    command: 'vercel --version',
    optional: true,
    installCommand: 'npm install -g vercel',
    installInstructions: 'Auto-installed if needed'
  },
  {
    name: 'railway',
    command: 'railway --version',
    optional: true,
    installCommand: 'npm install -g @railway/cli',
    installInstructions: 'Auto-installed if needed'
  }
];

// Project structure paths
const PROJECT_PATHS = {
  root: PROJECT_ROOT,
  frontend: path.join(PROJECT_ROOT, 'frontend'),
  backend: path.join(PROJECT_ROOT, 'backend'),
  scripts: path.join(PROJECT_ROOT, 'scripts'),
  logs: path.join(PROJECT_ROOT, 'scripts', 'logs'),
  deploy: path.join(PROJECT_ROOT, 'scripts', 'deploy'),
  monitoring: path.join(PROJECT_ROOT, 'scripts', 'monitoring')
};

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(PROJECT_PATHS.logs)) {
  fs.mkdirSync(PROJECT_PATHS.logs, { recursive: true });
}

// Export configuration
module.exports = {
  ENVIRONMENTS,
  PLATFORM_CONFIG,
  DEPLOYMENT_SEQUENCE,
  HEALTH_CHECK_CONFIG,
  MONITORING_CONFIG,
  REQUIRED_TOOLS,
  PROJECT_PATHS,
  
  // Helper functions
  getEnvironment: (envName) => {
    const env = ENVIRONMENTS[envName];
    if (!env) {
      throw new Error(`Unknown environment: ${envName}. Available: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    }
    return env;
  },
  
  getPlatformConfig: (platform) => {
    const config = PLATFORM_CONFIG[platform];
    if (!config) {
      throw new Error(`Unknown platform: ${platform}. Available: ${Object.keys(PLATFORM_CONFIG).join(', ')}`);
    }
    return config;
  },
  
  validateEnvironment: (envName) => {
    try {
      const env = ENVIRONMENTS[envName];
      if (!env) return false;
      
      // Check required fields
      return env.frontend && env.backend && env.frontend.url && env.backend.url;
    } catch (error) {
      return false;
    }
  },
  
  isCloudEnvironment: (envName) => {
    const env = ENVIRONMENTS[envName];
    return env && env.type === 'cloud';
  }
}; 