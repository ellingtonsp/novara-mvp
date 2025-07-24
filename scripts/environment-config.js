#!/usr/bin/env node

/**
 * Centralized Environment Configuration
 * Single source of truth for all environment URLs and settings
 */

const ENVIRONMENTS = {
  development: {
    backend: 'http://localhost:9002',
    frontend: 'http://localhost:4200',
    healthUrl: 'http://localhost:9002/api/health',
    name: 'Development',
    database: 'sqlite'
  },
  staging: {
    backend: 'https://novara-staging-staging.up.railway.app',
    frontend: 'https://novara-mvp-staging.vercel.app',
    healthUrl: 'https://novara-staging-staging.up.railway.app/api/health',
    name: 'Staging',
    database: 'airtable'
  },
  production: {
    backend: 'https://novara-mvp-production.up.railway.app',
    frontend: 'https://novara-mvp.vercel.app',
    healthUrl: 'https://novara-mvp-production.up.railway.app/api/health',
    name: 'Production',
    database: 'airtable'
  }
};

// Railway Configuration
const RAILWAY_CONFIG = {
  projectId: process.env.RAILWAY_PROJECT_ID || 'f3025bf5-5cd5-4b7b-b045-4d477a4c7835',
  token: process.env.RAILWAY_TOKEN || 'e3fe9d3a-1b89-483c-aa75-477da8ef6a2f',
  apiUrl: 'https://backboard.railway.app/graphql/v2',
  environments: {
    production: {
      serviceName: 'novara-main',
      healthUrl: ENVIRONMENTS.production.healthUrl
    },
    staging: {
      serviceName: 'novara-staging',
      healthUrl: ENVIRONMENTS.staging.healthUrl
    }
  }
};

// Vercel Configuration
const VERCEL_CONFIG = {
  token: process.env.VERCEL_TOKEN,
  teamId: process.env.VERCEL_TEAM_ID,
  apiUrl: 'https://api.vercel.com/v1',
  environments: {
    production: {
      projectName: 'novara-mvp',
      url: ENVIRONMENTS.production.frontend
    },
    staging: {
      projectName: 'novara-mvp-staging',
      url: ENVIRONMENTS.staging.frontend
    }
  }
};

// Monitoring Configuration
const MONITORING_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  checkInterval: 5 * 60 * 1000, // 5 minutes
  alertThreshold: 3, // Alert after 3 consecutive failures
  healthEndpoints: ['/api/health', '/api/checkins/questions', '/api/insights/daily']
};

// Export configurations
module.exports = {
  ENVIRONMENTS,
  RAILWAY_CONFIG,
  VERCEL_CONFIG,
  MONITORING_CONFIG,
  
  // Helper functions
  getEnvironment: (env) => ENVIRONMENTS[env] || ENVIRONMENTS.development,
  getRailwayConfig: (env) => RAILWAY_CONFIG.environments[env],
  getVercelConfig: (env) => VERCEL_CONFIG.environments[env],
  
  // Validation
  validateEnvironment: (env) => {
    if (!ENVIRONMENTS[env]) {
      throw new Error(`Invalid environment: ${env}. Valid options: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    }
    return true;
  },
  
  // Health check URLs
  getHealthUrls: () => {
    return Object.entries(ENVIRONMENTS).map(([env, config]) => ({
      environment: env,
      name: config.name,
      healthUrl: config.healthUrl
    }));
  }
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      console.log('Available environments:');
      Object.entries(ENVIRONMENTS).forEach(([env, config]) => {
        console.log(`  ${env}: ${config.name}`);
        console.log(`    Backend: ${config.backend}`);
        console.log(`    Frontend: ${config.frontend}`);
        console.log(`    Health: ${config.healthUrl}`);
        console.log('');
      });
      break;
      
    case 'health':
      const env = args[1] || 'production';
      const config = ENVIRONMENTS[env];
      if (config) {
        console.log(`Health URL for ${env}: ${config.healthUrl}`);
      } else {
        console.log(`Environment ${env} not found`);
      }
      break;
      
    case 'validate':
      const envToValidate = args[1];
      if (envToValidate) {
        try {
          module.exports.validateEnvironment(envToValidate);
          console.log(`✅ Environment ${envToValidate} is valid`);
        } catch (error) {
          console.log(`❌ ${error.message}`);
        }
      } else {
        console.log('Usage: node environment-config.js validate <environment>');
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node environment-config.js list                    # List all environments');
      console.log('  node environment-config.js health [environment]    # Get health URL');
      console.log('  node environment-config.js validate <environment>  # Validate environment');
      break;
  }
} 