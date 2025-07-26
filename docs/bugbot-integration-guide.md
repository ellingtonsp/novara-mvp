# 🐛 BugBot Integration Guide for Novara MVP

## **Overview**

BugBot is an automated bug detection and reporting system integrated into your Novara MVP workflow. It monitors deployments, detects issues, and creates detailed reports to help maintain code quality and system reliability.

---

## **🎯 What BugBot Does**

### **Automated Monitoring**
- **Local Development**: Checks environment setup, dependencies, and configuration
- **Deployment Validation**: Monitors staging and production deployments
- **Runtime Health**: Tracks application health and performance
- **Issue Detection**: Identifies common problems and provides fixes

### **Smart Reporting**
- **GitHub Issues**: Automatically creates detailed bug reports
- **Markdown Reports**: Generates human-readable documentation
- **JSON Data**: Provides structured data for analysis
- **Actionable Fixes**: Suggests specific commands to resolve issues

---

## **🚀 Quick Start**

### **1. Local Development Check**
```bash
# Check your local environment
npm run bugbot:local

# This will:
# - Check port availability (4200, 9002, etc.)
# - Validate environment files
# - Check dependencies
# - Verify database configuration
# - Validate Git setup
# - Generate detailed report
```

### **2. Pre-Deployment Validation**
```bash
# Run comprehensive pre-deployment checks
npm run bugbot:pre-deploy

# This combines:
# - Local environment check
# - Safety validation
# - Environment configuration
# - Test execution
```

### **3. Post-Deployment Verification**
```bash
# Check staging deployment
npm run bugbot:post-deploy staging

# Check production deployment  
npm run bugbot:post-deploy production
```

### **4. Continuous Monitoring**
```bash
# Run local checks + monitoring
npm run bugbot:monitor
```

---

## **📋 Integration Points**

### **GitHub Actions Workflow**
BugBot is integrated into your CI/CD pipeline via `.github/workflows/bugbot-integration.yml`:

- **Triggers**: On push to main/staging, PR creation, workflow failures
- **Actions**: 
  - Analyzes failed deployments
  - Creates GitHub issues with detailed reports
  - Monitors runtime health
  - Validates environment configurations

### **Package.json Scripts**
```json
{
  "bugbot:local": "node scripts/bugbot-local-monitor.js",
  "bugbot:pre-deploy": "npm run bugbot:local && npm run safety:check",
  "bugbot:post-deploy": "node scripts/bugbot-post-deploy-check.js",
  "bugbot:monitor": "npm run bugbot:local && npm run monitor:all"
}
```

### **Development Workflow**
```bash
# 1. Start development
npm run bugbot:local  # Check environment

# 2. Make changes
# ... your development work ...

# 3. Pre-deployment check
npm run bugbot:pre-deploy

# 4. Deploy to staging
./scripts/deploy-staging-automated.sh

# 5. Post-deployment validation
npm run bugbot:post-deploy staging

# 6. Deploy to production (if staging OK)
./scripts/deploy-production-safe.sh

# 7. Production validation
npm run bugbot:post-deploy production
```

---

## **🔍 What BugBot Checks**

### **Local Development Environment**
- ✅ **Port Availability**: Checks for conflicts on 4200, 9002, 3000-3002
- ✅ **Environment Files**: Validates `.env.development` files exist and are configured
- ✅ **Dependencies**: Ensures `node_modules` and `package.json` files are present
- ✅ **Database Configuration**: Checks SQLite setup and adapters
- ✅ **Scripts**: Validates deployment and utility scripts exist and are executable
- ✅ **Git Configuration**: Checks repository status and branch protection

### **Deployment Validation**
- ✅ **Health Endpoints**: Tests `/api/health` endpoints return 200
- ✅ **Frontend Accessibility**: Validates Vercel deployments are accessible
- ✅ **Database Connectivity**: Tests Airtable API connectivity
- ✅ **Environment Detection**: Verifies correct environment variables
- ✅ **Script Syntax**: Validates deployment script syntax

### **Runtime Monitoring**
- ✅ **Service Health**: Monitors Railway and Vercel services
- ✅ **Response Times**: Tracks API performance
- ✅ **Error Rates**: Detects increased error rates
- ✅ **Environment Mismatches**: Identifies configuration issues

---

## **📊 BugBot Reports**

### **Report Types**
1. **Local Development Report** (`bugbot-local-report.md`)
2. **Post-Deployment Report** (`bugbot-post-deploy-{env}.md`)
3. **GitHub Issues** (automatically created)
4. **JSON Data** (for programmatic analysis)

### **Report Structure**
```markdown
# 🐛 BugBot Report

## 📊 Summary
- Total Issues: X
- Errors: X (must fix)
- Warnings: X (recommended)

## 🚨 Issues Found
### Errors (Must Fix)
- Issue description
- Type: issue_type
- Details: specific details
- Fix: `command to run`

### Warnings (Recommended)
- Issue description
- Type: issue_type
- Details: specific details
- Fix: `command to run`

## 🔧 Recommendations
- Actionable recommendations

## 📋 Quick Fix Commands
```bash
# Commands to resolve issues
```
```

---

## **🎯 Common Issues & Fixes**

### **Port Conflicts**
```bash
# Problem: Ports 4200, 9002 occupied
# Fix: Kill conflicting processes
./scripts/kill-local-servers.sh
```

### **Missing Environment Files**
```bash
# Problem: Missing .env.development files
# Fix: Copy from examples
cp frontend/.env.development.example frontend/.env.development
cp backend/.env.development.example backend/.env.development
```

### **Database Issues**
```bash
# Problem: Local SQLite database missing
# Fix: Seed test data
node backend/scripts/seed-test-data.js
```

### **Deployment Failures**
```bash
# Problem: Railway deployment failed
# Fix: Check logs and redeploy
railway logs
./scripts/deploy-staging-automated.sh
```

### **Environment Mismatches**
```bash
# Problem: Wrong environment detected
# Fix: Check NODE_ENV and environment variables
echo $NODE_ENV
cat backend/.env.development
```

---

## **🔧 Customization**

### **Adding Custom Checks**
Edit `scripts/bugbot-local-monitor.js` to add new checks:

```javascript
async checkCustomFeature() {
  this.log('Checking custom feature...');
  
  // Your custom check logic
  if (/* issue detected */) {
    this.issues.push({
      type: 'custom_issue',
      severity: 'error',
      message: 'Custom issue description',
      details: 'Specific details',
      fix: 'command to fix'
    });
  }
}
```

### **Modifying Report Format**
Edit the `generateMarkdownReport()` method to customize report output.

### **Adding New Environments**
Update the URL mappings in `scripts/bugbot-post-deploy-check.js`:

```javascript
const urls = {
  staging: 'https://novara-staging-staging.up.railway.app/api/health',
  production: 'https://novara-mvp-production.up.railway.app/api/health',
  development: 'http://localhost:9002/api/health'  // Add new environment
};
```

---

## **🚨 Troubleshooting**

### **BugBot Scripts Not Found**
```bash
# Problem: Scripts not executable
# Fix: Make scripts executable
chmod +x scripts/bugbot-local-monitor.js
chmod +x scripts/bugbot-post-deploy-check.js
```

### **GitHub Actions Not Triggering**
```bash
# Problem: BugBot workflow not running
# Fix: Check workflow file and triggers
cat .github/workflows/bugbot-integration.yml
```

### **Reports Not Generated**
```bash
# Problem: No report files created
# Fix: Check file permissions and Node.js version
node --version
ls -la scripts/bugbot-*.js
```

### **False Positives**
```bash
# Problem: BugBot reporting non-issues
# Fix: Adjust severity levels in scripts
# Edit the severity field in issue objects
```

---

## **📈 Best Practices**

### **Daily Workflow**
1. **Start Day**: `npm run bugbot:local`
2. **Before Commits**: `npm run bugbot:pre-deploy`
3. **After Deployments**: `npm run bugbot:post-deploy {env}`
4. **End Day**: `npm run bugbot:monitor`

### **Team Integration**
- **Code Reviews**: Include BugBot reports in PR descriptions
- **Deployment Gates**: Require BugBot validation before production
- **Monitoring**: Set up alerts for BugBot-identified issues
- **Documentation**: Keep BugBot reports in project documentation

### **Continuous Improvement**
- **Regular Updates**: Update BugBot checks as project evolves
- **Issue Patterns**: Analyze common issues and add preventive checks
- **Performance**: Monitor BugBot execution time and optimize
- **Feedback**: Use BugBot reports to improve development practices

---

## **🔗 Related Documentation**

- [Deployment Guide](./railway-deployment.md)
- [Local Development Guide](./local-development-guide.md)
- [Environment Configuration](./environment-configuration.md)
- [Troubleshooting Guide](./troubleshooting/local-development-issues.md)
- [GitHub Actions CI/CD](./.github/workflows/ci.yml)

---

## **📞 Support**

For BugBot issues:
1. Check this guide for troubleshooting steps
2. Review generated reports for specific error messages
3. Check GitHub Actions logs for workflow issues
4. Validate environment configuration
5. Run manual checks to verify BugBot accuracy

**Remember**: BugBot is designed to help, not replace human judgment. Always review reports and validate fixes before applying them. 