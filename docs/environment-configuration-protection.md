# 🛡️ Environment Configuration Protection Guide

## Overview

This guide explains how to prevent breaking environment configurations as we develop and deploy the Novara MVP application.

## 🚨 **Why Protection is Critical**

Environment configurations are the backbone of our deployment system. Breaking them can cause:
- ❌ Failed deployments
- ❌ Broken health checks
- ❌ Inaccessible applications
- ❌ CI/CD pipeline failures
- ❌ Production outages

## 🛡️ **Protection Mechanisms**

### 1. **Automated Validation Script**

**File**: `scripts/validate-environment-config.js`

**What it does**:
- Validates all environment URLs are accessible
- Checks backend health endpoints
- Verifies frontend accessibility
- Ensures URL format consistency
- Validates environment name matching

**Usage**:
```bash
# Validate all environments
node scripts/validate-environment-config.js

# Run before any deployment
npm run validate-environments
```

### 2. **Git Hooks (Pre-commit & Pre-push)**

**Setup**:
```bash
./scripts/setup-git-hooks.sh
```

**What they do**:
- **Pre-commit**: Validates configs and runs tests before each commit
- **Pre-push**: Validates all environments before pushing to remote

**Bypass (emergency only)**:
```bash
git commit --no-verify
git push --no-verify
```

### 3. **CI/CD Pipeline Integration**

**File**: `.github/workflows/environment-validation.yml`

**Triggers**:
- Changes to `scripts/environment-config.js`
- Changes to any script files
- Pull requests to main/staging

**Validates**:
- Environment configurations
- Health checks
- Test suite
- Creates detailed reports

## 📋 **Best Practices**

### **Before Making Changes**

1. **Always validate first**:
   ```bash
   node scripts/validate-environment-config.js
   ```

2. **Test locally**:
   ```bash
   npm test
   ./scripts/start-dev-stable.sh
   ```

3. **Check current status**:
   ```bash
   node scripts/comprehensive-health-check.js check
   ```

### **When Modifying Environment Config**

1. **Make changes incrementally**
2. **Test each environment individually**
3. **Validate before committing**
4. **Document changes**

### **Emergency Procedures**

If environment configs are broken:

1. **Immediate fix**:
   ```bash
   git revert HEAD
   git push
   ```

2. **Manual validation**:
   ```bash
   node scripts/quick-health-check.js production
   node scripts/quick-health-check.js staging
   ```

3. **Rollback deployment** if needed

## 🔧 **Configuration Files**

### **Primary Config**
- `scripts/environment-config.js` - Single source of truth

### **Validation Scripts**
- `scripts/validate-environment-config.js` - Validates all configs
- `scripts/quick-health-check.js` - Quick health checks
- `scripts/comprehensive-health-check.js` - Detailed health checks

### **Git Hooks**
- `.git/hooks/pre-commit` - Pre-commit validation
- `.git/hooks/pre-push` - Pre-push validation

## 🚨 **Common Issues & Fixes**

### **Issue**: Environment URL changed
**Fix**: Update `scripts/environment-config.js` and validate

### **Issue**: Health endpoint not responding
**Fix**: Check deployment status and logs

### **Issue**: Frontend not accessible
**Fix**: Verify Vercel deployment and domain configuration

### **Issue**: Environment mismatch
**Fix**: Ensure backend returns correct environment name

## 📊 **Monitoring**

### **Automated Monitoring**
- GitHub Actions validates on every change
- Pre-commit hooks prevent broken commits
- Pre-push hooks prevent broken deployments

### **Manual Monitoring**
```bash
# Quick status check
node scripts/quick-health-check.js all

# Detailed health report
node scripts/comprehensive-health-check.js check

# Environment validation
node scripts/validate-environment-config.js
```

## 🎯 **Success Metrics**

- ✅ All environments accessible
- ✅ Health checks passing
- ✅ Tests running successfully
- ✅ Deployments completing without issues
- ✅ No configuration-related failures

## 🔄 **Continuous Improvement**

1. **Regular validation runs**
2. **Monitor for new failure patterns**
3. **Update validation rules as needed**
4. **Document lessons learned**

---

**Remember**: Environment configurations are critical infrastructure. Always validate before making changes! 🛡️ 