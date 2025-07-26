# 🔍 Checkin Submitted Event Debugging Guide

## **🚨 ISSUE IDENTIFIED**

The `checkin_submitted` event is **not appearing in PostHog** despite the backend successfully receiving check-ins. This guide will help identify the root cause.

---

## **📊 CURRENT STATUS**

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend Check-in API** | ✅ **WORKING** | Successfully receives and saves check-ins |
| **Frontend Event Tracking** | ❌ **NOT WORKING** | `checkin_submitted` events not reaching PostHog |
| **PostHog Initialization** | ⏳ **NEEDS VERIFICATION** | May not be properly initialized |
| **User Authentication** | ⏳ **NEEDS VERIFICATION** | User object may not be available |

---

## **🎯 DEBUGGING STEPS**

### **Step 1: Test Environment Setup**

**URL**: https://novara-mrfhkw993-novara-fertility.vercel.app

**Browser Setup**:
1. Open browser dev tools (F12)
2. Go to **Console** tab
3. Go to **Network** tab → Filter by "posthog"
4. Clear console: `console.clear()`

### **Step 2: Verify PostHog Initialization**

**Check in Console**:
```javascript
// Check if PostHog is loaded
console.log('PostHog available:', !!window.posthog);

// Check PostHog functions
console.log('PostHog capture:', typeof window.posthog?.capture);
console.log('PostHog identify:', typeof window.posthog?.identify);

// Check current user
console.log('Current user ID:', window.posthog?.get_distinct_id());
```

**Expected Results**:
- ✅ `PostHog available: true`
- ✅ `PostHog capture: function`
- ✅ `PostHog identify: function`
- ✅ `Current user ID: [some-id]`

### **Step 3: Complete Check-in Flow**

**Test Steps**:
1. **Sign up** with a new email
2. **Complete check-in form**:
   - Select at least one mood
   - Fill in confidence slider
   - Submit form
3. **Watch console** for debug messages

**Expected Console Output**:
```
🎯 AN-01 DEBUG: About to track checkin_submitted event
🎯 AN-01 DEBUG: user object: {id: "...", email: "..."}
🎯 AN-01 DEBUG: user.id: rec...
🎯 AN-01 DEBUG: checkinStartTime: 1753456789123
🎯 AN-01 DEBUG: current time: 1753456790123
🎯 AN-01 DEBUG: time calculation: 1000
🎯 AN-01 DEBUG: PostHog available: true
🎯 AN-01 DEBUG: PostHog capture available: true
🎯 AN-01 DEBUG: trackCheckinSubmitted payload: {user_id: "...", mood_score: 7, symptom_flags: [...], time_to_complete_ms: 1000}
🎯 AN-01 DEBUG: Testing direct PostHog capture...
🎯 AN-01 DEBUG: Direct PostHog capture successful
🎯 AN-01 DEBUG: track() called with event: checkin_submitted
```

### **Step 4: Check Network Tab**

**Look for**:
1. **PostHog requests** to `https://us.i.posthog.com/capture/`
2. **Request payload** containing `checkin_submitted` event
3. **Response status** (should be 200)

**Expected Network Request**:
```json
{
  "event": "checkin_submitted",
  "properties": {
    "user_id": "rec...",
    "mood_score": 7,
    "symptom_flags": ["hopeful", "optimistic"],
    "time_to_complete_ms": 1000,
    "environment": "preview",
    "timestamp": "2025-07-25T15:02:00.000Z"
  }
}
```

---

## **🔍 POTENTIAL ISSUES & SOLUTIONS**

### **Issue 1: PostHog Not Initialized**

**Symptoms**:
- `PostHog available: false`
- No PostHog requests in Network tab

**Solutions**:
1. Check if `VITE_POSTHOG_API_KEY` is set in environment
2. Verify PostHog library is loaded
3. Check for initialization errors in console

### **Issue 2: User Object Not Available**

**Symptoms**:
- `user.id: undefined`
- `Cannot track checkin_submitted - user.id not available`

**Solutions**:
1. Check if user is properly authenticated
2. Verify AuthContext is working
3. Check if token is valid

### **Issue 3: Timing Calculation Error**

**Symptoms**:
- `time_to_complete_ms: NaN` or negative values
- `checkinStartTime: undefined`

**Solutions**:
1. Check if timing is properly set at form start
2. Verify timing calculation logic

### **Issue 4: Environment Configuration**

**Symptoms**:
- Events not sent due to environment checks
- Wrong API key or configuration

**Solutions**:
1. Check environment detection
2. Verify PostHog configuration
3. Check API key permissions

---

## **🧪 MANUAL TESTING**

### **Test 1: Direct PostHog Call**

**In Console**:
```javascript
// Test direct PostHog event
window.posthog?.capture('manual_test_event', {
  user_id: 'test_user_123',
  test_property: 'test_value',
  timestamp: new Date().toISOString()
});

// Check if it appears in Network tab
```

### **Test 2: Check Environment Variables**

**In Console**:
```javascript
// Check environment configuration
console.log('Environment:', import.meta.env.VITE_VERCEL_ENV);
console.log('API Key available:', !!import.meta.env.VITE_POSTHOG_API_KEY);
console.log('API Key length:', import.meta.env.VITE_POSTHOG_API_KEY?.length);
```

### **Test 3: Verify User Authentication**

**In Console**:
```javascript
// Check authentication state
console.log('Token available:', !!localStorage.getItem('token'));
console.log('User from context:', window.__NOVARA_USER__); // If available
```

---

## **📋 DEBUGGING CHECKLIST**

### **Pre-Test Checks**
- [ ] Browser dev tools open
- [ ] Console cleared
- [ ] Network tab filtered for "posthog"
- [ ] Fresh browser session (no cached data)

### **PostHog Initialization**
- [ ] PostHog library loaded
- [ ] API key available
- [ ] PostHog initialized successfully
- [ ] User identified in PostHog

### **Event Tracking**
- [ ] User object available
- [ ] Timing calculation working
- [ ] Event payload correct
- [ ] PostHog capture function available
- [ ] Network request sent
- [ ] Response successful

### **Data Validation**
- [ ] Event name: `checkin_submitted`
- [ ] Required properties present
- [ ] Data types correct
- [ ] No PII in payload

---

## **🚀 NEXT STEPS**

### **If Debugging Reveals Issues**:

1. **PostHog Initialization Problem**:
   - Check environment variables
   - Verify PostHog library loading
   - Fix initialization timing

2. **User Authentication Problem**:
   - Check AuthContext implementation
   - Verify token handling
   - Fix user object availability

3. **Data Format Problem**:
   - Fix payload structure
   - Correct data types
   - Validate against AN-01 spec

4. **Environment Configuration Problem**:
   - Check environment detection
   - Verify PostHog configuration
   - Fix API key setup

### **If Everything Works**:

1. **Remove debug logging**
2. **Deploy to production**
3. **Monitor PostHog dashboard**
4. **Verify all 4 AN-01 events working**

---

## **📞 SUPPORT**

**If issues persist**:
1. **Screenshot console output**
2. **Screenshot network requests**
3. **Note environment (staging/production)**
4. **Include browser/OS details**

**Debugging URL**: https://novara-mrfhkw993-novara-fertility.vercel.app 