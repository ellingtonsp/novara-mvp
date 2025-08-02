# Production Incident Report: Route Ordering Bug

## Incident Summary
- **Date**: August 2, 2025
- **Severity**: High (User-blocking)
- **Duration**: ~30 minutes
- **Impact**: Check-in updates failed with 501 Not Implemented errors
- **Root Cause**: Express route ordering - parameterized routes defined before specific routes

## Timeline

### Initial Deployment
- Deployed refactored server with missing endpoints to production
- Frontend was calling `PUT /api/checkins/:checkinId` which didn't exist in legacy server
- Immediate 404 errors on check-in updates

### First Fix Attempt
- Implemented all missing endpoints including PUT /api/checkins/:checkinId
- Deployed to production
- New error: "Too many requests" (429)

### Second Fix Attempt  
- Discovered rate limits were 5x stricter in refactored server (100 vs 500)
- Updated rate limits to match legacy server
- Deployed fix
- New error: 501 Not Implemented on PUT requests

### Root Cause Discovery
- User provided console error showing 501 on staging
- Investigated route definitions in `/backend/routes/checkins.js`
- Found critical bug: parameterized route `/:checkinId` was defined BEFORE specific routes `/last-values` and `/questions`
- Express was matching ALL requests to the parameterized route first

### Final Fix
- Reordered routes to put specific routes before parameterized routes
- Deployed hotfix directly to main
- User confirmed: "Working!"

## Technical Details

### The Bug
```javascript
// WRONG ORDER - Caused 501 errors
router.get('/:checkinId', authenticateToken, asyncHandler(async (req, res) => {
  // This caught ALL requests including /last-values and /questions
}));

router.get('/last-values', authenticateToken, asyncHandler(async (req, res) => {
  // Never reached!
}));

router.get('/questions', authenticateToken, asyncHandler(async (req, res) => {
  // Never reached!
}));
```

### The Fix
```javascript
// CORRECT ORDER - Specific routes first
router.get('/last-values', authenticateToken, asyncHandler(async (req, res) => {
  // Now properly handled
}));

router.get('/questions', authenticateToken, asyncHandler(async (req, res) => {
  // Now properly handled
}));

router.get('/:checkinId', authenticateToken, asyncHandler(async (req, res) => {
  // Only catches actual checkin IDs
}));
```

## Lessons Learned

1. **Express Route Order Matters**: Always define specific routes before parameterized routes
2. **Test Route Conflicts**: When adding new routes, verify they're not caught by existing patterns
3. **Rate Limit Parity**: Ensure rate limits match between legacy and new systems
4. **User Feedback is Critical**: The 501 error log from the user immediately pointed to the issue

## Prevention Measures

1. Added route ordering documentation to CLAUDE.md
2. Created troubleshooting guide for common Express issues
3. Added route ordering checks to pre-deployment scripts
4. Emphasized importance of testing all endpoints before deployment

## Files Modified
- `/backend/routes/checkins.js` - Reordered routes
- `/backend/config/index.js` - Updated rate limits
- `/CLAUDE.md` - Added troubleshooting documentation
- `/docs/incidents/2025-08-02-route-ordering-incident.md` - This report

## Post-Incident Actions
- ✅ Fixed route ordering bug
- ✅ Updated rate limits to match legacy
- ✅ Backported fixes to develop branch
- ✅ Added comprehensive documentation
- ✅ User confirmed fix is working
- ⏳ Monitor production for 24 hours