# 📱 Mobile Testing Script for Staging Environment

## 🎯 Test Objectives
Verify that the Novara MVP staging environment works correctly on mobile devices, particularly focusing on:
- CORS issues preventing frontend-backend communication
- Authentication flow on mobile browsers
- Daily check-in form functionality
- Responsive design and touch interactions

## 📋 Pre-Test Setup

### 1. Access Staging Environment
- **Frontend URL**: https://novara-bd6xsx1ru-novara-fertility.vercel.app
- **Backend URL**: https://novara-staging-staging.up.railway.app
- **Test Device**: Use actual mobile device (iPhone/Android)

### 2. Open Browser Developer Tools
- **Safari (iOS)**: Settings → Safari → Advanced → Web Inspector
- **Chrome (Android)**: chrome://inspect/#devices
- **Firefox (Android)**: about:debugging

## 🧪 Test Scenarios

### Test 1: Basic Page Load
**Objective**: Verify staging frontend loads correctly on mobile

**Steps**:
1. Open staging frontend URL on mobile device
2. Wait for page to fully load
3. Check for any console errors
4. Verify responsive design looks correct

**Expected Results**:
- ✅ Page loads without errors
- ✅ No JavaScript console errors
- ✅ Responsive design adapts to mobile screen
- ✅ All UI elements are touch-accessible

**Failure Indicators**:
- ❌ Page doesn't load
- ❌ JavaScript errors in console
- ❌ UI elements too small to touch
- ❌ Layout broken on mobile screen

---

### Test 2: Authentication Flow
**Objective**: Test login/signup functionality on mobile

**Steps**:
1. Navigate to staging frontend
2. Try to log in with test credentials:
   - Email: `test@example.com`
   - Password: `testpassword`
3. Check browser console for any errors
4. Verify authentication response

**Expected Results**:
- ✅ Login form loads correctly
- ✅ Form submission works
- ✅ No CORS errors in console
- ✅ Authentication succeeds (should work with test credentials)

**Failure Indicators**:
- ❌ CORS errors in console
- ❌ Form submission fails
- ❌ Network errors
- ❌ Authentication fails unexpectedly

---

### Test 3: Daily Check-in Form
**Objective**: Test daily check-in functionality on mobile

**Steps**:
1. After successful login, navigate to daily check-in
2. Fill out the check-in form:
   - Select mood(s): "hopeful, excited"
   - Set confidence: 7
   - Add note: "Mobile test"
3. Submit the form
4. Check for any errors

**Expected Results**:
- ✅ Form loads correctly
- ✅ All form elements are touch-accessible
- ✅ Form submission works
- ✅ No CORS or network errors
- ✅ Success message appears

**Failure Indicators**:
- ❌ Form doesn't load
- ❌ CORS errors in console
- ❌ Form submission fails
- ❌ Network timeout errors
- ❌ Form elements not touch-accessible

---

### Test 4: API Endpoint Testing
**Objective**: Verify backend API endpoints work from mobile

**Steps**:
1. Open browser console on mobile
2. Test health endpoint:
   ```javascript
   fetch('https://novara-staging-staging.up.railway.app/api/health')
     .then(r => r.json())
     .then(console.log)
   ```
3. Test CORS preflight:
   ```javascript
   fetch('https://novara-staging-staging.up.railway.app/api/checkins', {
     method: 'OPTIONS',
     headers: {
       'Origin': 'https://novara-bd6xsx1ru-novara-fertility.vercel.app'
     }
   }).then(r => console.log('CORS Status:', r.status))
   ```

**Expected Results**:
- ✅ Health endpoint returns 200
- ✅ CORS preflight returns 204
- ✅ No CORS errors in console

**Failure Indicators**:
- ❌ Health endpoint fails
- ❌ CORS preflight fails
- ❌ CORS errors in console

---

### Test 5: PWA Functionality
**Objective**: Test Progressive Web App features on mobile

**Steps**:
1. Open staging frontend in mobile browser
2. Check if "Add to Home Screen" option appears
3. Add app to home screen if available
4. Test offline functionality (if implemented)

**Expected Results**:
- ✅ PWA manifest loads correctly
- ✅ "Add to Home Screen" option available
- ✅ App icon appears correctly
- ✅ App launches from home screen

**Failure Indicators**:
- ❌ No "Add to Home Screen" option
- ❌ App icon doesn't appear
- ❌ App doesn't launch from home screen

---

### Test 6: Performance Testing
**Objective**: Verify app performance on mobile

**Steps**:
1. Open staging frontend
2. Monitor page load time
3. Test scrolling performance
4. Check for any lag or stuttering

**Expected Results**:
- ✅ Page loads within 3 seconds
- ✅ Smooth scrolling
- ✅ No lag or stuttering
- ✅ Responsive touch interactions

**Failure Indicators**:
- ❌ Page takes >5 seconds to load
- ❌ Scrolling is choppy
- ❌ Touch interactions lag
- ❌ App feels unresponsive

## 🚨 Known Issues to Watch For

### Critical Issues Found:
1. **CORS Configuration Problem**: Missing `access-control-allow-origin` header
2. **Authentication Bypass**: Test credentials work when they shouldn't
3. **Enhanced Check-in Endpoint**: Requires authentication when it should have bypass

### Expected Behavior:
- Frontend should be able to communicate with backend
- Authentication should work properly
- Daily check-in should function correctly
- No CORS errors in console

## 📊 Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| Basic Page Load | ⚪ | |
| Authentication Flow | ⚪ | |
| Daily Check-in Form | ⚪ | |
| API Endpoint Testing | ⚪ | |
| PWA Functionality | ⚪ | |
| Performance Testing | ⚪ | |

**Status Legend**:
- ✅ Passed
- ❌ Failed
- ⚠️ Partial/Issues
- ⚪ Not Tested

## 🔧 Troubleshooting

### If CORS Errors Occur:
1. Check browser console for specific CORS error messages
2. Note the exact error text
3. Verify the request is going to the correct backend URL
4. Check if the error mentions the staging frontend URL

### If Authentication Fails:
1. Check if test credentials are working
2. Verify JWT token is being received
3. Check for token expiration errors
4. Test with different browsers

### If Form Submission Fails:
1. Check network tab for failed requests
2. Verify request payload format
3. Check for validation errors
4. Test with different form data

## 📝 Reporting

After completing tests, report:
1. Which tests passed/failed
2. Specific error messages from console
3. Screenshots of any UI issues
4. Performance observations
5. Browser and device information

## 🎯 Success Criteria

The staging environment is working correctly on mobile when:
- ✅ All tests pass
- ✅ No CORS errors in console
- ✅ Authentication works properly
- ✅ Daily check-in form functions correctly
- ✅ App is responsive and performant
- ✅ PWA features work as expected 