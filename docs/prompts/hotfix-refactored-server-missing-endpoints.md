# Hotfix: Add Missing Endpoints to Refactored Server

## Current Situation Summary
Production is currently running the legacy `server.js` which lacks critical functionality (notably the PUT /api/checkins/:checkinId endpoint). While this endpoint exists in our refactored server, we cannot switch production to use the refactored server because it's missing other critical endpoints that production depends on.

## Git Status
- **Current Branch**: `hotfix/refactored-server-missing-endpoints`
- **Created from**: `main` branch
- **Purpose**: Add all missing endpoints to the refactored server to enable safe production switch

## Problem Statement
The refactored server (`backend/server-refactored.js`) is missing several endpoints that exist in the legacy server (`backend/server.js`). We need to port these endpoints to the refactored server before switching production.

## Missing Endpoints (Prioritized)

### 🔴 HIGH PRIORITY - Production Critical
These endpoints are actively used in production and must be implemented first:

1. **GET /api/checkins/last-values**
   - Returns the most recent check-in values for a user
   - Used by frontend to pre-populate forms

2. **GET /api/checkins/questions**
   - Returns the list of check-in questions
   - Critical for rendering the check-in form

3. **POST /api/daily-checkin-enhanced**
   - Enhanced version of daily check-in submission
   - Handles more complex check-in data

4. **GET /api/users/profile**
   - Returns user profile information
   - Used throughout the app

5. **PATCH /api/users/cycle-stage**
   - Updates user's menstrual cycle stage
   - Used in profile settings

6. **PATCH /api/users/medication-status**
   - Updates user's medication status
   - Used in profile settings

### 🟡 MEDIUM PRIORITY - Important Features
These should be implemented after high priority endpoints:

1. **GET /api/v2/health/timeline**
   - Returns health data timeline
   - Used in analytics views

2. **GET /api/v2/analytics**
   - Returns analytics data
   - Used in dashboard

### 🟢 LOW PRIORITY - Nice to Have
Can be implemented last or in a follow-up:

1. **GET /api/checkins-test**
   - Test endpoint for development

2. **POST /api/analytics/events**
   - Analytics event tracking

## Implementation Approach

### For Each Endpoint:
1. **Locate in Legacy Server**: Find the endpoint implementation in `backend/server.js`
2. **Port to Refactored Server**: 
   - Copy the route handler to `backend/server-refactored.js`
   - Ensure it uses the refactored patterns (proper error handling, database queries)
   - Maintain the exact same API contract (request/response format)
3. **Test Locally**:
   - Start the refactored server on port 9002
   - Test each endpoint with the same requests that work in production
   - Verify response format matches exactly

### Code Structure in Refactored Server:
```javascript
// Add endpoints in the appropriate section of server-refactored.js
// Group by resource type (checkins, users, analytics, etc.)

// Example structure:
// Checkins endpoints
app.get('/api/checkins/last-values', authenticateToken, async (req, res) => {
  // Implementation here
});

// Users endpoints
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  // Implementation here
});
```

## Testing Requirements

### Local Testing (Port 9002):
1. Start refactored server: `npm run dev:refactored`
2. Test each endpoint with curl or Postman
3. Verify response format matches production exactly
4. Test error cases (missing auth, invalid data)

### Staging Testing:
1. Deploy hotfix branch to staging
2. Run full E2E test suite
3. Manual testing of critical flows
4. Verify all endpoints respond correctly

## Deployment Plan

### Phase 1: Implementation
1. Add all HIGH PRIORITY endpoints first
2. Test each endpoint locally
3. Commit with descriptive messages

### Phase 2: Staging Deployment
1. Push hotfix branch to GitHub
2. Deploy to staging environment
3. Run comprehensive tests
4. Fix any issues found

### Phase 3: Production Switch
1. Once all endpoints verified on staging
2. Create PR from hotfix branch to main
3. Deploy to production
4. Update Railway to use refactored server:
   ```bash
   # In Railway dashboard or via CLI
   # Update start command from:
   node backend/server.js
   # To:
   node backend/server-refactored.js
   ```

### Phase 4: Verification
1. Monitor production logs
2. Test critical user flows
3. Be ready to rollback if issues

## Rollback Plan
If issues occur after switching:
1. Immediately revert Railway start command to `node backend/server.js`
2. Investigate issues in staging
3. Fix and redeploy

## Success Criteria
- All missing endpoints implemented in refactored server
- All endpoints return exact same response format as legacy
- E2E tests pass on staging
- Production successfully switched to refactored server
- No user-facing disruptions

## Next Steps
1. Start implementing HIGH PRIORITY endpoints
2. Test each one thoroughly
3. Commit frequently with clear messages
4. Keep track of progress in this document

---

## Implementation Progress Tracker

### High Priority Endpoints
- [x] GET /api/checkins/last-values ✅
- [x] GET /api/checkins/questions ✅
- [x] POST /api/daily-checkin-enhanced ✅
- [x] GET /api/users/profile ✅
- [x] PATCH /api/users/cycle-stage ✅
- [x] PATCH /api/users/medication-status ✅

### Medium Priority Endpoints
- [ ] GET /api/v2/health/timeline
- [ ] GET /api/v2/analytics

### Low Priority Endpoints
- [ ] GET /api/checkins-test
- [ ] POST /api/analytics/events

## Current Status (as of 2025-08-01)

### ✅ Completed
1. All high-priority endpoints implemented in refactored server
2. Comprehensive test suites created (21 tests passing)
3. Local testing completed successfully
4. PR created: https://github.com/ellingtonsp/novara-mvp/pull/24

### 🚀 Next Steps
1. Deploy PR #24 to staging
2. Run E2E tests on staging
3. If tests pass, merge to main
4. Update Railway production to use refactored server
5. Monitor production for any issues

---

## Command Reference

```bash
# Start refactored server locally
npm run dev:refactored

# Test endpoints
curl http://localhost:9002/api/checkins/last-values -H "Authorization: Bearer YOUR_TOKEN"

# Deploy to staging
git push origin hotfix/refactored-server-missing-endpoints

# Create PR when ready
gh pr create --base main --title "Hotfix: Add missing endpoints to refactored server"
```