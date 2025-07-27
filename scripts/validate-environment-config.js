#!/usr/bin/env node

/**
 * 🛡️ Environment Configuration Validator
 * 
 * Validates environment variables across all environments
 * to prevent build and deployment errors
 */

const fs = require('fs');
const path = require('path');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.environments = ['development', 'staging', 'production'];
  }

  log(message, type = 'info') {
    const prefix = {
      info: '🔍',
      warning: '⚠️',
      error: '🚨',
      success: '✅'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  validateEnvironmentFile(envPath, envName) {
    this.log(`Validating ${envName} environment...`);
    
    if (!fs.existsSync(envPath)) {
      this.errors.push(`Missing environment file: ${envPath}`);
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const variables = {};

    // Parse environment variables
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          variables[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Required variables for each environment
    const requiredVars = {
      development: {
        frontend: ['VITE_API_URL', 'VITE_APP_ENV'],
        backend: ['NODE_ENV', 'JWT_SECRET', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'USE_LOCAL_DATABASE']
      },
      staging: {
        frontend: ['VITE_API_URL', 'VITE_APP_ENV'],
        backend: ['NODE_ENV', 'JWT_SECRET', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'PORT']
      },
      production: {
        frontend: ['VITE_API_URL', 'VITE_APP_ENV'],
        backend: ['NODE_ENV', 'JWT_SECRET', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'PORT']
      }
    };

    const envRequired = requiredVars[envName];
    if (!envRequired) {
      this.warnings.push(`No validation rules for environment: ${envName}`);
      return true;
    }

    // Check frontend variables
    if (envName === 'development') {
      const frontendEnvPath = 'frontend/.env.development';
      if (fs.existsSync(frontendEnvPath)) {
        const frontendContent = fs.readFileSync(frontendEnvPath, 'utf8');
        envRequired.frontend.forEach(varName => {
          if (!frontendContent.includes(varName)) {
            this.errors.push(`Missing frontend variable: ${varName} in ${frontendEnvPath}`);
          }
        });
      } else {
        this.errors.push(`Missing frontend environment file: ${frontendEnvPath}`);
      }
    }

    // Check backend variables
    envRequired.backend.forEach(varName => {
      if (!variables[varName]) {
        this.errors.push(`Missing backend variable: ${varName} in ${envPath}`);
      } else if (variables[varName] === '') {
        this.warnings.push(`Empty backend variable: ${varName} in ${envPath}`);
      }
    });

    // Environment-specific validations
    if (envName === 'development') {
      if (variables['USE_LOCAL_DATABASE'] !== 'true') {
        this.warnings.push(`USE_LOCAL_DATABASE should be 'true' for development`);
      }
    }

    if (envName === 'staging' || envName === 'production') {
      if (variables['NODE_ENV'] !== envName) {
        this.errors.push(`NODE_ENV should be '${envName}' in ${envPath}`);
      }
    }

    return this.errors.length === 0;
  }

  validateDatabaseConfiguration() {
    this.log('Validating database configuration...');
    
    // Check for local database file
    const localDbPath = 'backend/data/novara-local.db';
    if (!fs.existsSync(localDbPath)) {
      this.warnings.push(`Local database file not found: ${localDbPath}`);
    }

    // Check database adapter
    const adapterPath = 'backend/database/sqlite-adapter.js';
    if (!fs.existsSync(adapterPath)) {
      this.errors.push(`Database adapter not found: ${adapterPath}`);
    }
  }

  validateDeploymentScripts() {
    this.log('Validating deployment scripts...');
    
    const requiredScripts = [
      'scripts/deploy-staging-automated.sh',
      'scripts/deploy-production-safe.sh',
      'scripts/start-dev-stable.sh',
      'scripts/kill-local-servers.sh'
    ];

    requiredScripts.forEach(script => {
      if (!fs.existsSync(script)) {
        this.errors.push(`Missing deployment script: ${script}`);
      } else {
        // Check if script is executable
        try {
          fs.accessSync(script, fs.constants.X_OK);
        } catch (error) {
          this.warnings.push(`Script not executable: ${script}`);
        }
      }
    });
  }

  validateDockerConfiguration() {
    this.log('Validating Docker configuration...');
    
    const dockerfilePath = 'Dockerfile';
    if (!fs.existsSync(dockerfilePath)) {
      this.errors.push(`Dockerfile not found: ${dockerfilePath}`);
      return;
    }

    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Check for essential Dockerfile components
    if (!dockerfileContent.includes('FROM node:')) {
      this.errors.push('Dockerfile missing Node.js base image');
    }
    
    if (!dockerfileContent.includes('COPY backend/package')) {
      this.warnings.push('Dockerfile missing package.json copy for caching');
    }
    
    if (!dockerfileContent.includes('npm ci')) {
      this.warnings.push('Dockerfile should use npm ci for production builds');
    }
  }

  validatePackageConfiguration() {
    this.log('Validating package configuration...');
    
    const packageDirs = ['frontend', 'backend'];
    
    packageDirs.forEach(dir => {
      const packagePath = path.join(dir, 'package.json');
      if (!fs.existsSync(packagePath)) {
        this.errors.push(`Missing package.json in ${dir}`);
        return;
      }

      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for required scripts
        const requiredScripts = {
          frontend: ['build', 'dev'],
          backend: ['start', 'test']
        };

        const scripts = requiredScripts[dir] || [];
        scripts.forEach(script => {
          if (!packageJson.scripts || !packageJson.scripts[script]) {
            this.warnings.push(`Missing script '${script}' in ${dir}/package.json`);
          }
        });

        // Check for dependencies
        if (!packageJson.dependencies && !packageJson.devDependencies) {
          this.warnings.push(`No dependencies found in ${dir}/package.json`);
        }

      } catch (error) {
        this.errors.push(`Invalid JSON in ${dir}/package.json`);
      }
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalIssues: this.errors.length + this.warnings.length,
        errors: this.errors.length,
        warnings: this.warnings.length
      }
    };

    // Save JSON report
    fs.writeFileSync('environment-validation-report.json', JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync('environment-validation-report.md', markdownReport);

    return report;
  }

  generateMarkdownReport(report) {
    let markdown = `# 🛡️ Environment Configuration Validation Report

**Generated:** ${report.timestamp}

## 📊 Summary

- **Total Issues:** ${report.summary.totalIssues}
- **Errors:** ${report.summary.errors}
- **Warnings:** ${report.summary.warnings}

`;

    if (report.errors.length === 0 && report.warnings.length === 0) {
      markdown += `## ✅ All Clear!

Environment configuration is valid and ready for deployment.

### 🚀 Next Steps
1. Run pre-deployment validation: \`npm run pre-deploy:full\`
2. Deploy to staging: \`./scripts/deploy-staging-automated.sh\`
3. Monitor deployment: \`npm run monitor:deployments\`

`;
    } else {
      if (report.errors.length > 0) {
        markdown += `## 🚨 Errors (Must Fix)

`;
        report.errors.forEach(error => {
          markdown += `- ${error}\n`;
        });
        markdown += '\n';
      }

      if (report.warnings.length > 0) {
        markdown += `## ⚠️ Warnings (Recommended)

`;
        report.warnings.forEach(warning => {
          markdown += `- ${warning}\n`;
        });
        markdown += '\n';
      }
    }

    markdown += `## 🔧 Quick Fix Commands

\`\`\`bash
# Fix environment variable issues
npm run sync:env-examples
npm run validate:environments

# Fix script permissions
chmod +x scripts/*.sh

# Fix local development issues
./scripts/fix-local-dev.sh

# Run comprehensive validation
npm run pre-deploy:full
\`\`\`

---
*Report generated by Environment Configuration Validator*
`;

    return markdown;
  }

  async run() {
    this.log('🛡️ Environment Configuration Validator Starting...');
    
    // Validate environment files
    this.environments.forEach(env => {
      const envPath = `.env.${env}`;
      this.validateEnvironmentFile(envPath, env);
    });

    // Validate development environment files
    this.validateEnvironmentFile('frontend/.env.development', 'development');
    this.validateEnvironmentFile('backend/.env.development', 'development');

    // Additional validations
    this.validateDatabaseConfiguration();
    this.validateDeploymentScripts();
    this.validateDockerConfiguration();
    this.validatePackageConfiguration();

    // Generate report
    const report = this.generateReport();

    // Print summary
    if (report.summary.errors > 0) {
      this.log(`🚨 Found ${report.summary.errors} errors that must be fixed`, 'error');
    }

    if (report.summary.warnings > 0) {
      this.log(`⚠️ Found ${report.summary.warnings} warnings to address`, 'warning');
    }

    if (report.summary.totalIssues === 0) {
      this.log('✅ Environment configuration is valid!', 'success');
    }

    this.log(`Report saved to: environment-validation-report.json and environment-validation-report.md`, 'success');

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.run().catch(console.error);
}

module.exports = EnvironmentValidator; 