# ON-01 Timing Fix Test Plan

## Test Scenario: Baseline Panel Appears After "Continue to Dashboard"

### Expected Behavior:
1. User completes fast onboarding (3 questions)
2. User sees welcome insight
3. User clicks "Continue to Dashboard"
4. **THEN** baseline panel modal appears (not before)

### Technical Fix Applied:
- **Structural Fix**: Moved baseline panel modal inside dashboard view sections
- **Conditional Rendering**: Baseline panel only renders when `currentView === 'dashboard'`
- **View Isolation**: Welcome view is completely separate from dashboard view
- **Timing Logic**: Baseline panel check only triggers on dashboard transition

### Test Steps:

#### Test Case 1: Fast Lane User (Test Path)
1. **Clear browser cache and session storage**
2. **Navigate to** `http://localhost:4200`
3. **Complete fast onboarding** (3 questions)
4. **Verify welcome insight appears** with "Continue to Dashboard" button
5. **Verify NO baseline panel appears** over welcome insight
6. **Click "Continue to Dashboard"**
7. **Verify baseline panel modal appears** after dashboard transition

#### Test Case 2: Control User (Control Path)
1. **Clear browser cache and session storage**
2. **Navigate to** `http://localhost:4200`
3. **Complete full onboarding** (all questions)
4. **Verify welcome insight appears** with "Continue to Dashboard" button
5. **Click "Continue to Dashboard"**
6. **Verify NO baseline panel appears** (control users don't need baseline)

### Success Criteria:
- ✅ Baseline panel appears ONLY after clicking "Continue to Dashboard"
- ✅ Baseline panel does NOT appear over the welcome insight
- ✅ Welcome insight is fully visible and interactive
- ✅ Control users see normal dashboard without baseline panel
- ✅ Test users see baseline panel after dashboard transition

### Debug Information:
- Check browser console for ON-01 logs
- Verify `currentView` transitions from 'welcome' to 'dashboard'
- Confirm baseline panel trigger only happens on dashboard view
- Baseline panel modal is now conditionally rendered within dashboard sections 