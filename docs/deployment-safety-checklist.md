# Deployment Safety Checklist

This checklist must be completed before ANY deployment to ensure safety and prevent critical configuration errors.

## 🚨 CRITICAL PRE-DEPLOYMENT CHECKS

### 1. Environment Verification (MANDATORY)
- [ ] **Current branch matches target environment**
  ```bash
  git branch
  # For staging: should be on 'staging' branch
  # For production: should be on 'main' branch
  ```

- [ ] **Railway context is correct**
  ```bash
  railway status
  # Verify: Project=novara-mvp
  # For staging: Environment=staging, Service=novara-staging
  # For production: Environment=production, Service=novara-main
  ```

### 2. Database Configuration Validation (CRITICAL)
- [ ] **Database isolation verified**
  ```bash
  railway variables | grep AIRTABLE_BASE_ID
  # For staging: AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
  # For production: AIRTABLE_BASE_ID=app5QWCcVbCnVg2Gg
  # CRITICAL: These must NEVER be mixed up
  ```

- [ ] **No cross-environment database sharing**
  - [ ] Staging environment uses staging database only
  - [ ] Production environment uses production database only
  - [ ] Development uses local SQLite only

### 3. Environment Variables Validation
- [ ] **All required variables are set**
  ```bash
  railway variables
  # Verify all required variables are present and correct
  ```

- [ ] **Environment-specific URLs are correct**
  - [ ] Frontend URL matches environment
  - [ ] Backend URL matches environment
  - [ ] CORS configuration is correct

### 4. Code Quality Checks
- [ ] **All tests pass locally**
  ```bash
  npm run test
  npm run health-check
  ```

- [ ] **No critical errors in logs**
  - [ ] Check for any error messages
  - [ ] Verify all services are healthy

### 5. User Approval (Production Only)
- [ ] **Explicit user approval for production changes**
  - [ ] User has confirmed production deployment
  - [ ] Staging validation completed successfully
  - [ ] All critical issues resolved

## 🔧 DEPLOYMENT COMMANDS

### Staging Deployment
```bash
# 1. Verify context
git branch  # Should be 'staging'
railway status  # Should show staging environment
railway variables | grep AIRTABLE_BASE_ID  # Should be appEOWvLjCn5c7Ght

# 2. Deploy frontend
cd frontend && vercel --target staging

# 3. Deploy backend
railway environment staging
railway service novara-staging
railway up
```

### Production Deployment
```bash
# 1. Verify context
git branch  # Should be 'main'
railway status  # Should show production environment
railway variables | grep AIRTABLE_BASE_ID  # Should be app5QWCcVbCnVg2Gg

# 2. Deploy frontend
cd frontend && vercel --prod

# 3. Deploy backend
railway environment production
railway service novara-main
railway up
```

## ✅ POST-DEPLOYMENT VALIDATION

### 1. Health Checks
- [ ] **Backend health check passes**
  ```bash
  curl https://[environment-url]/api/health
  # Should return 200 with correct environment info
  ```

- [ ] **Frontend loads correctly**
  - [ ] No console errors
  - [ ] All features working
  - [ ] Environment detection correct

### 2. Database Validation
- [ ] **Database connection working**
  - [ ] Can create test records
  - [ ] Can read existing data
  - [ ] No permission errors

- [ ] **Environment isolation maintained**
  - [ ] Staging data not visible in production
  - [ ] Production data not visible in staging

### 3. Feature Testing
- [ ] **Core functionality works**
  - [ ] User registration
  - [ ] Daily check-ins
  - [ ] Insights generation
  - [ ] Analytics tracking

- [ ] **Environment-specific features**
  - [ ] Staging: Test features enabled
  - [ ] Production: Production features only

## 🚨 EMERGENCY STOP CONDITIONS

**STOP DEPLOYMENT IMMEDIATELY if:**

1. **Database misconfiguration detected**
   - Wrong AIRTABLE_BASE_ID for environment
   - Cross-environment database sharing
   - Database connection errors

2. **Environment mismatch**
   - Wrong Railway environment selected
   - Wrong service selected
   - Wrong branch deployed

3. **Critical errors**
   - Application crashes on startup
   - Database connection failures
   - Security configuration errors

4. **User data at risk**
   - Production pointing to staging database
   - Staging pointing to production database
   - Data corruption detected

## 📋 ROLLBACK PROCEDURES

### Immediate Rollback
```bash
# 1. Stop deployment
# 2. Revert to previous working version
git checkout [previous-working-commit]
git push --force origin [branch-name]

# 3. Redeploy with correct configuration
railway up
```

### Database Rollback
```bash
# 1. Verify correct database configuration
railway variables | grep AIRTABLE_BASE_ID

# 2. Fix any misconfiguration
railway variables --set "AIRTABLE_BASE_ID=[correct-base-id]"

# 3. Redeploy
railway up
```

## 📊 DEPLOYMENT LOG

### Pre-Deployment
- [ ] Date: _______________
- [ ] Environment: _______________
- [ ] Branch: _______________
- [ ] Railway Context: _______________
- [ ] Database ID: _______________
- [ ] User Approval: _______________

### Post-Deployment
- [ ] Health Check: _______________
- [ ] Database Validation: _______________
- [ ] Feature Testing: _______________
- [ ] Issues Found: _______________
- [ ] Resolution: _______________

## 🔍 TROUBLESHOOTING

### Common Issues
1. **Wrong database ID**
   - Check `railway variables | grep AIRTABLE_BASE_ID`
   - Verify against environment table above
   - Fix immediately if incorrect

2. **Environment mismatch**
   - Check `railway status`
   - Verify environment and service match deployment target
   - Switch to correct environment if needed

3. **Deployment failures**
   - Check Railway logs: `railway logs`
   - Check Vercel logs: `vercel logs`
   - Verify all environment variables are set

### Emergency Contacts
- **Critical Database Issues**: Stop deployment immediately
- **Environment Misconfiguration**: Revert and redeploy
- **Data Corruption**: Emergency rollback required

---

**Remember**: This checklist is MANDATORY for all deployments. Skipping any step can result in data corruption, security breaches, or service outages. 