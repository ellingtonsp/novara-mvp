#!/usr/bin/env node

/**
 * 🐛 BugBot Post-Deployment Check
 * 
 * Validates deployments and creates detailed reports
 * for Novara MVP staging and production environments
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

class BugBotPostDeployCheck {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      environment: process.argv[2] || 'staging',
      checks: [],
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

  async makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout }, (res) => {
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
    });
  }

  async checkHealthEndpoint(environment) {
    this.log(`Checking ${environment} health endpoint...`);
    
    const urls = {
      staging: 'https://novara-staging-staging.up.railway.app/api/health',
      production: 'https://novara-mvp-production.up.railway.app/api/health'
    };
    
    const url = urls[environment];
    if (!url) {
      this.report.issues.push({
        type: 'invalid_environment',
        severity: 'error',
        message: `Invalid environment: ${environment}`,
        details: 'Must be staging or production'
      });
      return;
    }
    
    try {
      const response = await this.makeRequest(url);
      
      this.report.checks.push({
        type: 'health_endpoint',
        environment,
        status: response.statusCode === 200 ? 'success' : 'failure',
        statusCode: response.statusCode,
        responseTime: 'measured'
      });
      
      if (response.statusCode !== 200) {
        this.report.issues.push({
          type: 'health_endpoint_failure',
          severity: 'error',
          message: `${environment} health endpoint returned ${response.statusCode}`,
          details: `Expected 200, got ${response.statusCode}`,
          fix: `Check Railway dashboard for ${environment} deployment`
        });
      } else {
        this.log(`${environment} health endpoint is working`, 'success');
      }
      
      // Parse response data
      try {
        const healthData = JSON.parse(response.data);
        this.report.checks.push({
          type: 'health_data',
          environment,
          status: 'success',
          data: healthData
        });
      } catch (parseError) {
        this.report.issues.push({
          type: 'health_data_parse_error',
          severity: 'warning',
          message: `Could not parse ${environment} health response`,
          details: 'Response is not valid JSON',
          fix: 'Check backend health endpoint implementation'
        });
      }
      
    } catch (error) {
      this.report.checks.push({
        type: 'health_endpoint',
        environment,
        status: 'failure',
        error: error.message
      });
      
      this.report.issues.push({
        type: 'health_endpoint_error',
        severity: 'error',
        message: `${environment} health endpoint is unreachable`,
        details: error.message,
        fix: `Check Railway deployment status for ${environment}`
      });
    }
  }

  async checkFrontendAccessibility(environment) {
    this.log(`Checking ${environment} frontend accessibility...`);
    
    const urls = {
      staging: 'https://novara-mvp-staging.vercel.app',
      production: 'https://novara-mvp.vercel.app'
    };
    
    const url = urls[environment];
    if (!url) {
      return; // Skip if no frontend URL for this environment
    }
    
    try {
      const response = await this.makeRequest(url);
      
      this.report.checks.push({
        type: 'frontend_accessibility',
        environment,
        status: response.statusCode === 200 ? 'success' : 'failure',
        statusCode: response.statusCode
      });
      
      if (response.statusCode !== 200) {
        this.report.issues.push({
          type: 'frontend_accessibility_failure',
          severity: 'error',
          message: `${environment} frontend returned ${response.statusCode}`,
          details: `Expected 200, got ${response.statusCode}`,
          fix: `Check Vercel dashboard for ${environment} deployment`
        });
      } else {
        this.log(`${environment} frontend is accessible`, 'success');
      }
      
    } catch (error) {
      this.report.checks.push({
        type: 'frontend_accessibility',
        environment,
        status: 'failure',
        error: error.message
      });
      
      this.report.issues.push({
        type: 'frontend_accessibility_error',
        severity: 'error',
        message: `${environment} frontend is unreachable`,
        details: error.message,
        fix: `Check Vercel deployment status for ${environment}`
      });
    }
  }

  async checkDatabaseConnectivity(environment) {
    this.log(`Checking ${environment} database connectivity...`);
    
    const urls = {
      staging: 'https://novara-staging-staging.up.railway.app/api/checkins',
      production: 'https://novara-mvp-production.up.railway.app/api/checkins'
    };
    
    const url = urls[environment];
    
    try {
      const response = await this.makeRequest(url);
      
      this.report.checks.push({
        type: 'database_connectivity',
        environment,
        status: response.statusCode < 500 ? 'success' : 'failure',
        statusCode: response.statusCode
      });
      
      if (response.statusCode >= 500) {
        this.report.issues.push({
          type: 'database_connectivity_failure',
          severity: 'error',
          message: `${environment} database connectivity issue`,
          details: `API returned ${response.statusCode}`,
          fix: `Check Airtable connectivity and API keys for ${environment}`
        });
      } else {
        this.log(`${environment} database connectivity is working`, 'success');
      }
      
    } catch (error) {
      this.report.checks.push({
        type: 'database_connectivity',
        environment,
        status: 'failure',
        error: error.message
      });
      
      this.report.issues.push({
        type: 'database_connectivity_error',
        severity: 'error',
        message: `${environment} database connectivity error`,
        details: error.message,
        fix: `Check Airtable API configuration for ${environment}`
      });
    }
  }

  async checkEnvironmentDetection(environment) {
    this.log(`Checking ${environment} environment detection...`);
    
    const urls = {
      staging: 'https://novara-staging-staging.up.railway.app/api/health',
      production: 'https://novara-mvp-production.up.railway.app/api/health'
    };
    
    const url = urls[environment];
    
    try {
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 200) {
        try {
          const healthData = JSON.parse(response.data);
          const detectedEnv = healthData.environment;
          
          this.report.checks.push({
            type: 'environment_detection',
            environment,
            status: detectedEnv === environment ? 'success' : 'failure',
            detected: detectedEnv,
            expected: environment
          });
          
          if (detectedEnv !== environment) {
            this.report.issues.push({
              type: 'environment_detection_mismatch',
              severity: 'error',
              message: `Environment detection mismatch in ${environment}`,
              details: `Expected ${environment}, detected ${detectedEnv}`,
              fix: `Check NODE_ENV and environment variables for ${environment}`
            });
          } else {
            this.log(`${environment} environment detection is correct`, 'success');
          }
          
        } catch (parseError) {
          this.report.issues.push({
            type: 'environment_detection_parse_error',
            severity: 'warning',
            message: `Could not parse environment detection response`,
            details: 'Response is not valid JSON',
            fix: 'Check backend health endpoint implementation'
          });
        }
      }
      
    } catch (error) {
      this.report.checks.push({
        type: 'environment_detection',
        environment,
        status: 'failure',
        error: error.message
      });
    }
  }

  async checkDeploymentScripts() {
    this.log('Checking deployment script syntax...');
    
    const scripts = [
      'scripts/deploy-staging-automated.sh',
      'scripts/deploy-production-safe.sh'
    ];
    
    for (const script of scripts) {
      try {
        execSync(`bash -n ${script}`, { stdio: 'pipe' });
        this.report.checks.push({
          type: 'deployment_script_syntax',
          script,
          status: 'success'
        });
        this.log(`${script} syntax is valid`, 'success');
      } catch (error) {
        this.report.checks.push({
          type: 'deployment_script_syntax',
          script,
          status: 'failure',
          error: error.message
        });
        
        this.report.issues.push({
          type: 'deployment_script_syntax_error',
          severity: 'error',
          message: `Syntax error in ${script}`,
          details: error.message,
          fix: `Run: bash -n ${script} to see syntax errors`
        });
      }
    }
  }

  async generateReport() {
    this.log('Generating BugBot post-deployment report...');
    
    // Generate recommendations based on issues
    const errorCount = this.report.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.report.issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      this.report.recommendations.push('🚨 Fix all errors before considering deployment successful');
    }
    
    if (warningCount > 0) {
      this.report.recommendations.push('⚠️ Address warnings to improve deployment quality');
    }
    
    if (this.report.issues.length === 0) {
      this.report.recommendations.push('✅ Deployment appears successful - monitor for runtime issues');
    }
    
    // Save report to file
    const reportPath = `bugbot-post-deploy-${this.report.environment}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport();
    fs.writeFileSync(`bugbot-post-deploy-${this.report.environment}.md`, markdownReport);
    
    this.log(`Report saved to: ${reportPath} and bugbot-post-deploy-${this.report.environment}.md`, 'success');
    
    return this.report;
  }

  generateMarkdownReport() {
    let markdown = `# 🐛 BugBot Post-Deployment Report

**Generated:** ${this.report.timestamp}
**Environment:** ${this.report.environment}

## 📊 Summary

- **Total Checks:** ${this.report.checks.length}
- **Total Issues:** ${this.report.issues.length}
- **Errors:** ${this.report.issues.filter(i => i.severity === 'error').length}
- **Warnings:** ${this.report.issues.filter(i => i.severity === 'warning').length}

## 🔍 Check Results

`;

    // Group checks by type
    const checkGroups = {};
    this.report.checks.forEach(check => {
      if (!checkGroups[check.type]) {
        checkGroups[check.type] = [];
      }
      checkGroups[check.type].push(check);
    });
    
    for (const [type, checks] of Object.entries(checkGroups)) {
      markdown += `### ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`;
      
      checks.forEach(check => {
        const status = check.status === 'success' ? '✅' : '❌';
        markdown += `- ${status} ${check.environment || check.script || 'Unknown'}`;
        if (check.statusCode) markdown += ` (HTTP ${check.statusCode})`;
        if (check.error) markdown += ` - ${check.error}`;
        markdown += '\n';
      });
      markdown += '\n';
    }
    
    if (this.report.issues.length === 0) {
      markdown += `## ✅ All Clear!

Your ${this.report.environment} deployment appears successful.

### 🚀 Next Steps
1. Monitor runtime performance
2. Run end-to-end tests: \`npm run test:all-environments\`
3. Check user analytics and engagement

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
# Check deployment status
npm run health-check:${this.report.environment}

# Run comprehensive tests
npm run test:all-environments

# Monitor deployment
npm run monitor:all

# Redeploy if needed
./scripts/deploy-${this.report.environment}-automated.sh
\`\`\`

---
*Report generated by BugBot Post-Deployment Check*
`;

    return markdown;
  }

  async run() {
    this.log(`🐛 BugBot Post-Deployment Check Starting for ${this.report.environment}...`);
    
    await this.checkHealthEndpoint(this.report.environment);
    await this.checkFrontendAccessibility(this.report.environment);
    await this.checkDatabaseConnectivity(this.report.environment);
    await this.checkEnvironmentDetection(this.report.environment);
    await this.checkDeploymentScripts();
    
    const report = await this.generateReport();
    
    // Print summary
    const errorCount = this.report.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.report.issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      this.log(`🚨 Found ${errorCount} errors in ${this.report.environment} deployment`, 'error');
    }
    
    if (warningCount > 0) {
      this.log(`⚠️ Found ${warningCount} warnings in ${this.report.environment} deployment`, 'warning');
    }
    
    if (this.report.issues.length === 0) {
      this.log(`✅ ${this.report.environment} deployment appears successful!`, 'success');
    }
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new BugBotPostDeployCheck();
  monitor.run().catch(console.error);
}

module.exports = BugBotPostDeployCheck; 