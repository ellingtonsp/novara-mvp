# ON-01 Comprehensive Verification Test

## 🎯 **Test Objective**
Verify that all ON-01 fixes are working correctly:
1. Fast Path UI shows "Quick setup • A/B test path"
2. Conditional rendering blocks Fast Lane users from insights
3. Environment variables are properly set
4. Debug logging shows correct values

## 🧪 **Test Setup**

### **Environment Variables (Already Set)**
```bash
VITE_FORCE_ONBOARDING_PATH=test
VITE_DEBUG_AB_TEST=true
```

### **Servers Status**
- ✅ Frontend: http://localhost:4200 (running)
- ✅ Backend: http://localhost:9002 (running)

## 🔍 **Test Steps**

### **Step 1: Verify Environment Variables**
1. Open browser to http://localhost:4200
2. Open browser console
3. Look for these console logs:
   ```
   🧪 A/B Test: FORCED PATH = test
   🧪 ON-01: needsBaselineCompletion check: {...}
   ```

### **Step 2: Test Fast Lane Onboarding**
1. Start new onboarding flow
2. Should see "Quick setup • A/B test path" (not "Fast path • 3 of 3 steps")
3. Complete Fast Lane onboarding (3 questions)
4. Should see console log: `✅ Fast onboarding completed successfully`

### **Step 3: Test Dashboard Conditional Rendering**
1. After Fast Lane signup, should see "Complete Your Profile" message
2. Should NOT see insights or check-in forms
3. Console should show:
   ```
   🧪 ON-01 Debug: needsBaselineCompletion check: {
     user: "test@example.com",
     onboardingPath: "test",
     baseline_completed: false,
     needsBaseline: true
   }
   ```

### **Step 4: Test Baseline Panel**
1. Click "Complete Profile" button
2. Baseline Panel should appear
3. Complete baseline questions
4. Should be redirected to dashboard with insights visible

### **Step 5: Test Control Path**
1. Set `VITE_FORCE_ONBOARDING_PATH=control`
2. Complete full onboarding (6 questions)
3. Should see insights immediately
4. Console should show `needsBaseline: false`

## 📊 **Expected Results**

### **Fast Lane User (test path):**
- ✅ UI shows "Quick setup • A/B test path"
- ✅ Dashboard shows "Complete Your Profile" message
- ✅ No insights or check-in forms visible
- ✅ Console shows `needsBaseline: true`
- ✅ Baseline Panel appears when clicked
- ✅ After baseline completion, insights appear

### **Control User (control path):**
- ✅ Standard onboarding flow
- ✅ Dashboard shows insights immediately
- ✅ Console shows `needsBaseline: false`

## 🚨 **Troubleshooting**

### **If Environment Variables Not Working:**
```bash
# Kill and restart servers
pkill -f "vite.*4200"
pkill -f "nodemon.*server.js"
VITE_FORCE_ONBOARDING_PATH=test VITE_DEBUG_AB_TEST=true ./scripts/start-dev-stable.sh
```

### **If Conditional Rendering Not Working:**
1. Check console for debug logs
2. Verify `needsBaselineCompletion` function is called
3. Check if `user?.baseline_completed` field exists
4. Verify `onboardingPath` is set to 'test'

### **If UI Text Not Updated:**
1. Hard refresh browser (Cmd+Shift+R)
2. Check if FastOnboarding.tsx changes are applied
3. Verify Vite hot reload is working

## 🎯 **Success Criteria**

- [ ] Fast Lane UI shows correct text
- [ ] Fast Lane users blocked from insights
- [ ] Control users see insights immediately
- [ ] Debug logs show correct values
- [ ] Baseline Panel works correctly
- [ ] No field name mismatches

## 📝 **Test Results Template**

```
Test Date: ___________
Environment: VITE_FORCE_ONBOARDING_PATH=test, VITE_DEBUG_AB_TEST=true

Fast Lane Test:
- UI Text: ✅/❌ "Quick setup • A/B test path"
- Dashboard Message: ✅/❌ "Complete Your Profile" shown
- Insights Blocked: ✅/❌ No insights visible
- Console Logs: ✅/❌ needsBaseline: true
- Baseline Panel: ✅/❌ Appears and works

Control Test:
- Standard Onboarding: ✅/❌ 6 questions
- Insights Visible: ✅/❌ Immediately shown
- Console Logs: ✅/❌ needsBaseline: false

Issues Found: ________________
```

## 🚀 **Ready for Testing**

All fixes are in place and servers are running. The test should now work correctly with proper conditional rendering and debug logging. 