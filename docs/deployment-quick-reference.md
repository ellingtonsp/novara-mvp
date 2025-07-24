# 🚀 Deployment Quick Reference

## 📋 Pre-Deployment Checklist

### 1. Environment Validation
```bash
# Run comprehensive environment validation
npm run validate-environments

# Check specific environment health
npm run health-check:staging
npm run health-check:production
npm run health-check:dev
```

### 2. Manual Validation Steps
- [ ] No hardcoded URLs in components
- [ ] Environment configuration files exist
- [ ] Backend connectivity works
- [ ] Frontend accessibility works
- [ ] CORS configuration is correct

## 🚀 Deployment Commands

### Automated Deployment (Recommended)
```bash
# Deploy to staging with full validation
npm run deploy:staging

# Deploy to production with full validation
npm run deploy:production
```

### Manual Deployment
```bash
# Pre-deployment validation
npm run pre-deploy

# Push to staging
git push origin staging

# Push to production
git push origin main
```

## 🔍 Health Check Commands

### Environment Health
```bash
# Check all environments
npm run health-check

# Check specific environment
npm run health-check:dev
npm run health-check:staging
npm run health-check:production
```

### Manual Health Checks
```bash
# Backend health endpoints
curl https://novara-staging-staging.up.railway.app/api/health
curl https://novara-mvp-production.up.railway.app/api/health

# Frontend accessibility
curl https://novara-mvp-git-staging-novara-fertility.vercel.app
curl https://novara-mvp.vercel.app
```

## 📊 Validation Results

### ✅ Success Indicators
- Environment validator passes
- Health checks return 200 OK
- Environment detection shows correct environment
- No CORS errors
- All API endpoints respond correctly

### ❌ Failure Indicators
- Environment validator fails
- Health checks return errors
- Environment mismatch detected
- CORS errors in browser console
- API endpoints not responding

## 🚨 Emergency Procedures

### Quick Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or switch to previous deployment in Railway dashboard
```

### Manual Validation
```bash
# Run all validations
npm run validate-environments
npm run health-check:staging
npm run health-check:production
```

## 📝 Environment URLs

### Staging
- **Frontend**: https://novara-mvp-git-staging-novara-fertility.vercel.app
- **Backend**: https://novara-staging-staging.up.railway.app
- **Health Check**: https://novara-staging-staging.up.railway.app/api/health

### Production
- **Frontend**: https://novara-mvp.vercel.app
- **Backend**: https://novara-mvp-production.up.railway.app
- **Health Check**: https://novara-mvp-production.up.railway.app/api/health

### Development
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:9002
- **Health Check**: http://localhost:9002/api/health

## 🔧 Troubleshooting

### Common Issues
1. **Environment Validator Fails**
   - Check for hardcoded URLs in components
   - Verify environment configuration files exist
   - Run `npm run validate-environments` for details

2. **Health Check Fails**
   - Check if backend is running
   - Verify environment variables are set correctly
   - Check Railway deployment status

3. **CORS Errors**
   - Verify frontend URL is in backend CORS configuration
   - Check environment detection is working correctly
   - Ensure API_BASE_URL is set correctly

### Debug Commands
```bash
# Check environment configuration
cat frontend/src/lib/environment.ts

# Check for hardcoded URLs
grep -r "novara-backend" frontend/src/
grep -r "localhost:300" frontend/src/

# Check environment variables
echo $VITE_API_URL
echo $NODE_ENV
```

## 📚 Related Documentation
- [Environment Stability Plan](./environment-stability-plan.md)
- [Staging Deployment Checklist](./staging-deployment-checklist.md)
- [Production Deployment Guide](./production-deployment-guide.md)
- [Environment Best Practices](./environment-best-practices.md)

---

**Remember**: Always run `npm run validate-environments` before any deployment to prevent issues! 