# 🚨 URGENT: Production Check-in Update Fix

## Problem
Frontend is calling `PUT /api/checkins/:checkinId` but production legacy server doesn't have this endpoint.

## Immediate Fix - Switch to Refactored Server

### In Railway Production Dashboard:

1. Go to your Railway backend service
2. Navigate to Settings → Deploy
3. Change the start command:

**FROM:**
```
cd backend && NODE_ENV=production node server.js
```

**TO:**
```
cd backend && NODE_ENV=production node server-refactored.js
```

**OR** add environment variable:
```
USE_REFACTORED_SERVER=true
```

### This will fix:
- ✅ Check-in updates (PUT /api/checkins/:checkinId)
- ✅ Enhanced check-ins (POST /api/daily-checkin-enhanced)
- ✅ All other missing endpoints we added

### Alternative (If Not Ready for Full Switch)
Add the missing PUT endpoint to legacy server.js - but this requires another code change and deployment.

## Verification After Switch
```bash
# Test update endpoint exists
curl -X PUT https://novara-mvp-production.up.railway.app/api/checkins/test-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return error about checkin not found (not 404 for endpoint)
```