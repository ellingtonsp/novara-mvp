# Deployment Troubleshooting Guide

**Last Updated:** July 25, 2025  
**Version:** 1.0  
**Environment:** Novara MVP

## 🚨 Critical Deployment Issues & Solutions

### TypeScript Build Errors in Production

#### Issue: Build Failure Due to Unused Variables
**Error Message:** `'testUtils' is declared but its value is never read.`

**Root Cause:**
- TypeScript compilation fails when unused variables are declared
- Test files are included in production builds
- Local builds may pass but production builds are stricter

**Solution:**
1. **Remove unused imports and variables**
2. **Run production build locally before deployment**
3. **Use TypeScript strict mode for builds**

**Prevention Checklist:**
- [ ] Run `npm run build` locally before deployment
- [ ] Check for unused imports: `import { beforeAll }` when not used
- [ ] Remove unused variables: `let testUtils` when not used
- [ ] Use `npm run test:frontend` to catch test file issues
- [ ] Validate TypeScript compilation: `tsc --noEmit`

**Commands to Run Before Deployment:**
```bash
# Pre-deployment validation
cd frontend
npm run build                    # Test production build
tsc --noEmit                     # TypeScript compilation check
npm run test                     # Run all tests
cd ..
npm run validate:deployment      # Full validation
```

### Common Build Failures

#### 1. TypeScript Compilation Errors
**Symptoms:**
- Build fails with TypeScript errors
- Unused variable warnings
- Import/export issues

**Solutions:**
```bash
# Fix TypeScript errors
npm run build                    # Identify errors
tsc --noEmit                     # Check compilation
# Fix errors in source files
npm run build                    # Verify fix
```

#### 2. Environment Variable Issues
**Symptoms:**
- Build fails with missing environment variables
- Runtime errors in production

**Solutions:**
```bash
# Validate environment configuration
npm run validate:environments
# Check environment files
ls -la frontend/.env.*
ls -la backend/env.*
```

#### 3. Dependency Issues
**Symptoms:**
- Build fails with missing dependencies
- Version conflicts

**Solutions:**
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
cd frontend && npm install
cd ../backend && npm install
```

## 🔧 Pre-Deployment Validation Checklist

### Frontend Validation
```bash
# 1. TypeScript compilation
cd frontend
tsc --noEmit

# 2. Production build test
npm run build

# 3. Test execution
npm run test

# 4. Linting
npm run lint  # if available
```

### Backend Validation
```bash
# 1. TypeScript compilation (if applicable)
cd backend
tsc --noEmit  # if TypeScript

# 2. Test execution
npm run test

# 3. Environment validation
npm run validate:environments
```

### Full System Validation
```bash
# 1. Complete validation
npm run validate:deployment

# 2. Safety checks
npm run safety:check

# 3. Health checks
npm run health-check
```

## 🚀 Deployment Best Practices

### Before Every Deployment
1. **Run Local Production Build**
   ```bash
   cd frontend && npm run build
   cd ../backend && npm run build  # if applicable
   ```

2. **Validate TypeScript**
   ```bash
   cd frontend && tsc --noEmit
   ```

3. **Run All Tests**
   ```bash
   npm run test
   ```

4. **Check Environment Configuration**
   ```bash
   npm run validate:environments
   ```

5. **Verify Git Status**
   ```bash
   git status --porcelain
   ```

### Deployment Commands
```bash
# Staging deployment
npm run deploy:staging

# Production deployment (requires approval)
npm run deploy:production
```

## 📊 Error Monitoring

### Build Error Patterns
1. **TypeScript Errors:** Most common in frontend deployments
2. **Environment Issues:** Missing or incorrect environment variables
3. **Dependency Conflicts:** Version mismatches or missing packages
4. **Test Failures:** Broken tests preventing deployment

### Error Response Procedures
1. **Immediate Actions:**
   - Check build logs for specific error messages
   - Identify the failing component (frontend/backend)
   - Fix the issue locally first

2. **Validation:**
   - Test the fix locally
   - Run full validation suite
   - Commit and push the fix

3. **Re-deployment:**
   - Re-run deployment with fixes
   - Monitor build process
   - Validate post-deployment health

## 🔍 Debugging Commands

### Frontend Debugging
```bash
# Check TypeScript compilation
cd frontend && tsc --noEmit

# Check build process
cd frontend && npm run build

# Check test files specifically
cd frontend && npm run test

# Check for unused imports/variables
cd frontend && npx tsc --noUnusedLocals --noUnusedParameters
```

### Backend Debugging
```bash
# Check environment configuration
cd backend && node -e "console.log(process.env.NODE_ENV)"

# Check database connectivity
cd backend && npm run test

# Check service health
curl https://novara-mvp-production.up.railway.app/health
```

### System Debugging
```bash
# Check all environments
npm run validate:environments

# Check deployment status
npm run monitor:deployments

# Check health status
npm run health-check
```

## 🚨 Critical Lessons Learned

### TypeScript Build Errors (July 25, 2025)
**Issue:** Production deployment failed due to unused variables in test files
**Lesson:** Always run production build locally before deployment
**Prevention:** Add TypeScript validation to pre-deployment checklist

### Environment Validation
**Issue:** Environment-specific issues can cause deployment failures
**Lesson:** Validate all environments before deployment
**Prevention:** Use `npm run validate:environments` before every deployment

### Test File Inclusion
**Issue:** Test files are included in production builds
**Lesson:** Test files must be production-ready
**Prevention:** Run `npm run build` to catch test file issues

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Run local production build
- [ ] Validate TypeScript compilation
- [ ] Run all tests
- [ ] Check environment configuration
- [ ] Verify git status
- [ ] Run safety checks

### During Deployment
- [ ] Monitor build process
- [ ] Check for errors in logs
- [ ] Validate deployment success
- [ ] Run post-deployment health checks

### Post-Deployment
- [ ] Validate all environments
- [ ] Check monitoring systems
- [ ] Update documentation
- [ ] Log lessons learned

## 🎯 Success Metrics

### Deployment Success Indicators
- **Build Success Rate:** > 98%
- **Deployment Success Rate:** > 98%
- **Health Check Success Rate:** > 99%
- **Error Resolution Time:** < 30 minutes

### Quality Metrics
- **TypeScript Errors:** 0 in production builds
- **Test Coverage:** > 90%
- **Documentation Coverage:** 100%
- **Monitoring Coverage:** 100%

---

**Remember:** Always test locally before deploying to production. A few minutes of local validation can prevent hours of deployment troubleshooting. 