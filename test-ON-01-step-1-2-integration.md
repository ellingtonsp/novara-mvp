# ON-01 Step 1.2: A/B Test Integration Test

## 🎯 **Test Objective**
Verify that the A/B test integration in `NovaraLanding.tsx` is working correctly.

## 📋 **Test Setup**

### **Environment Variables**
```bash
# Frontend (.env.development)
VITE_FORCE_ONBOARDING_PATH=test  # For testing specific paths
```

## 🧪 **Test Scenarios**

### **Test 1: A/B Test Path Initialization**
**Objective**: Verify A/B test path is initialized on component mount

**Steps**:
1. Open browser to `http://localhost:4200`
2. Open browser console (F12)
3. Refresh the page
4. Check console for A/B test logs

**Expected Results**:
- Console shows: `🧪 ON-01: Initialized A/B test path = control` or `test`
- Path should be consistent for the same session
- No errors in console

### **Test 2: Environment Variable Override**
**Objective**: Verify forced path works for testing

**Steps**:
1. Set environment variable: `VITE_FORCE_ONBOARDING_PATH=test`
2. Refresh browser page
3. Check console for forced path log

**Expected Results**:
- Console shows: `🧪 A/B Test: FORCED PATH = test`
- Path should always be 'test' regardless of session

### **Test 3: Session Consistency**
**Objective**: Verify same session gets same path

**Steps**:
1. Note the A/B test path from console
2. Refresh the page multiple times
3. Check that path remains the same

**Expected Results**:
- Same path should be assigned on each refresh
- Console should show cached path decision

### **Test 4: State Variables**
**Objective**: Verify state variables are properly initialized

**Steps**:
1. Open browser console
2. Type: `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`
3. Check React DevTools for component state

**Expected Results**:
- `onboardingPath` should be set to 'control' or 'test'
- `showBaselinePanel` should be false initially

## 📊 **Test Results**

| Test | Status | Notes |
|------|--------|-------|
| Path Initialization | ⬜ | |
| Environment Override | ⬜ | |
| Session Consistency | ⬜ | |
| State Variables | ⬜ | |

## 🎯 **Success Criteria**
- ✅ A/B test path initializes correctly
- ✅ Environment variable override works
- ✅ Session consistency maintained
- ✅ No console errors
- ✅ State variables properly set

## 🚀 **Next Steps**
If all tests pass, proceed to **Step 1.3: Database Integration** 