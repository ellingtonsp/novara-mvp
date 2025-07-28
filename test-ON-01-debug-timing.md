# ON-01 Debug Test - Baseline Panel Timing Issue

## Current Issue
Baseline panel modal is appearing over the welcome insight instead of after clicking "Continue to Dashboard".

## Debug Steps

### 1. Check Browser Console Logs
Open browser console and look for these specific log messages:

**Expected Logs for Correct Flow:**
```
🧪 ON-01: Setting initial view based on user status: {email: "test@test.com", baseline_completed: false, onboarding_path: "test"}
🧪 ON-01: User needs onboarding, staying on welcome
🧪 ON-01: Initialized A/B test path = test
```

**Unexpected Logs (Indicating Problem):**
```
🧪 ON-01: Baseline completion check on dashboard transition: {user: "test@test.com", onboardingPath: "test", baseline_completed: false, needsBaseline: true, currentView: "dashboard"}
🧪 ON-01: User needs baseline completion, showing panel
```

### 2. Test User Flow
1. **Clear browser cache and session storage**
2. **Open browser console** (F12 → Console tab)
3. **Navigate to** `http://localhost:4200`
4. **Complete fast onboarding** (3 questions)
5. **Watch console logs** during the process
6. **Check if baseline panel appears** over welcome insight

### 3. Check User State
In browser console, run:
```javascript
// Check current view
console.log('Current view:', document.querySelector('[data-testid="current-view"]')?.textContent);

// Check if baseline panel is visible
console.log('Baseline panel visible:', !!document.querySelector('.fixed.inset-0.bg-black\\/50'));

// Check user data in localStorage
console.log('User data:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### 4. Expected Behavior
- **Welcome View**: User sees welcome insight with "Continue to Dashboard" button
- **No Modal**: Baseline panel should NOT appear during welcome view
- **After Click**: Baseline panel should appear only after clicking "Continue to Dashboard"

### 5. Debug Information to Collect
- Console log messages and their timing
- Current view state when baseline panel appears
- User data state (baseline_completed, onboarding_path)
- Whether the issue happens on first load or after navigation

## Root Cause Analysis
The issue is likely one of:
1. **Race condition** between user data loading and view initialization
2. **Incorrect user state** (baseline_completed set to true when it should be false)
3. **View transition logic** not working correctly
4. **Baseline panel trigger** running before view is properly set 