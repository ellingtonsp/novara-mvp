# Deployment Safety Checklist

## 🛡️ Production Protection Protocol

This checklist ensures that production functionality is preserved while validating all changes in lower environments before deployment.

### Pre-Deployment Validation

#### ✅ Environment Configuration
- [ ] Run `npm run validate-environments` - All checks pass
- [ ] Run `npm run health-check:staging` - Staging environment healthy
- [ ] Run `npm run validate-schema-comprehensive` - Airtable schema compatible
- [ ] Verify no hardcoded URLs in any frontend components
- [ ] Confirm environment variables are properly configured for all environments

#### ✅ Code Quality
- [ ] All changes committed to `staging` branch
- [ ] Staging branch merged with `main` (if applicable)
- [ ] No merge conflicts in any configuration files
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No TypeScript/ESLint errors

#### ✅ Schema Validation
- [ ] All frontend field values accepted by Airtable
- [ ] Data types validated (confidence values numeric, email_opt_in boolean)
- [ ] No rejected field values in comprehensive schema check

### Deployment Process

#### 🚀 Staging Deployment
1. **Pre-deployment checks:**
   - [ ] Run `npm run pre-deploy` (includes all validations)
   - [ ] Verify staging backend is accessible
   - [ ] Confirm staging frontend builds successfully

2. **Deploy to staging:**
   - [ ] Push to `staging` branch: `git push origin staging`
   - [ ] Wait for Railway backend deployment (2-3 minutes)
   - [ ] Wait for Vercel frontend deployment (1-2 minutes)

3. **Post-deployment validation:**
   - [ ] Run `npm run health-check:staging`
   - [ ] Test user onboarding flow in staging
   - [ ] Verify all field values work correctly
   - [ ] Test API endpoints with authentication

#### 🚀 Production Deployment
1. **Pre-production validation:**
   - [ ] Staging environment fully tested and validated
   - [ ] Run `npm run health-check:production` (baseline)
   - [ ] Confirm production backend is healthy

2. **Deploy to production:**
   - [ ] Merge `staging` to `main`: `git checkout main && git merge staging`
   - [ ] Push to `main`: `git push origin main`
   - [ ] Wait for Railway backend deployment
   - [ ] Wait for Vercel frontend deployment

3. **Post-production validation:**
   - [ ] Run `npm run health-check:production`
   - [ ] Verify production environment detection shows "production" (not "staging")
   - [ ] Check browser console for `🚀 AN-01 DEBUG: Current environment: production`
   - [ ] Verify PostHog analytics initialization successful
   - [ ] Test critical user flows
   - [ ] Monitor for any errors

### Emergency Procedures

#### 🚨 Rollback Process
If issues are detected in production:

1. **Immediate actions:**
   - [ ] Identify the problematic commit
   - [ ] Revert to previous working commit: `git revert <commit-hash>`
   - [ ] Push revert: `git push origin main`

2. **Validation:**
   - [ ] Run `npm run health-check:production`
   - [ ] Verify functionality is restored
   - [ ] Document the issue for future prevention

#### 🚨 Hot Fixes
For critical production issues:

1. **Create hot fix:**
   - [ ] Create hot fix branch: `git checkout -b hotfix/critical-issue`
   - [ ] Make minimal necessary changes
   - [ ] Test locally if possible

2. **Deploy hot fix:**
   - [ ] Merge directly to `main` (bypass staging for critical issues)
   - [ ] Push immediately: `git push origin main`
   - [ ] Monitor deployment and validate

### Monitoring and Validation

#### 📊 Health Monitoring
- [ ] Backend health checks return 200
- [ ] Environment detection working correctly (shows correct environment)
- [ ] PostHog analytics initialization successful
- [ ] CORS configuration allows all frontend URLs
- [ ] API endpoints accessible (with proper authentication)

#### 📊 Schema Monitoring
- [ ] All frontend field values accepted by Airtable
- [ ] No data type validation errors
- [ ] User onboarding flow works end-to-end

### Documentation

#### 📝 Change Documentation
- [ ] Update relevant documentation
- [ ] Document any schema changes
- [ ] Update deployment guides if needed
- [ ] Record any issues and resolutions

#### 📝 Post-Deployment Review
- [ ] Verify all environments are functioning
- [ ] Confirm no regressions introduced
- [ ] Update this checklist based on lessons learned

## 🎯 Success Criteria

A successful deployment is achieved when:

1. **All environments healthy:** Development, staging, and production all pass health checks
2. **No regressions:** Existing functionality preserved across all environments
3. **New features working:** All new features function correctly in staging and production
4. **Schema compatibility:** All frontend data accepted by Airtable without errors
5. **User experience:** End-to-end user flows work seamlessly

## 🔄 Continuous Improvement

- [ ] Review deployment process after each deployment
- [ ] Update validation scripts based on new requirements
- [ ] Improve monitoring and alerting
- [ ] Document any new edge cases or issues discovered

---

**Last Updated:** $(date)
**Version:** 1.0 