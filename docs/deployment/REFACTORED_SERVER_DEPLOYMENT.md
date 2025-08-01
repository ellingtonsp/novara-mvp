# Refactored Server Deployment Guide

## Overview
This guide covers the deployment process for switching from the legacy server to the refactored server in production.

## Current Status (2025-08-01)
- ✅ All critical endpoints implemented in refactored server
- ✅ Comprehensive tests added (21 tests passing)
- ✅ PR #24 created and ready for deployment
- ⏳ Awaiting staging deployment

## Pre-Deployment Checklist

### 1. Code Review
- [ ] Review PR #24: https://github.com/ellingtonsp/novara-mvp/pull/24
- [ ] Verify all endpoints match legacy server API contracts
- [ ] Check test coverage

### 2. Staging Deployment
- [ ] Merge PR to main branch
- [ ] Verify Railway staging auto-deploys
- [ ] Check Railway staging logs for startup errors

### 3. Staging Testing
```bash
# Run endpoint tests
node scripts/test-staging-endpoints.js

# Manual testing checklist:
- [ ] Login flow works
- [ ] Check-in submission works
- [ ] Last values load correctly
- [ ] Questions generate properly
- [ ] Profile updates work
- [ ] Cycle stage updates work
- [ ] Medication status updates work
```

### 4. Production Deployment

#### Step 1: Update Railway Environment
In Railway dashboard for production:
1. Navigate to backend service settings
2. Update the start command from:
   ```
   node backend/server.js
   ```
   To:
   ```
   node backend/server-refactored.js
   ```
   Or set environment variable:
   ```
   USE_REFACTORED_SERVER=true
   ```

#### Step 2: Monitor Deployment
- Watch Railway deployment logs
- Check for successful startup message
- Verify no error logs

#### Step 3: Smoke Tests
```bash
# Test production endpoints (carefully!)
curl https://api.novara.app/api/health

# Check specific endpoints with auth
# Use production JWT token
```

## Rollback Plan

If issues occur after switching:

### Immediate Rollback (< 5 minutes)
1. In Railway dashboard, revert start command to:
   ```
   node backend/server.js
   ```
2. Or remove/set to false:
   ```
   USE_REFACTORED_SERVER=false
   ```
3. Railway will auto-redeploy with legacy server

### Investigation Steps
1. Check Railway logs for errors
2. Review Sentry for any new exceptions
3. Check user reports/support tickets
4. Run regression tests

## Post-Deployment Verification

### Health Checks
- [ ] API health endpoint responds
- [ ] Frontend can connect to API
- [ ] No 500 errors in logs
- [ ] Response times normal

### Functional Tests
- [ ] User can log in
- [ ] User can submit check-in
- [ ] User can view profile
- [ ] Check-in questions load
- [ ] Last values populate

### Monitoring (First 24 Hours)
- [ ] Check error rates in Sentry
- [ ] Monitor Railway metrics
- [ ] Watch for user complaints
- [ ] Run hourly smoke tests

## Missing Endpoints (Lower Priority)

These endpoints exist in legacy but not refactored (not critical):
- GET /api/v2/health/timeline
- GET /api/v2/analytics
- GET /api/checkins-test
- POST /api/analytics/events

These can be added in a follow-up PR after production is stable.

## Success Criteria

The deployment is considered successful when:
1. All production endpoints respond correctly
2. No increase in error rates
3. User flows work end-to-end
4. Performance metrics remain stable
5. 24 hours pass without critical issues

## Contact for Issues

If problems arise:
1. Check #engineering Slack channel
2. Review Railway logs
3. Check Sentry alerts
4. Rollback if necessary

---

## Deployment Log

| Date | Action | Status | Notes |
|------|--------|--------|-------|
| 2025-08-01 | PR #24 created | ✅ | All endpoints implemented |
| TBD | Staging deployment | ⏳ | Awaiting |
| TBD | Staging tests | ⏳ | Awaiting |
| TBD | Production switch | ⏳ | Awaiting |