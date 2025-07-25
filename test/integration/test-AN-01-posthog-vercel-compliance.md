# AN-01 PostHog Vercel Compliance Testing Script

## 🎯 **Testing Objective**
Validate that PostHog implementation follows [Vercel-specific best practices](https://posthog.com/docs/libraries/vercel) for reliable event tracking in serverless environments.

## ✅ **Compliance Checklist**

### **Frontend Compliance**
- [ ] Using `posthog-js` for web client tracking
- [ ] Proper Vercel environment detection
- [ ] `batch_size: 1` for immediate event sending
- [ ] `request_timeout: 10000` for reliability
- [ ] Vercel-specific metadata in events

### **Backend Compliance**
- [ ] `posthog-node` library installed and configured
- [ ] `captureImmediate()` used for server-side events
- [ ] `flushAt: 1, flushInterval: 0` configuration
- [ ] Proper `shutdown()` patterns with middleware
- [ ] Server-side tracking for signup and insights

---

## 🧪 **Test Scenarios**

### **Test 1: Frontend Event Tracking**

#### **Setup**
1. Start local development: `./scripts/start-dev-stable.sh`
2. Open browser to `http://localhost:4200`
3. Open browser dev tools (Network + Console tabs)

#### **Test Steps**
1. **User Signup**
   - [ ] Fill out signup form
   - [ ] Submit form
   - [ ] Check browser console for:
     ```
     📊 PostHog Event: signup {...}
     ```
   - [ ] Verify Network tab shows PostHog request to `us.i.posthog.com`

2. **Daily Check-in Submission**
   - [ ] Navigate to daily check-in
   - [ ] Fill out form
   - [ ] Submit check-in
   - [ ] Check console for:
     ```
     📊 PostHog Event: checkin_submitted {...}
     ```

3. **Insight Viewing**
   - [ ] Navigate to insights page
   - [ ] Wait for insight to load
   - [ ] Check console for:
     ```
     📊 PostHog Event: insight_viewed {...}
     ```

#### **Expected Results**
- ✅ All events appear in browser console
- ✅ Network requests show successful POST to PostHog
- ✅ Events include Vercel-specific metadata:
  ```json
  {
    "vercel_environment": "preview|development",
    "deployment_type": "vercel",
    "batch_size": 1
  }
  ```

---

### **Test 2: Server-Side Event Tracking**

#### **Setup**
1. Ensure backend is running: `cd backend && npm run dev`
2. Check backend logs for PostHog initialization

#### **Test Steps**
1. **Server-Side Signup Tracking**
   - [ ] Make POST request to `/api/users` with user data
   - [ ] Check backend logs for:
     ```
     ✅ PostHog server-side client initialized
     📊 PostHog Server Event: signup for user: [user_id]
     ```

2. **Server-Side Insight Generation**
   - [ ] Make GET request to `/api/insights/daily`
   - [ ] Check backend logs for:
     ```
     📊 PostHog Server Event: insight_generated for user: [user_id]
     🔄 PostHog server client shutdown completed
     ```

#### **Expected Results**
- ✅ Server logs show PostHog client initialization
- ✅ Server events tracked with `captureImmediate()`
- ✅ Proper shutdown after each request
- ✅ No hanging connections or memory leaks

---

### **Test 3: Vercel Deployment Compliance**

#### **Setup**
1. Deploy to Vercel staging: `cd frontend && vercel --target staging`
2. Access staging URL: `https://novara-bd6xsx1ru-novara-fertility.vercel.app`

#### **Test Steps**
1. **Vercel Environment Detection**
   - [ ] Open browser dev tools
   - [ ] Perform any tracked action (signup, check-in)
   - [ ] Verify event payload includes:
     ```json
     {
       "vercel_environment": "preview",
       "vercel_url": "[staging-url]",
       "vercel_branch_url": "[branch-url]",
       "deployment_type": "vercel"
     }
     ```

2. **Event Reliability**
   - [ ] Perform multiple events rapidly
   - [ ] Check PostHog dashboard for all events
   - [ ] Verify no event loss in serverless environment

#### **Expected Results**
- ✅ Vercel environment properly detected
- ✅ All events include Vercel metadata
- ✅ No event loss in serverless environment
- ✅ Events appear in PostHog dashboard within 30 seconds

---

### **Test 4: PostHog Dashboard Verification**

#### **Setup**
1. Access PostHog dashboard: [PostHog Project](https://app.posthog.com)
2. Navigate to Events explorer

#### **Test Steps**
1. **Event Presence**
   - [ ] Filter events by last 1 hour
   - [ ] Verify presence of:
     - `signup` events from server-side
     - `checkin_submitted` events from frontend
     - `insight_viewed` events from frontend
     - `insight_generated` events from server-side

2. **Event Properties**
   - [ ] Check event properties include:
     - `server_side: true` for server events
     - `platform: "server"` for server events
     - `deployment_type: "vercel"` for frontend events
     - `deployment_type: "railway"` for server events

#### **Expected Results**
- ✅ All AN-01 events present in dashboard
- ✅ Server and client events properly differentiated
- ✅ Environment-specific metadata attached
- ✅ Events appear within 30-second target

---

## 🔍 **Configuration Verification**

### **Frontend Configuration Check**
```typescript
// Expected in frontend/src/lib/analytics.ts
const config = {
  batch_size: 1,              // ✅ Immediate sending
  request_timeout: 10000,     // ✅ 10 second timeout
  xhr_headers: {              // ✅ Vercel headers
    'X-Vercel-Environment': 'preview'
  }
}
```

### **Backend Configuration Check**
```javascript
// Expected in backend/utils/posthog-server.js
const posthog = new PostHog(apiKey, {
  flushAt: 1,        // ✅ Immediate flush
  flushInterval: 0,  // ✅ No interval batching
  host: 'https://us.i.posthog.com' // ✅ US region
});
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Frontend Events Not Appearing**
- Check `VITE_POSTHOG_API_KEY` environment variable
- Verify network connectivity to `us.i.posthog.com`
- Check browser console for PostHog errors

#### **Server Events Not Tracking**
- Verify `POSTHOG_API_KEY` in Railway environment
- Check backend logs for PostHog initialization
- Ensure `posthog-node` dependency installed

#### **Vercel Environment Not Detected**
- Check Vercel environment variables:
  - `VITE_VERCEL_ENV`
  - `VITE_VERCEL_URL` 
  - `VITE_VERCEL_BRANCH_URL`

#### **Event Loss in Production**
- Verify `captureImmediate()` used for server events
- Check `batch_size: 1` for frontend events
- Monitor PostHog dashboard for dropped events

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ All 4 AN-01 events tracking successfully
- ✅ Server-side events use `captureImmediate()`
- ✅ Frontend events use immediate batching
- ✅ Proper environment detection

### **Performance Requirements**
- ✅ Events appear in PostHog within 30 seconds
- ✅ No impact on user experience (<200ms overhead)
- ✅ Reliable tracking in serverless environment

### **Compliance Requirements**
- ✅ Follows [PostHog Vercel documentation](https://posthog.com/docs/libraries/vercel)
- ✅ Proper shutdown patterns implemented
- ✅ Environment-specific configuration
- ✅ No memory leaks or hanging connections

---

## 🎯 **Post-Testing Actions**

### **If All Tests Pass**
1. ✅ Mark PostHog Vercel compliance as **COMPLETED**
2. ✅ Update documentation with compliance confirmation
3. ✅ Deploy to production with confidence

### **If Tests Fail**
1. ❌ Review failed test scenarios
2. ❌ Check configuration against Vercel documentation
3. ❌ Fix issues and re-run tests
4. ❌ Do not deploy until compliance achieved

---

**Test Completed By:** _________________  
**Date:** _________________  
**Result:** ✅ PASS / ❌ FAIL  
**Notes:** _______________________________ 