# UAT Testing Guide - Onboarding Insight Fix

## 🎯 Testing Overview

**Objective**: Validate that the onboarding insight fix works correctly across all user scenarios.

**Environment**: Local development (Frontend: http://localhost:4200, Backend: http://localhost:9002)

**Test Focus**: Ensure users only see insights after completing full onboarding.

---

## 🧪 Test Scenarios

### **Scenario 1: New User - Test Path (Fast Onboarding)**

#### **Setup**
1. Open http://localhost:4200 in your browser
2. Clear browser cache/localStorage if needed
3. Open browser dev tools (F12) to monitor network requests

#### **Test Steps**
1. **Sign Up Flow**
   - Click "Get Started" or "Sign Up"
   - Use email: `uat-test-path@example.com`
   - Complete the fast onboarding flow (speed-tap detection)
   - Verify you're redirected to dashboard

2. **Dashboard State Check**
   - **Expected**: Should see "Complete Your Profile" prompt
   - **Expected**: Should NOT see daily insights
   - **Expected**: Should see "Complete Profile" button

3. **Complete Profile Flow**
   - Click "Complete Profile" button
   - Fill out baseline questions
   - Submit baseline completion

4. **Post-Completion Check**
   - **Expected**: Should now see daily insights
   - **Expected**: Should see personalized welcome insight
   - **Expected**: Should see "0 check-ins analyzed" (which is now appropriate)

#### **Validation Points**
- [ ] No insights shown before profile completion
- [ ] Clear "Complete Profile" prompt displayed
- [ ] Insights appear immediately after profile completion
- [ ] Welcome insight is personalized and relevant

---

### **Scenario 2: New User - Control Path (Standard Onboarding)**

#### **Setup**
1. Open http://localhost:4200 in your browser
2. Clear browser cache/localStorage
3. Open browser dev tools

#### **Test Steps**
1. **Sign Up Flow**
   - Click "Get Started" or "Sign Up"
   - Use email: `uat-control-path@example.com`
   - Complete the standard onboarding flow (all questions)
   - Verify you're redirected to dashboard

2. **Dashboard State Check**
   - **Expected**: Should see daily insights immediately
   - **Expected**: Should see personalized welcome insight
   - **Expected**: Should NOT see "Complete Profile" prompt

#### **Validation Points**
- [ ] Insights shown immediately after standard onboarding
- [ ] Welcome insight is personalized
- [ ] No "Complete Profile" prompt for fully onboarded users

---

### **Scenario 3: Existing User - Incomplete Onboarding**

#### **Setup**
1. Open http://localhost:4200
2. Clear browser cache/localStorage
3. Open browser dev tools

#### **Test Steps**
1. **Create Incomplete User**
   - Use browser console to create incomplete user:
   ```javascript
   // In browser console
   fetch('http://localhost:9002/api/users', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'uat-incomplete@example.com',
       nickname: 'IncompleteUser',
       confidence_meds: 5,
       confidence_costs: 5,
       confidence_overall: 5,
       primary_need: null,
       cycle_stage: null,
       top_concern: 'financial_stress',
       email_opt_in: true,
       onboarding_path: 'control',
       baseline_completed: false
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **Login as Incomplete User**
   - Use the login flow with `uat-incomplete@example.com`
   - Verify you're logged in

3. **Dashboard State Check**
   - **Expected**: Should see "Complete Your Profile" prompt
   - **Expected**: Should NOT see daily insights
   - **Expected**: Should see "Complete Profile" button

#### **Validation Points**
- [ ] Incomplete users are blocked from insights
- [ ] Clear guidance to complete profile
- [ ] No confusing "0 check-ins" message

---

### **Scenario 4: Existing User - Complete Onboarding**

#### **Setup**
1. Open http://localhost:4200
2. Clear browser cache/localStorage
3. Open browser dev tools

#### **Test Steps**
1. **Create Complete User**
   - Use browser console to create complete user:
   ```javascript
   // In browser console
   fetch('http://localhost:9002/api/users', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'uat-complete@example.com',
       nickname: 'CompleteUser',
       confidence_meds: 5,
       confidence_costs: 5,
       confidence_overall: 5,
       primary_need: 'medical_clarity',
       cycle_stage: 'ivf_prep',
       top_concern: 'financial_stress',
       email_opt_in: true,
       onboarding_path: 'control',
       baseline_completed: true
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **Login as Complete User**
   - Use the login flow with `uat-complete@example.com`
   - Verify you're logged in

3. **Dashboard State Check**
   - **Expected**: Should see daily insights immediately
   - **Expected**: Should see personalized insights
   - **Expected**: Should NOT see "Complete Profile" prompt

#### **Validation Points**
- [ ] Complete users see insights immediately
- [ ] Insights are personalized and relevant
- [ ] No unnecessary completion prompts

---

## 🔍 Technical Validation

### **Backend API Testing**

#### **Test Incomplete User API Response**
```bash
# Create incomplete user and get token
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"api-test-incomplete@example.com","nickname":"TestUser","confidence_meds":5,"confidence_costs":5,"confidence_overall":5,"primary_need":null,"cycle_stage":null,"top_concern":"financial_stress","email_opt_in":true,"onboarding_path":"control","baseline_completed":false}'

# Test insights endpoint (should be blocked)
curl -X GET http://localhost:9002/api/insights/daily \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Complete your profile to unlock personalized insights",
  "requires_onboarding_completion": true,
  "user_status": {
    "onboarding_path": "control",
    "baseline_completed": 0,
    "has_primary_need": false,
    "has_cycle_stage": false
  }
}
```

#### **Test Complete User API Response**
```bash
# Create complete user and get token
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"api-test-complete@example.com","nickname":"TestUser","confidence_meds":5,"confidence_costs":5,"confidence_overall":5,"primary_need":"medical_clarity","cycle_stage":"ivf_prep","top_concern":"financial_stress","email_opt_in":true,"onboarding_path":"control","baseline_completed":true}'

# Test insights endpoint (should be allowed)
curl -X GET http://localhost:9002/api/insights/daily \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "insight": {
    "type": "balanced_welcome",
    "title": "Welcome back, TestUser",
    "message": "...",
    "confidence": 0.8,
    "id": "...",
    "insight_id": "..."
  },
  "analysis_data": {
    "checkins_analyzed": 0,
    "date_range": "No recent check-ins",
    "user_id": "..."
  }
}
```

### **Frontend Console Validation**

#### **Check for Expected Logs**
Open browser dev tools and look for these console messages:

**For Incomplete Users**:
```
🔍 Onboarding completion check: {user_email: "...", onboarding_path: "control", baseline_completed: 0, ...}
⚠️ User has not completed onboarding, blocking insights
```

**For Complete Users**:
```
🔍 Onboarding completion check: {user_email: "...", onboarding_path: "control", baseline_completed: 1, ...}
✅ Generated insight type: balanced_welcome for user: ...
```

---

## 📋 UAT Checklist

### **User Experience Validation**
- [ ] New users see "Complete Profile" prompt instead of insights
- [ ] Complete users see insights immediately
- [ ] Error messages are clear and actionable
- [ ] No confusing "0 check-ins analyzed" for incomplete users
- [ ] Insights are personalized and relevant

### **Technical Validation**
- [ ] Backend correctly blocks incomplete users (403 response)
- [ ] Backend allows complete users (200 response)
- [ ] Frontend handles both success and error responses
- [ ] Console logs provide clear debugging information
- [ ] No JavaScript errors in browser console

### **Edge Cases**
- [ ] Test with different onboarding paths (test vs control)
- [ ] Test with various completion states
- [ ] Test error handling and network failures
- [ ] Test browser refresh and session persistence

---

## 🚨 Known Issues & Workarounds

### **If You See "0 check-ins analyzed" for Incomplete Users**
- **Issue**: Frontend might still be showing insights
- **Workaround**: Clear browser cache and localStorage
- **Fix**: Ensure backend is returning 403 for incomplete users

### **If "Complete Profile" Button Doesn't Work**
- **Issue**: Baseline panel might not be loading
- **Workaround**: Check browser console for errors
- **Fix**: Verify baseline panel component is working

### **If Insights Don't Load After Completion**
- **Issue**: User state might not be updating
- **Workaround**: Refresh the page after completing profile
- **Fix**: Check if user data is being updated correctly

---

## 📊 Success Criteria

### **Must Pass**
- [ ] Incomplete users are blocked from insights
- [ ] Complete users can access insights
- [ ] Clear user guidance is provided
- [ ] No regression in existing functionality

### **Should Pass**
- [ ] Smooth user experience flow
- [ ] Fast response times
- [ ] Clear error messages
- [ ] Consistent behavior across scenarios

---

## 🎯 Next Steps After UAT

1. **Document Findings**: Record any issues or unexpected behavior
2. **Test Edge Cases**: Try unusual user scenarios
3. **Performance Check**: Ensure no performance degradation
4. **Accessibility**: Test with screen readers if applicable
5. **Mobile Testing**: Test on mobile devices if needed

---

**Ready to start UAT?** Open http://localhost:4200 and begin with Scenario 1! 