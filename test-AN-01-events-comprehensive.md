# 🧪 AN-01 Event Tracking Comprehensive Test

## **Test Environment**
- **Frontend**: https://novara-ombodf3wp-novara-fertility.vercel.app
- **Backend**: https://novara-staging-staging.up.railway.app
- **PostHog Dashboard**: Check for events in real-time

---

## **📋 Pre-Test Setup**

### **1. Open Browser Developer Tools**
```bash
# Open staging frontend
https://novara-ombodf3wp-novara-fertility.vercel.app

# Open Developer Tools (F12)
# Go to Console tab
# Go to Network tab (filter by "posthog")
```

### **2. Clear Browser Data**
- Clear localStorage: `localStorage.clear()`
- Clear sessionStorage: `sessionStorage.clear()`
- Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

## **🎯 Test 1: Signup Event (`signup`)**

### **Expected Event Schema**
```json
{
  "event": "signup",
  "properties": {
    "user_id": "rec[timestamp]",
    "signup_method": "email",
    "referrer": "https://novara-ombodf3wp-novara-fertility.vercel.app",
    "experiment_variants": null
  }
}
```

### **Test Steps**
1. **Complete onboarding flow** with a new email address
2. **Fill out all required fields**:
   - Email: `test-an01-${Date.now()}@example.com`
   - Nickname: `AN01Test`
   - Confidence levels: All set to 7
   - Primary need: `medical_clarity`
   - Cycle stage: `ivf_prep`
3. **Click "Get Started"**
4. **Verify in PostHog**: Look for `signup` event with correct payload

### **Success Criteria**
- ✅ `signup` event appears in PostHog within 30 seconds
- ✅ Event has correct `user_id` format
- ✅ `signup_method` is "email"
- ✅ `referrer` is the staging URL

---

## **🎯 Test 2: Check-in Submitted Event (`checkin_submitted`)**

### **Expected Event Schema**
```json
{
  "event": "checkin_submitted",
  "properties": {
    "user_id": "rec[timestamp]",
    "mood_score": 7,
    "symptom_flags": ["hopeful", "optimistic"],
    "cycle_day": null,
    "time_to_complete_ms": 15000
  }
}
```

### **Test Steps**
1. **Navigate to check-in form** (should appear after signup)
2. **Select moods**: Choose "hopeful" and "optimistic"
3. **Fill confidence slider**: Set to 7
4. **Complete any additional questions** (if personalized questions appear)
5. **Click "Complete Enhanced Check-in"**
6. **Verify in PostHog**: Look for `checkin_submitted` event

### **Success Criteria**
- ✅ `checkin_submitted` event appears in PostHog within 30 seconds
- ✅ `mood_score` matches the confidence level selected
- ✅ `symptom_flags` contains the selected moods
- ✅ `time_to_complete_ms` is a positive number

---

## **🎯 Test 3: Insight Viewed Event (`insight_viewed`)**

### **Expected Event Schema**
```json
{
  "event": "insight_viewed",
  "properties": {
    "user_id": "rec[timestamp]",
    "insight_id": "insight_welcome_[timestamp]",
    "insight_type": "welcome",
    "dwell_ms": 0,
    "cta_clicked": false
  }
}
```

### **Test Steps**
1. **Complete check-in** (from Test 2)
2. **Wait for insight to appear** (should be automatic)
3. **Scroll to make insight 50% visible** (triggers IntersectionObserver)
4. **Verify in PostHog**: Look for `insight_viewed` event

### **Success Criteria**
- ✅ `insight_viewed` event appears in PostHog within 30 seconds
- ✅ `insight_id` follows the pattern `insight_[type]_[timestamp]`
- ✅ `insight_type` matches the actual insight type
- ✅ Event triggers when insight is 50% visible

---

## **🎯 Test 4: Share Action Event (`share_action`)**

### **Expected Event Schema**
```json
{
  "event": "share_action",
  "properties": {
    "user_id": "rec[timestamp]",
    "share_surface": "insight",
    "destination": "clipboard",
    "content_id": "insight_welcome"
  }
}
```

### **Test Steps**
1. **Ensure insight is visible** (from Test 3)
2. **Click the share button** (📤 icon) on the insight card
3. **Choose clipboard option** (if native share not available)
4. **Verify in PostHog**: Look for `share_action` event

### **Success Criteria**
- ✅ `share_action` event appears in PostHog within 30 seconds
- ✅ `share_surface` is "insight"
- ✅ `destination` is "clipboard" (or "native_share" on mobile)
- ✅ `content_id` matches the insight type

---

## **🔍 Debugging Commands**

### **Check PostHog Status in Console**
```javascript
// Check if PostHog is initialized
console.log('PostHog object:', window.posthog);

// Check PostHog config
console.log('PostHog config:', window.posthog?.config);

// Check if events are being sent
window.posthog?.capture('test_event', { test: true });
```

### **Check Network Requests**
```javascript
// Filter network tab for PostHog requests
// Look for requests to: https://app.posthog.com/capture/
```

### **Manual Event Testing**
```javascript
// Test each event manually
import { trackSignup, trackCheckinSubmitted, trackInsightViewed, trackShareAction } from './lib/analytics';

// Test signup
trackSignup({
  user_id: 'test_user_123',
  signup_method: 'email',
  referrer: window.location.href
});

// Test check-in
trackCheckinSubmitted({
  user_id: 'test_user_123',
  mood_score: 7,
  symptom_flags: ['hopeful', 'optimistic'],
  time_to_complete_ms: 5000
});

// Test insight viewed
trackInsightViewed({
  user_id: 'test_user_123',
  insight_id: 'test_insight_123',
  insight_type: 'welcome',
  dwell_ms: 0
});

// Test share action
trackShareAction({
  user_id: 'test_user_123',
  share_surface: 'insight',
  destination: 'clipboard',
  content_id: 'test_insight'
});
```

---

## **📊 Post-Test Verification**

### **1. PostHog Dashboard Check**
- Navigate to PostHog dashboard
- Check "Live Events" for real-time events
- Verify all 4 events appear with correct properties

### **2. Event Count Verification**
```javascript
// In PostHog dashboard, verify:
// - signup: 1 event
// - checkin_submitted: 1 event  
// - insight_viewed: 1 event
// - share_action: 1 event
```

### **3. User Journey Verification**
- All events should have the same `user_id`
- Events should appear in chronological order
- No duplicate events should exist

---

## **🚨 Troubleshooting**

### **If Events Don't Appear**
1. **Check PostHog API Key**: Verify `VITE_POSTHOG_API_KEY` is set in staging
2. **Check Console Errors**: Look for PostHog initialization errors
3. **Check Network Tab**: Verify requests to PostHog are successful
4. **Check Environment**: Ensure staging environment is detected correctly

### **If Events Have Wrong Properties**
1. **Check Event Payloads**: Verify the data being passed to tracking functions
2. **Check User Context**: Ensure user ID is available when events are fired
3. **Check Timing**: Ensure events fire after user authentication

### **If Events Are Duplicated**
1. **Check Component Re-renders**: Ensure tracking functions aren't called multiple times
2. **Check useEffect Dependencies**: Verify tracking effects have correct dependencies
3. **Check Event Guards**: Ensure events only fire once per action

---

## **✅ Success Checklist**

- [ ] **Signup Event**: Fires with correct payload when user completes onboarding
- [ ] **Check-in Event**: Fires with mood score and symptom flags when check-in submitted
- [ ] **Insight Viewed Event**: Fires when insight becomes 50% visible
- [ ] **Share Action Event**: Fires when user clicks share button
- [ ] **All Events**: Appear in PostHog within 30 seconds
- [ ] **User Journey**: All events have same user_id and appear in correct order
- [ ] **No Duplicates**: Each action triggers exactly one event
- [ ] **Correct Properties**: All required properties are present and correct

---

**🎉 If all tests pass, AN-01 Event Tracking is working correctly!** 