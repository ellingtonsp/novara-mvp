# AN-01 Event Tracking - Staging Environment Test

## 🎯 **Test Objective**
Validate that all AN-01 event tracking functionality works correctly in the staging environment with PostHog integration.

## 🌐 **Staging Environment URLs**
- **Frontend**: https://novara-ny598g1wo-novara-fertility.vercel.app
- **Backend**: https://novara-staging-staging.up.railway.app
- **PostHog**: https://app.posthog.com (filter by environment: 'staging')

## 📋 **Pre-Test Setup**

### 1. **PostHog Preparation**
- [ ] Open PostHog dashboard: https://app.posthog.com
- [ ] Navigate to Activity (in the left sidebar menu)
- [ ] Set up filter: `environment = 'staging'`
- [ ] Clear any existing events for clean testing

### 2. **Browser Setup**
- [ ] Open Chrome DevTools (F12)
- [ ] Go to Network tab
- [ ] Go to Console tab
- [ ] Clear console and network logs

## 🧪 **Test Scenarios**

### **Test 1: Signup Event Tracking**
**Objective**: Verify `signup` event fires when new user registers

**Steps**:
1. Navigate to: https://novara-ny598g1wo-novara-fertility.vercel.app
2. Click "Get Started" or "Sign Up"
3. Fill out registration form with test data:
   - Email: `test-staging-${Date.now()}@example.com`
   - Nickname: `StagingTestUser`
   - Confidence levels: All set to 5
   - Primary need: `medical_clarity`
   - Cycle stage: `ivf_prep`
4. Click "Create Account"

**Expected Results**:
- [ ] User account created successfully
- [ ] Redirected to dashboard
- [ ] PostHog Activity shows `signup` event within 30 seconds
- [ ] Event payload includes:
  - `user_id`: Correct user ID
  - `environment`: 'staging'
  - `signup_method`: 'email'
  - `primary_need`: 'medical_clarity'
  - `cycle_stage`: 'ivf_prep'

**Console Verification**:
- [ ] No 401/403 errors in console
- [ ] PostHog API calls successful (200 status)
- [ ] Event timing < 200ms

### **Test 2: Check-in Submitted Event Tracking**
**Objective**: Verify `checkin_submitted` event fires when user completes daily check-in

**Steps**:
1. Ensure logged in as test user from Test 1
2. Navigate to daily check-in form
3. Complete all required questions:
   - Mood: Select any option
   - Energy: Select any option
   - Stress: Select any option
   - Sleep quality: Select any option
   - Any additional questions
4. Click "Submit Check-in"

**Expected Results**:
- [ ] Check-in submitted successfully
- [ ] Success message displayed
- [ ] PostHog Activity shows `checkin_submitted` event within 30 seconds
- [ ] Event payload includes:
  - `user_id`: Correct user ID
  - `environment`: 'staging'
  - `checkin_id`: Valid check-in ID
  - `questions_answered`: Number of questions
  - `completion_time`: Time taken to complete

**Console Verification**:
- [ ] No 401/403 errors in console
- [ ] PostHog API calls successful
- [ ] Event timing < 200ms

### **Test 3: Insight Viewed Event Tracking**
**Objective**: Verify `insight_viewed` event fires when insights become visible

**Steps**:
1. Ensure logged in as test user
2. Navigate to dashboard/insights section
3. Scroll down to view daily insights
4. Wait for insights to load and become visible

**Expected Results**:
- [ ] Insights load and display correctly
- [ ] PostHog Activity shows `insight_viewed` event within 30 seconds
- [ ] Event fires when insight card is 50% visible
- [ ] Event payload includes:
  - `user_id`: Correct user ID
  - `environment`: 'staging'
  - `insight_type`: Type of insight (e.g., 'confidence_rising')
  - `insight_id`: Unique insight identifier
  - `view_duration`: Time spent viewing

**Console Verification**:
- [ ] IntersectionObserver working correctly
- [ ] No 401/403 errors in console
- [ ] PostHog API calls successful

### **Test 4: Share Action Event Tracking**
**Objective**: Verify `share_action` event fires when user shares content

**Steps**:
1. Ensure logged in as test user
2. Navigate to insights section
3. Find a shareable insight
4. Click share button on insight card
5. Complete share action (native share or clipboard)

**Expected Results**:
- [ ] Share functionality works (native or clipboard fallback)
- [ ] PostHog Activity shows `share_action` event within 30 seconds
- [ ] Event payload includes:
  - `user_id`: Correct user ID
  - `environment`: 'staging'
  - `share_surface`: 'insight'
  - `destination`: 'native_share' or 'clipboard'
  - `content_id`: Insight identifier

**Console Verification**:
- [ ] Share API calls successful
- [ ] No 401/403 errors in console
- [ ] PostHog API calls successful

## 🔍 **PostHog Validation**

### **Event Verification Checklist**
- [ ] All 4 events appear in PostHog Activity
- [ ] Events tagged with `environment: 'staging'`
- [ ] User ID properly attributed to authenticated user
- [ ] Event timing < 200ms from user action
- [ ] Events appear within 30 seconds of firing
- [ ] No duplicate events
- [ ] Event properties match expected schema

### **PostHog Dashboard Check**
- [ ] Navigate to PostHog Activity (left sidebar)
- [ ] Filter by environment: 'staging'
- [ ] Verify events are properly categorized
- [ ] Check user identification is working
- [ ] Confirm no PII leakage in event properties

## 🚨 **Error Handling Tests**

### **Test 5: Network Failure Handling**
**Objective**: Verify graceful handling when PostHog is unavailable

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Block requests to `app.posthog.com`
4. Perform signup action
5. Check console for error handling

**Expected Results**:
- [ ] App continues to function normally
- [ ] No crashes or blocking errors
- [ ] Console shows PostHog connection errors
- [ ] User experience unaffected

### **Test 6: Authentication Edge Cases**
**Objective**: Verify events work with different authentication states

**Steps**:
1. Test events when user is logged out
2. Test events during token refresh
3. Test events after session expiry

**Expected Results**:
- [ ] Events still fire with anonymous user ID
- [ ] No authentication errors in console
- [ ] Graceful fallback behavior

## 📊 **Performance Validation**

### **Event Timing**
- [ ] Signup event: < 200ms
- [ ] Check-in event: < 200ms
- [ ] Insight viewed event: < 200ms
- [ ] Share action event: < 200ms

### **Network Performance**
- [ ] PostHog API calls: < 100ms
- [ ] No blocking of main app functionality
- [ ] Events don't impact page load times

## 🎯 **Success Criteria**

### **All Tests Must Pass**:
- [ ] All 4 AN-01 events fire correctly
- [ ] Events appear in PostHog within 30 seconds
- [ ] User attribution works correctly
- [ ] Environment filtering works
- [ ] No 401/403 authentication errors
- [ ] Performance meets < 200ms requirement
- [ ] Error handling works gracefully

### **PostHog Integration**:
- [ ] Events properly tagged with environment
- [ ] User identification working
- [ ] No PII in event properties
- [ ] Event schema matches requirements

## 🔧 **Troubleshooting**

### **If Events Don't Appear**:
1. Check browser console for errors
2. Verify PostHog API key is correct
3. Check network tab for failed requests
4. Verify environment variables are set
5. Check PostHog project settings

### **If Authentication Errors**:
1. Check JWT token validity
2. Verify backend authentication
3. Check token refresh logic
4. Verify user session state

### **If Performance Issues**:
1. Check network latency
2. Verify PostHog API response times
3. Check for blocking operations
4. Monitor browser performance

## 📝 **Test Results**

**Test Date**: _______________
**Tester**: _______________
**Environment**: Staging

**Results Summary**:
- [ ] All tests passed
- [ ] Some tests failed (see notes below)
- [ ] Blocking issues found

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Next Steps**:
- [ ] Deploy to production if all tests pass
- [ ] Fix issues and retest
- [ ] Update documentation
- [ ] Create PostHog dashboard 