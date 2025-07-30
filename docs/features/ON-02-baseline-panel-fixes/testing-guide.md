# Testing Guide: Baseline Panel Fixes

## Test Scenarios

### Scenario 1: New User Fast Onboarding
**Steps:**
1. Sign up with new email via fast onboarding
2. Land on dashboard
3. Observe baseline panel appears
4. Complete all fields and submit

**Expected:**
- Panel closes without page reload
- User data updates in UI immediately
- Panel doesn't reappear on navigation

### Scenario 2: Dismissal Persistence
**Steps:**
1. Sign up with new email via fast onboarding
2. Dismiss baseline panel with X button
3. Navigate to check-ins tab
4. Return to dashboard

**Expected:**
- Panel remains dismissed
- Dismissal persists across page refreshes

### Scenario 3: Complete Profile Button
**Steps:**
1. Create user with fast onboarding
2. Dismiss baseline panel
3. Navigate to check-ins
4. Click "Complete Profile"
5. Fill form and submit

**Expected:**
- Profile updates successfully
- Return to dashboard without panel

### Scenario 4: Existing User Detection
**Steps:**
1. Create user with full onboarding (control path)
2. Log in again

**Expected:**
- No baseline panel shown (not test path)

## Automated Test Scripts
```bash
# Test baseline persistence
node scripts/test-baseline-persistence.js

# Test complete update flow
node scripts/test-baseline-update-e2e.js

# Test fast onboarding flow
node scripts/test-fast-onboarding-flow.js

# Diagnose specific user state
node scripts/diagnose-user-state.js <email>
```

## Manual Testing Checklist
- [ ] Fast onboarding → baseline panel appears
- [ ] Complete baseline → panel doesn't reappear
- [ ] Dismiss panel → stays dismissed
- [ ] Navigate away and back → panel state preserved
- [ ] Complete via button → no panel on return
- [ ] Refresh page → state maintained
- [ ] Different browser → fresh state
- [ ] Network error → graceful handling

## Edge Cases to Test
1. **Double submission**: Rapid clicks on submit
2. **Network timeout**: Slow connection handling
3. **Invalid data**: Missing required fields
4. **Concurrent tabs**: Multiple windows open
5. **Dev hot reload**: State preservation

## Regression Tests
Ensure these still work:
- Standard onboarding flow (control path)
- User authentication
- Daily check-ins
- Navigation between views