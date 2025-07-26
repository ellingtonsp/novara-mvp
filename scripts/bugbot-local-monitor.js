#!/usr/bin/env node

/**
 * 🐛 BugBot Local Monitor
 * 
 * Monitors local development environment for common issues
 * and creates detailed bug reports for Novara MVP
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BugBotLocalMonitor {
  constructor() {
    this.issues = [];
    this.report = {
      timestamp: new Date().toISOString(),
      environment: 'local',
      issues: [],
      recommendations: []
    };
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

  async checkPortAvailability() {
    this.log('Checking port availability...');
    
    const ports = [4200, 9002, 3000, 3001, 3002];
    const occupiedPorts = [];
    
    for (const port of ports) {
      try {
        execSync(`lsof -i :${port}`, { stdio: 'pipe' });
        occupiedPorts.push(port);
      } catch (error) {
        // Port is available
      }
    }
    
    if (occupiedPorts.length > 0) {
      this.issues.push({
        type: 'port_conflict',
        severity: 'warning',
        message: `Ports ${occupiedPorts.join(', ')} are occupied`,
        details: `These ports might conflict with Novara development servers`,
        fix: `Run: ./scripts/kill-local-servers.sh`
      });
    } else {
      this.log('All required ports are available', 'success');
    }
  }

  async checkEnvironmentFiles() {
    this.log('Checking environment configuration...');
    
    const requiredFiles = [
      'frontend/.env.development',
      'backend/.env.development',
      'env.example'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.issues.push({
          type: 'missing_env_file',
          severity: 'error',
          message: `Missing environment file: ${file}`,
          details: `Required for local development`,
          fix: `Copy from ${file}.example and configure`
        });
      }
    }
    
    // Check for required environment variables
    try {
      const frontendEnv = fs.readFileSync('frontend/.env.development', 'utf8');
      const backendEnv = fs.readFileSync('backend/.env.development', 'utf8');
      
      const requiredVars = {
        frontend: ['VITE_API_URL', 'VITE_APP_ENV'],
        backend: ['NODE_ENV', 'JWT_SECRET', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID']
      };
      
      for (const [env, vars] of Object.entries(requiredVars)) {
        const envContent = env === 'frontend' ? frontendEnv : backendEnv;
        for (const varName of vars) {
          if (!envContent.includes(varName)) {
            this.issues.push({
              type: 'missing_env_var',
              severity: 'error',
              message: `Missing environment variable: ${varName}`,
              details: `Required in ${env} environment`,
              fix: `Add ${varName}=value to ${env}/.env.development`
            });
          }
        }
      }
    } catch (error) {
      // File doesn't exist, already caught above
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...');
    
    const packageDirs = ['frontend', 'backend'];
    
    for (const dir of packageDirs) {
      if (!fs.existsSync(path.join(dir, 'package.json'))) {
        this.issues.push({
          type: 'missing_package_json',
          severity: 'error',
          message: `Missing package.json in ${dir}`,
          details: `Required for dependency management`,
          fix: `Run: cd ${dir} && npm init`
        });
        continue;
      }
      
      if (!fs.existsSync(path.join(dir, 'node_modules'))) {
        this.issues.push({
          type: 'missing_dependencies',
          severity: 'warning',
          message: `Missing node_modules in ${dir}`,
          details: `Dependencies not installed`,
          fix: `Run: cd ${dir} && npm install`
        });
      }
    }
  }

  async checkDatabaseConfiguration() {
    this.log('Checking database configuration...');
    
    // Check if local SQLite database exists
    const dbPath = 'backend/data/novara-local.db';
    if (!fs.existsSync(dbPath)) {
      this.issues.push({
        type: 'missing_local_db',
        severity: 'warning',
        message: 'Local SQLite database not found',
        details: 'Local development database is missing',
        fix: 'Run: node backend/scripts/seed-test-data.js'
      });
    }
    
    // Check database adapter
    const adapterPath = 'backend/database/sqlite-adapter.js';
    if (!fs.existsSync(adapterPath)) {
      this.issues.push({
        type: 'missing_db_adapter',
        severity: 'error',
        message: 'SQLite adapter not found',
        details: 'Required for local database operations',
        fix: 'Check backend/database/ directory structure'
      });
    }
  }

  async checkScripts() {
    this.log('Checking development scripts...');
    
    const requiredScripts = [
      'scripts/start-dev-stable.sh',
      'scripts/kill-local-servers.sh',
      'scripts/deploy-staging-automated.sh'
    ];
    
    for (const script of requiredScripts) {
      if (!fs.existsSync(script)) {
        this.issues.push({
          type: 'missing_script',
          severity: 'warning',
          message: `Missing script: ${script}`,
          details: 'Development automation script not found',
          fix: 'Check scripts/ directory for missing files'
        });
      } else {
        // Check if script is executable
        try {
          fs.accessSync(script, fs.constants.X_OK);
        } catch (error) {
          this.issues.push({
            type: 'script_not_executable',
            severity: 'warning',
            message: `Script not executable: ${script}`,
            details: 'Script needs execute permissions',
            fix: `Run: chmod +x ${script}`
          });
        }
      }
    }
  }

  async checkGitConfiguration() {
    this.log('Checking Git configuration...');
    
    try {
      // Check if we're in a git repository
      execSync('git status', { stdio: 'pipe' });
      
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        this.issues.push({
          type: 'uncommitted_changes',
          severity: 'warning',
          message: 'Uncommitted changes detected',
          details: 'You have uncommitted changes in your working directory',
          fix: 'Run: git add . && git commit -m "your message"'
        });
      }
      
      // Check branch protection
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (currentBranch === 'main' || currentBranch === 'staging') {
        this.issues.push({
          type: 'protected_branch_development',
          severity: 'error',
          message: `Working on protected branch: ${currentBranch}`,
          details: 'You should work on feature branches, not protected branches',
          fix: `Run: git checkout -b feature/your-feature-name`
        });
      }
      
    } catch (error) {
      this.issues.push({
        type: 'not_git_repo',
        severity: 'error',
        message: 'Not in a Git repository',
        details: 'This project requires Git for version control',
        fix: 'Run: git init && git remote add origin <your-repo-url>'
      });
    }
  }

  async generateReport() {
    this.log('Generating BugBot report...');
    
    this.report.issues = this.issues;
    
    // Generate recommendations based on issues
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      this.report.recommendations.push('🚨 Fix all errors before starting development');
    }
    
    if (warningCount > 0) {
      this.report.recommendations.push('⚠️ Address warnings to improve development experience');
    }
    
    if (this.issues.length === 0) {
      this.report.recommendations.push('✅ Environment is ready for development');
    }
    
    // Save report to file
    const reportPath = 'bugbot-local-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport();
    fs.writeFileSync('bugbot-local-report.md', markdownReport);
    
    this.log(`Report saved to: ${reportPath} and bugbot-local-report.md`, 'success');
    
    return this.report;
  }

  generateMarkdownReport() {
    let markdown = `# 🐛 BugBot Local Development Report

**Generated:** ${this.report.timestamp}
**Environment:** ${this.report.environment}

## 📊 Summary

- **Total Issues:** ${this.report.issues.length}
- **Errors:** ${this.report.issues.filter(i => i.severity === 'error').length}
- **Warnings:** ${this.report.issues.filter(i => i.severity === 'warning').length}

`;

    if (this.report.issues.length === 0) {
      markdown += `## ✅ All Clear!

Your local development environment is ready for Novara MVP development.

### 🚀 Next Steps
1. Start development: \`./scripts/start-dev-stable.sh\`
2. Run tests: \`npm test\`
3. Deploy to staging: \`./scripts/deploy-staging-automated.sh\`

`;
    } else {
      markdown += `## 🚨 Issues Found

`;

      // Group by severity
      const errors = this.report.issues.filter(i => i.severity === 'error');
      const warnings = this.report.issues.filter(i => i.severity === 'warning');
      
      if (errors.length > 0) {
        markdown += `### 🚨 Errors (Must Fix)

`;
        errors.forEach(issue => {
          markdown += `#### ${issue.message}
- **Type:** ${issue.type}
- **Details:** ${issue.details}
- **Fix:** \`${issue.fix}\`

`;
        });
      }
      
      if (warnings.length > 0) {
        markdown += `### ⚠️ Warnings (Recommended)

`;
        warnings.forEach(issue => {
          markdown += `#### ${issue.message}
- **Type:** ${issue.type}
- **Details:** ${issue.details}
- **Fix:** \`${issue.fix}\`

`;
        });
      }
    }
    
    markdown += `## 🔧 Recommendations

${this.report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 Quick Fix Commands

\`\`\`bash
# Fix common issues
./scripts/fix-local-dev.sh

# Start development environment
./scripts/start-dev-stable.sh

# Run comprehensive tests
node test-comprehensive-e2e-flow-fixed.js

# Deploy to staging
./scripts/deploy-staging-automated.sh
\`\`\`

---
*Report generated by BugBot Local Monitor*
`;

    return markdown;
  }

  async run() {
    this.log('🐛 BugBot Local Monitor Starting...');
    
    await this.checkPortAvailability();
    await this.checkEnvironmentFiles();
    await this.checkDependencies();
    await this.checkDatabaseConfiguration();
    await this.checkScripts();
    await this.checkGitConfiguration();
    
    const report = await this.generateReport();
    
    // Print summary
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      this.log(`🚨 Found ${errorCount} errors that must be fixed`, 'error');
    }
    
    if (warningCount > 0) {
      this.log(`⚠️ Found ${warningCount} warnings to address`, 'warning');
    }
    
    if (this.issues.length === 0) {
      this.log('✅ Environment is ready for development!', 'success');
    }
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new BugBotLocalMonitor();
  monitor.run().catch(console.error);
}

module.exports = BugBotLocalMonitor; 