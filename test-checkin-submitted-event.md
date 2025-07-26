# 🎯 Checkin Submitted Event Debug Test

## **Test Environment**
- **Frontend**: https://novara-p49jrlgkz-novara-fertility.vercel.app
- **PostHog Dashboard**: Check for `checkin_submitted` events

---

## **🔍 Debug Steps**

### **Step 1: Open Browser Developer Tools**
```bash
# Open staging frontend
https://novara-p49jrlgkz-novara-fertility.vercel.app

# Open Developer Tools (F12)
# Go to Console tab
# Go to Network tab (filter by "posthog")
```

### **Step 2: Clear Browser Data**
```javascript
// In console, run:
localStorage.clear();
sessionStorage.clear();
// Then hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### **Step 3: Sign Up/Login**
1. Complete the signup process
2. Verify `signup` event appears in PostHog
3. Note the user ID from the signup event

### **Step 4: Submit a Check-in**
1. Fill out the daily check-in form
2. Select some moods (these become `symptom_flags`)
3. Set confidence score
4. Submit the form

### **Step 5: Check Console Logs**
Look for these debug messages in the console:

```javascript
🎯 AN-01 DEBUG: About to track checkin_submitted event
🎯 AN-01 DEBUG: user object: {id: "...", email: "..."}
🎯 AN-01 DEBUG: user.id: "rec..."
🎯 AN-01 DEBUG: checkinStartTime: 1234567890
🎯 AN-01 DEBUG: current time: 1234567890
🎯 AN-01 DEBUG: time calculation: 5000
🎯 AN-01 DEBUG: PostHog available: true
🎯 AN-01 DEBUG: PostHog capture available: true
🎯 AN-01 DEBUG: trackCheckinSubmitted payload: {user_id: "...", mood_score: 7, symptom_flags: [...], time_to_complete_ms: 5000}
🎯 AN-01 DEBUG: Identifying user before tracking: rec...
🎯 AN-01 DEBUG: Testing direct PostHog capture...
🎯 AN-01 DEBUG: Direct PostHog capture successful
🎯 AN-01 DEBUG: track() called with event: checkin_submitted
🎯 AN-01 DEBUG: API Key available: true
🎯 AN-01 DEBUG: Environment check: {isProduction: false, isStaging: true, isPreview: false, isDevelopment: false}
🎯 AN-01 DEBUG: posthogInstance available: true
🎯 AN-01 DEBUG: posthogInstance.capture available: true
🎯 AN-01 DEBUG: Calling posthogInstance.capture with: checkin_submitted
✅ AN-01 DEBUG: Event sent to PostHog successfully
```

### **Step 6: Check Network Tab**
1. Look for POST requests to PostHog
2. Check if the `checkin_submitted` event is being sent
3. Verify the payload structure

### **Step 7: Check PostHog Dashboard**
1. Go to PostHog Events
2. Look for `checkin_submitted` event
3. Check the event properties:
   - `user_id`
   - `mood_score`
   - `symptom_flags`
   - `time_to_complete_ms`

---

## **🚨 Expected Issues & Solutions**

### **Issue 1: User Not Identified**
**Symptoms**: Event appears but user is anonymous
**Solution**: The fix should ensure user identification before tracking

### **Issue 2: Event Not Appearing**
**Symptoms**: No `checkin_submitted` event in PostHog
**Possible Causes**:
- Environment detection issue
- PostHog not initialized
- Network error
- API key missing

### **Issue 3: Wrong Event Name**
**Symptoms**: Event appears with different name
**Check**: Should be exactly `checkin_submitted`

### **Issue 4: Missing Properties**
**Symptoms**: Event appears but missing required properties
**Required Properties**:
- `user_id` (string)
- `mood_score` (number)
- `symptom_flags` (array of strings)
- `time_to_complete_ms` (number)

---

## **📊 Success Criteria**

✅ **Event appears in PostHog** with name `checkin_submitted`
✅ **User is properly identified** (not anonymous)
✅ **All required properties** are present
✅ **Event timing** is reasonable (not 0ms)
✅ **No console errors** during tracking

---

## **🔧 If Event Still Not Working**

### **Manual Test in Console**
```javascript
// Test direct PostHog call
if (window.posthog) {
  window.posthog.capture('checkin_submitted', {
    user_id: 'test-user-id',
    mood_score: 7,
    symptom_flags: ['hopeful', 'optimistic'],
    time_to_complete_ms: 5000
  });
  console.log('Manual test event sent');
}
```

### **Check Environment Variables**
```javascript
// In console, check:
console.log('VITE_POSTHOG_API_KEY:', !!import.meta.env.VITE_POSTHOG_API_KEY);
console.log('VITE_VERCEL_ENV:', import.meta.env.VITE_VERCEL_ENV);
console.log('Environment:', import.meta.env.MODE);
```

### **Verify PostHog Initialization**
```javascript
// In console, check:
console.log('PostHog available:', !!window.posthog);
console.log('PostHog capture available:', !!window.posthog?.capture);
console.log('PostHog distinct_id:', window.posthog?.get_distinct_id());
``` 