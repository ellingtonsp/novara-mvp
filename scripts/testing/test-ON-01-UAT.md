# ON-01 Speed-Tapper Detection - UAT Script

## 🎯 Test Objective
Validate that speed-tapper detection works correctly and provides a smooth fast onboarding experience.

## 📋 Pre-Test Setup
1. **Environment**: Local development
2. **Branch**: `feature/ON-01-speed-tapper-detection`
3. **Feature Flag**: `VITE_SPEED_TAP_ENABLED=true`
4. **Browser**: Chrome/Firefox with DevTools open

## 🚀 Test Scenarios

### **Scenario 1: Speed-Tapper Detection (Positive Case)**
**Goal**: Verify fast path triggers for rapid users

**Steps**:
1. Start local development: `./scripts/start-dev-stable.sh`
2. Open browser to `http://localhost:4200`
3. **Rapidly** fill out the first 2-3 fields (within 10 seconds):
   - Type email quickly: `speedtapper@test.com`
   - Select cycle stage quickly
   - Select primary need quickly
4. **Expected Result**: 
   - Toast notification: "Speed-tapper detected! Switching to fast onboarding..."
   - FastOnboarding form appears (3 fields only)
   - Standard form disappears

**Validation**:
- [ ] Toast appears with correct message
- [ ] FastOnboarding form shows (email, cycle_stage, primary_concern)
- [ ] Standard form hidden
- [ ] Console shows: `"Speed-tap detection triggered"`

---

### **Scenario 2: Standard User Flow (Negative Case)**
**Goal**: Verify normal users get standard onboarding

**Steps**:
1. Refresh page: `http://localhost:4200`
2. **Slowly** fill out the form (take >10 seconds):
   - Type email slowly: `normaluser@test.com`
   - Pause between selections
   - Take time to read options
3. **Expected Result**:
   - No speed-tap detection
   - Standard onboarding form remains
   - No toast notification

**Validation**:
- [ ] No speed-tap detection triggered
- [ ] Standard form remains visible
- [ ] No toast notification
- [ ] Console shows normal form interactions

---

### **Scenario 3: FastOnboarding Form Validation**
**Goal**: Test the abbreviated form functionality

**Steps**:
1. Trigger speed-tap detection (follow Scenario 1)
2. Test form validation:
   - Try submitting with empty fields
   - Enter invalid email format
   - Submit with valid data
3. **Expected Results**:
   - Empty fields show validation errors
   - Invalid email shows error
   - Valid data submits successfully

**Validation**:
- [ ] Empty field validation works
- [ ] Email format validation works
- [ ] Successful submission redirects to dashboard
- [ ] Console shows: `"Fast onboarding completed"`

---

### **Scenario 4: Analytics Events**
**Goal**: Verify PostHog events are firing correctly

**Steps**:
1. Open DevTools → Console
2. Follow Scenario 1 (speed-tapper)
3. Follow Scenario 2 (standard user)
4. Check console for analytics events

**Expected Events**:
- [ ] `onboarding_path_selected` with `path: "fast"` and `triggerReason: "speed_tap"`
- [ ] `onboarding_path_selected` with `path: "standard"` and `triggerReason: "default"`
- [ ] `onboarding_completed` events for both paths

**Validation**:
- [ ] Speed-tap events logged correctly
- [ ] Standard path events logged correctly
- [ ] Event properties match expected format

---

### **Scenario 5: Edge Cases**
**Goal**: Test boundary conditions

**Test Cases**:
1. **Exact Threshold**: Make exactly 3 taps in 10 seconds
2. **Time Boundary**: Make 3 taps at 9.9 seconds, then wait
3. **Session Persistence**: Refresh page, check if detection resets
4. **Multiple Triggers**: Try to trigger detection multiple times

**Validation**:
- [ ] Exact threshold triggers detection
- [ ] Time boundary works correctly
- [ ] Session resets on page refresh
- [ ] No duplicate triggers

---

### **Scenario 6: UI/UX Flow**
**Goal**: Verify smooth user experience

**Steps**:
1. Trigger speed-tap detection
2. Test back button functionality
3. Test form field navigation
4. Verify responsive design

**Validation**:
- [ ] Smooth transition animation
- [ ] Back button returns to standard form
- [ ] Tab navigation works
- [ ] Mobile responsive

---

## 🔧 Test Commands

### Start Local Development
```bash
./scripts/start-dev-stable.sh
```

### Check Environment
```bash
# Verify feature flag is enabled
grep "VITE_SPEED_TAP_ENABLED=true" frontend/.env.development
```

### Monitor Logs
```bash
# Frontend logs
cd frontend && npm run dev

# Backend logs (separate terminal)
cd backend && npm run dev
```

## 📊 Success Criteria

### **Must Pass**:
- [ ] Speed-tap detection triggers correctly
- [ ] FastOnboarding form displays and functions
- [ ] Analytics events fire properly
- [ ] No console errors
- [ ] Smooth user experience

### **Nice to Have**:
- [ ] Toast notifications look good
- [ ] Form validation is helpful
- [ ] Performance is fast

## 🚨 Known Issues
- Unit tests need Vitest configuration (not blocking)
- Some TypeScript warnings (non-critical)

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: Local Development

Scenario 1: Speed-Tapper Detection
- [ ] Pass
- [ ] Fail (Notes: ___________)

Scenario 2: Standard User Flow  
- [ ] Pass
- [ ] Fail (Notes: ___________)

Scenario 3: FastOnboarding Validation
- [ ] Pass
- [ ] Fail (Notes: ___________)

Scenario 4: Analytics Events
- [ ] Pass
- [ ] Fail (Notes: ___________)

Scenario 5: Edge Cases
- [ ] Pass
- [ ] Fail (Notes: ___________)

Scenario 6: UI/UX Flow
- [ ] Pass
- [ ] Fail (Notes: ___________)

Overall Result: [PASS/FAIL]
Notes: ___________
```

## 🎯 Next Steps After UAT
1. **All Pass**: Proceed to staging deployment
2. **Some Fail**: Fix issues, retest
3. **Major Issues**: Revisit implementation

---

**Ready to start testing? Run `./scripts/start-dev-stable.sh` and begin with Scenario 1!** 🚀 