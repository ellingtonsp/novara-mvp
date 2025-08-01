# BUG-004: PHQ-4 Incorrectly Triggered by "Want to share more details?"

**Priority**: 🔴 Large  
**Status**: ✅ Resolved  
**Reported**: 2025-08-01  
**Reporter**: @stephen  
**Component**: Check-in Flow/User Journey  

## Description
When users click "Want to share more details?" after completing the Quick Daily Check-in, they are incorrectly presented with the PHQ-4 (Quick Mental Health Check-in) form instead of the Enhanced Daily Check-in form. PHQ-4 should be a separate flow triggered on its own schedule.

## Screenshots
- Shows PHQ-4 form (Question 1 of 4) appearing after clicking "Want to share more details?"
- PHQ-4 asks about mental health over the last 2 weeks

## Steps to Reproduce
1. Complete Quick Daily Check-in:
   - Select mood
   - Select medication status
   - Set confidence level
2. Click "Complete Quick Check-in"
3. Click "Want to share more details?" link
4. Observe: PHQ-4 form appears instead of Enhanced Daily Check-in

## Expected Behavior
- "Want to share more details?" should navigate to Enhanced Daily Check-in form
- Enhanced form should include additional daily tracking questions
- PHQ-4 should be triggered separately:
  - Once immediately after onboarding completion
  - Then biweekly thereafter
  - As its own distinct flow, not part of daily check-ins

## Actual Behavior
- PHQ-4 form appears when expecting enhanced check-in
- Mental health assessment mixed with daily tracking flow
- Confuses the user journey and data collection

## Technical Details
- Affects: Check-in flow navigation
- Components involved:
  - `/frontend/src/components/QuickDailyCheckinForm.tsx`
  - `/frontend/src/components/EnhancedDailyCheckinForm.tsx`
  - `/frontend/src/components/PHQ4Assessment.tsx`
- Navigation/routing logic needs correction

## Impact
- **High severity**: Breaks intended user flow
- Prevents users from accessing enhanced daily tracking
- May result in PHQ-4 being completed too frequently
- Confuses mental health assessment schedule
- Affects data integrity for both daily tracking and mental health monitoring

## Business Logic Requirements
1. **Daily Check-in Flow**:
   - Quick Daily Check-in → Option for Enhanced Daily Check-in
   - No PHQ-4 in this flow

2. **PHQ-4 Schedule**:
   - Triggered once after onboarding
   - Then every 2 weeks
   - Separate from daily check-ins
   - Should have its own entry point/notification

## Suggested Fix
1. Update navigation logic for "Want to share more details?"
2. Route to EnhancedDailyCheckinForm instead of PHQ4Assessment
3. Implement separate PHQ-4 scheduling logic
4. Add PHQ-4 tracking to prevent over-administration
5. Create distinct entry points for PHQ-4 (e.g., dashboard prompt, notification)

## Related Issues
- May affect mental health data accuracy
- Could impact user engagement if PHQ-4 appears too frequently
- Related to overall check-in flow architecture

## Resolution
**Date Resolved**: 2025-08-01
**Solution**: Removed PHQ-4 assessment from Enhanced Daily Check-in flow

### Technical Details
The issue was caused by the EnhancedDailyCheckinForm component automatically checking if PHQ-4 was due and showing it as the first step. This was incorrect behavior that mixed mental health assessments with daily tracking.

**Changes Made**:
1. Removed `showPHQ4` state variable and related logic
2. Removed useEffect that checked PHQ-4 due dates
3. Removed conditional rendering that showed PHQ-4 as first step
4. Removed PHQ-4 imports and completion handlers
5. Fixed step count to always be 4 steps (not conditional)

### Files Modified
- `/frontend/src/components/EnhancedDailyCheckinForm.tsx` - Removed all PHQ-4 related code

### Next Steps
Created user story MH-01 for implementing proper PHQ-4 scheduling as a separate feature. PHQ-4 should have its own entry points and scheduling system, not be embedded in daily check-in flows.

### Testing Confirmation
- Verified locally that "Want to share more details?" now correctly shows Enhanced Daily Check-in
- Confirmed PHQ-4 no longer appears in the daily check-in flow
- User confirmed fix is working as expected