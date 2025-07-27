# ON-01 A/B Onboarding Experiment - UAT Script

## 🎯 Test Objective
Validate the A/B test onboarding experiment works correctly with proper path selection, fast onboarding flow, and BaselinePanel integration.

## 📋 Pre-Test Setup
1. **Environment**: Local development (`http://localhost:4200`)
2. **Branch**: `feature/ON-01-speed-tapper-detection` (rescoped to A/B test)
3. **Feature Flags**: 
   - `VITE_AB_TEST_ENABLED=true`
   - `VITE_DEBUG_AB_TEST=true`
4. **Browser**: Chrome/Firefox with DevTools Console open

## 🧪 Test Scenarios

### **Test 1: Control Path (Standard Onboarding)**
**Goal**: Verify full 6-question onboarding works correctly

**Setup**:
```bash
# In frontend/.env.development
VITE_FORCE_ONBOARDING_PATH=control
```

**Steps**:
1. Refresh browser to `http://localhost:4200`
2. Open DevTools Console
3. Click "Start Your Journey"
4. **Expected**: Console shows `🧪 A/B Test: FORCED PATH = control`
5. **Expected**: Standard 6-question modal appears
6. Complete all fields:
   - Email: `control-test@example.com`
   - Nickname: `ControlTester`
   - Confidence sliders: Set to various values
   - Cycle stage: Select any option
   - Primary concern: Select any option
7. Click "Start My Journey"
8. **Expected**: Welcome insight appears
9. **Expected**: Console shows `onboarding_completed` event with `path: 'control'`

**✅ Pass Criteria**: 
- Path correctly identified as control
- Full onboarding form displayed
- Analytics events fired correctly
- User redirected to welcome insight

---

### **Test 2: Test Path (Fast Lane + BaselinePanel)**
**Goal**: Verify fast onboarding and baseline panel flow

**Setup**:
```bash
# In frontend/.env.development  
VITE_FORCE_ONBOARDING_PATH=test
```

**Steps**:
1. Refresh browser to `http://localhost:4200`
2. Open DevTools Console
3. Click "Start Your Journey"
4. **Expected**: Console shows `🧪 A/B Test: FORCED PATH = test`
5. **Expected**: OnboardingFast modal appears (3 fields only)
6. Complete fast onboarding:
   - Email: `test-path@example.com`
   - Cycle stage: Select any option
   - Primary concern: Select any option
7. Click "Complete Setup"
8. **Expected**: Welcome insight appears
9. **Expected**: Console shows `onboarding_completed` event with `path: 'test'`
10. Navigate to check-in flow (complete a daily check-in)
11. **Expected**: After check-in submission, BaselinePanel modal appears
12. Complete BaselinePanel:
    - Question 1 (Nickname): Enter "TestUser"
    - Question 2 (Medication confidence): Move slider
    - Question 3 (Cost confidence): Move slider
13. Click "Complete Setup"
14. **Expected**: Modal closes and insights page loads
15. **Expected**: Console shows `baseline_completed` event

**✅ Pass Criteria**:
- Path correctly identified as test
- Fast onboarding with only 3 fields
- BaselinePanel appears after first check-in
- Baseline completion tracked
- User gets to insights after baseline

---

### **Test 3: Random Path Selection**
**Goal**: Verify random 50/50 split works when no path is forced

**Setup**:
```bash
# In frontend/.env.development
VITE_FORCE_ONBOARDING_PATH=
# (empty value for random selection)
```

**Steps**:
1. Refresh browser multiple times
2. Click "Start Your Journey" each time
3. Check console for path assignment
4. **Expected**: Roughly 50% control, 50% test over multiple attempts
5. **Expected**: Console shows random path selection reasoning

**✅ Pass Criteria**:
- Random assignment working
- Both paths reachable via random selection
- Debug logging shows selection logic

---

### **Test 4: BaselinePanel Edge Cases**
**Goal**: Test BaselinePanel behavior in various scenarios

**Setup**: Force test path as in Test 2

**Steps**:
1. Complete fast onboarding as test user
2. **Test 4a - BaselinePanel Back Button**:
   - Complete check-in, wait for BaselinePanel
   - Click "Back" on first question
   - **Expected**: Modal stays open, goes to previous question
3. **Test 4b - BaselinePanel Close**:
   - If close button exists, test it doesn't break flow
4. **Test 4c - Multiple Check-ins**:
   - Complete BaselinePanel once
   - Do another check-in
   - **Expected**: BaselinePanel does NOT appear again
   - **Expected**: Direct redirect to insights

**✅ Pass Criteria**:
- BaselinePanel navigation works correctly
- Baseline completion persists correctly
- No duplicate baseline collection

---

### **Test 5: Analytics Validation**
**Goal**: Ensure all analytics events fire correctly

**Steps**:
1. Test both control and test paths
2. Monitor DevTools console for analytics events
3. **Expected Events**:
   - `onboarding_path_selected`: Fires immediately on path selection
   - `onboarding_completed`: Fires on signup completion  
   - `baseline_completed`: Fires only for test path users after BaselinePanel

**Event Properties to Verify**:
```javascript
// onboarding_path_selected
{
  path: 'control' | 'test',
  session_id: string,
  timestamp: number,
  environment: 'development'
}

// onboarding_completed  
{
  path: 'control' | 'test',
  completion_ms: number,
  session_id: string,
  user_id: string,
  timestamp: number,
  environment: 'development'
}

// baseline_completed (test path only)
{
  completion_ms: number, 
  user_id: string,
  session_id: string,
  timestamp: number,
  environment: 'development'
}
```

**✅ Pass Criteria**:
- All events fire with correct structure
- Timing data is reasonable (positive completion_ms)
- Session IDs consistent across events

---

## 🚨 Error Scenarios

### **Test 6: Error Handling**
**Goal**: Ensure graceful error handling

**Steps**:
1. **Offline Test**: Disconnect internet, try to complete onboarding
   - **Expected**: Appropriate error message, no crashes
2. **Invalid Data**: Try submitting forms with missing/invalid data
   - **Expected**: Validation messages, form doesn't submit
3. **Backend Down**: Stop backend server, try onboarding
   - **Expected**: Connection error shown, no crashes

**✅ Pass Criteria**:
- No JavaScript errors in console
- User-friendly error messages
- App remains functional after errors

---

## 📊 Success Criteria Summary

### ✅ Must Pass All:
- [ ] Control path shows full 6-question onboarding
- [ ] Test path shows 3-question fast onboarding  
- [ ] BaselinePanel appears for test users after first check-in
- [ ] BaselinePanel does NOT appear for control users
- [ ] Random path assignment works (when not forced)
- [ ] All analytics events fire with correct data
- [ ] Database updates work (baseline completion persists)
- [ ] No JavaScript errors or crashes
- [ ] Fast onboarding takes <30 seconds
- [ ] BaselinePanel completion works smoothly

### 🎯 Performance Checks:
- [ ] Fast onboarding loads quickly
- [ ] BaselinePanel modal opens smoothly
- [ ] No visible lag when switching between questions
- [ ] Animations are smooth (progress bars, transitions)

### 🔍 UX Validation:
- [ ] Modal positioning looks correct (centered, not cutoff)
- [ ] Text is readable and makes sense
- [ ] Buttons are clearly labeled and functional
- [ ] Progress indicators work correctly in BaselinePanel
- [ ] Color scheme consistent with Novara brand

---

## 🐛 Bug Report Template

If issues found, document as:

```markdown
**Bug ID**: ON-01-UAT-[sequence]
**Test**: [Test scenario name]
**Severity**: S/M/L  
**Description**: [What happened]
**Expected**: [What should have happened]
**Steps to Reproduce**: [Exact steps]
**Browser/Environment**: [Details]
**Console Errors**: [Any errors shown]
```

---

## ✅ UAT Completion Checklist

- [ ] All 6 test scenarios completed
- [ ] No critical (S) bugs found
- [ ] Performance meets criteria
- [ ] Analytics events validated
- [ ] Error handling confirmed
- [ ] UX review completed
- [ ] Documentation reviewed and accurate

**UAT Sign-off**: ___________________  
**Date**: ___________________  
**Ready for Staging**: ✅/❌ 