# AN-01 PostHog Integration - Local Testing Guide

## 🎯 **Test Objective**
Validate that PostHog event tracking works correctly in local development environment for AN-01 implementation.

## 🔧 **Pre-Test Setup**

### **Environment Configuration**
- ✅ Local frontend running on http://localhost:4200
- ✅ Local backend running on http://localhost:9002
- ✅ PostHog API key configured in `.env.local`
- ✅ PostHog enabled for development mode

### **Expected Console Outputs**
```javascript
// PostHog Initialization
"PostHog enabled in development mode for testing"
"PostHog initialized successfully"

// Event Tracking
"📊 PostHog Event: signup" {
  user_id: "rec...",
  signup_method: "email",
  environment: "development",
  timestamp: "2025-07-25T..."
}

"👤 PostHog Identify: rec..." {
  email: "test@example.com",
  nickname: "Test User",
  signup_date: "2025-07-25T..."
}
```

## 🧪 **Test Scenarios**

### **Test 1: User Signup Event**
1. **Navigate to**: http://localhost:4200
2. **Fill out signup form**:
   - Email: `test-posthog@example.com`
   - Nickname: `PostHog Test`
   - Confidence scores: 5/5/5
3. **Submit form**
4. **Expected Results**:
   - ✅ Signup successful
   - ✅ PostHog `signup` event fired
   - ✅ User identified in PostHog
   - ✅ No authentication errors

### **Test 2: Check-in Submission Event**
1. **Complete signup** (from Test 1)
2. **Navigate to check-in form**
3. **Fill out check-in**:
   - Mood: "Hopeful"
   - Primary concern: "Medical clarity"
   - Confidence: 7
   - Note: "Testing PostHog integration"
4. **Submit check-in**
5. **Expected Results**:
   - ✅ Check-in successful
   - ✅ PostHog `checkin_submitted` event fired
   - ✅ Event includes mood_score, symptom_flags, time_to_complete_ms

### **Test 3: Insight Viewed Event**
1. **Complete check-in** (from Test 2)
2. **Wait for insight to load**
3. **Scroll to view insight card**
4. **Expected Results**:
   - ✅ PostHog `insight_viewed` event fired when 50% visible
   - ✅ Event includes insight_id, insight_type

### **Test 4: Error Handling**
1. **Test with invalid email format**
2. **Test with missing required fields**
3. **Expected Results**:
   - ✅ No PostHog events fired for failed attempts
   - ✅ Proper error messages displayed

## 📊 **PostHog Dashboard Validation**

### **Check Events in PostHog**
1. **Open PostHog Dashboard**: https://app.posthog.com
2. **Navigate to Events**
3. **Filter by environment**: "development"
4. **Expected Events**:
   - `signup` events with user_id, signup_method
   - `checkin_submitted` events with mood_score, symptom_flags
   - `insight_viewed` events with insight_id, insight_type

### **Check User Properties**
1. **Navigate to Persons**
2. **Find test user by email**
3. **Verify user properties**:
   - email: test-posthog@example.com
   - nickname: PostHog Test
   - signup_date: [timestamp]

## 🔍 **Debugging Checklist**

### **If PostHog Events Don't Appear**
- [ ] Check browser console for PostHog initialization logs
- [ ] Verify VITE_POSTHOG_API_KEY in .env.local
- [ ] Check network tab for PostHog API calls
- [ ] Verify environment is detected as "development"

### **If Authentication Fails**
- [ ] Check backend is running on port 9002
- [ ] Verify API requests to localhost:9002
- [ ] Check backend logs for errors
- [ ] Verify CORS configuration

### **If Events Appear in Console but not PostHog**
- [ ] Check PostHog API key is valid
- [ ] Verify PostHog project settings
- [ ] Check for network connectivity issues
- [ ] Verify event payload format

## ✅ **Success Criteria**

### **All Tests Pass When**:
- [ ] PostHog initializes without errors
- [ ] All 3 event types fire correctly
- [ ] Events appear in PostHog dashboard
- [ ] User identification works
- [ ] No authentication errors
- [ ] No rate limiting issues

### **Performance Requirements**:
- [ ] Events fire within 1 second of user action
- [ ] No impact on app performance
- [ ] No console errors related to PostHog

## 🚀 **Next Steps After Local Testing**

1. **Deploy to staging** (after rate limits reset)
2. **Test on staging environment**
3. **Validate production deployment**
4. **Monitor PostHog dashboard for real user data**

---

**Test Date**: 2025-07-25  
**Environment**: Local Development  
**PostHog API Key**: phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt 