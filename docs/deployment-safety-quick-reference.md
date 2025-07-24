# Deployment Safety Quick Reference

## 🚀 Quick Deployment Commands

### Pre-Deployment Validation (ALWAYS RUN FIRST)
```bash
# Complete validation suite
npm run pre-deploy

# Individual validations
npm run validate-environments
npm run validate-schema-comprehensive
npm run health-check:staging
npm run health-check:production
```

### Staging Deployment
```bash
# 1. Validate everything
npm run pre-deploy

# 2. Deploy to staging
git checkout staging
git merge main
git push origin staging

# 3. Wait for deployment (2-3 minutes)
# 4. Validate staging
npm run health-check:staging
```

### Production Deployment
```bash
# 1. Ensure staging is fully tested
npm run health-check:staging

# 2. Deploy to production
git checkout main
git merge staging
git push origin main

# 3. Wait for deployment (2-3 minutes)
# 4. Validate production
npm run health-check:production
```

## 🛡️ Critical Safety Checks

### Before ANY Production Deployment
- [ ] Staging environment fully tested and validated
- [ ] All schema validations pass
- [ ] No hardcoded URLs in any components
- [ ] Environment detection working correctly
- [ ] CORS configuration allows all frontend URLs

### Emergency Rollback
```bash
# If production issues detected
git revert <commit-hash>
git push origin main
npm run health-check:production
```

## 📊 Health Check Results Interpretation

### ✅ Good Results
- Backend health checks: 200
- Environment detection: correct environment name
- Frontend accessible: 200
- Schema validation: all field values accepted

### ⚠️ Warning Signs
- 401 errors on authenticated endpoints (expected without tokens)
- Development backend not running (expected during validation)
- Data type validation errors (review field types)

### ❌ Critical Issues
- Backend health checks failing
- Environment detection incorrect
- Frontend not accessible
- Schema validation rejecting field values

## 🔧 Troubleshooting Common Issues

### Schema Issues
```bash
# Test specific field values
node scripts/comprehensive-schema-check.js

# Check Airtable field configuration
# Verify field types and allowed values
```

### Environment Issues
```bash
# Check environment variables
node scripts/environment-validator.js

# Test specific environment
npm run health-check:staging
npm run health-check:production
```

### Deployment Issues
```bash
# Force redeploy with cache bust
# Edit frontend/src/lib/environment.ts timestamp
git add . && git commit -m "force redeploy" && git push
```

## 📞 Emergency Contacts

- **Production Issues**: Immediate rollback required
- **Staging Issues**: Fix before production deployment
- **Schema Issues**: Update Airtable configuration
- **Environment Issues**: Check Railway/Vercel settings

---

**Remember**: Always validate in staging before production deployment! 