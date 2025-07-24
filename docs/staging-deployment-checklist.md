# 🚀 Staging Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All changes committed to feature branch
- [x] Feature branch pushed to remote repository
- [x] Pull request created (if applicable)
- [x] Code review completed (if applicable)
- [x] Local testing passed

### ✅ Configuration
- [x] Railway configuration updated (`railway.json`)
- [x] Environment variables verified (`RAILWAY_STAGING_ENV_VARS.txt`)
- [x] Database configuration correct (Airtable for staging)
- [x] Dependencies updated (`package.json`)

### ✅ Environment Validation
- [ ] Run environment validator: `npm run validate-environments`
- [ ] Verify no hardcoded URLs in components
- [ ] Check environment configuration files exist
- [ ] Validate environment detection logic

### ✅ Health Checks
- [ ] Run staging health check: `npm run health-check:staging`
- [ ] Verify backend connectivity: `https://novara-staging-staging.up.railway.app/api/health`
- [ ] Test frontend accessibility: `https://novara-mvp-git-staging-novara-fertility.vercel.app`
- [ ] Validate CORS configuration for staging frontend
- [ ] Check environment detection is working correctly

### ✅ Testing
- [x] Local staging environment test passed
- [x] Health endpoint responds correctly
- [x] Database connection verified
- [x] No syntax errors in code

## Deployment Process

### 1. Branch Management
- [x] Create feature branch: `fix/railway-staging-deployment`
- [x] Commit all changes with descriptive message
- [x] Push branch to remote repository
- [ ] Merge to staging branch (if using staging branch)
- [ ] Or deploy directly from feature branch

### 2. Railway Deployment
- [ ] Verify Railway project is connected to correct repository
- [ ] Ensure staging service is configured
- [ ] Trigger deployment from Railway dashboard
- [ ] Monitor build logs for errors
- [ ] Verify health check passes

### 3. Post-Deployment Verification
- [ ] Run comprehensive health check: `npm run health-check:staging`
- [ ] Test staging backend URL: `https://novara-staging-staging.up.railway.app`
- [ ] Verify health endpoint: `/api/health`
- [ ] Test authentication endpoints
- [ ] Check CORS with frontend
- [ ] Verify database connectivity
- [ ] Test frontend-backend communication
- [ ] Validate environment detection in health response

## Environment Variables (Staging)

```bash
AIRTABLE_API_KEY="patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7"
AIRTABLE_BASE_ID="appEOWvLjCn5c7Ght"
JWT_SECRET="staging_super_secret_jwt_key_different_from_prod"
NODE_ENV="staging"
USE_LOCAL_DATABASE="false"
DATABASE_TYPE="airtable"
CORS_ORIGIN="https://novara-mvp-staging.vercel.app"
LOG_LEVEL="debug"
ENABLE_DEBUG_LOGGING="true"
ENABLE_REQUEST_LOGGING="true"
# PORT is automatically set by Railway
```

## Rollback Plan

If deployment fails:
1. **Immediate**: Check Railway logs for specific errors
2. **Quick Fix**: Update environment variables if needed
3. **Code Fix**: Revert problematic changes and redeploy
4. **Emergency**: Use previous working deployment

## Success Criteria

- [ ] Environment validator passes: `npm run validate-environments`
- [ ] Staging health check passes: `npm run health-check:staging`
- [ ] Staging backend URL responds with 200 OK
- [ ] Health endpoint returns `{"status":"ok","environment":"staging"}`
- [ ] Database operations work correctly
- [ ] Frontend can connect to staging API
- [ ] No critical errors in logs
- [ ] All environment configurations validated

## Monitoring

- [ ] Set up Railway monitoring alerts
- [ ] Monitor response times
- [ ] Check error rates
- [ ] Verify database performance
- [ ] Test user flows

## Documentation

- [x] Update deployment troubleshooting guide
- [x] Create deployment script
- [x] Document environment variables
- [ ] Update API documentation if needed
- [ ] Record any new deployment procedures 