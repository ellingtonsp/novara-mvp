# BUG-012: Missing Daily Check-in Style Preference Toggle

**Priority**: 🟡 Medium  
**Status**: ✅ Resolved  
**Reported**: 2025-08-01  
**Reporter**: @stephen  
**Component**: User Settings/Preferences  

## Description
The option for users to change their preferred daily check-in style (Quick vs Enhanced) is no longer visible or accessible in the app. Users should be able to toggle between check-in preferences but this functionality appears to be missing.

## Expected Behavior
- Users should see a toggle or setting to choose preferred check-in style:
  - Quick Daily Check-in (30 seconds)
  - Enhanced Daily Check-in (more detailed)
- This preference should be accessible from:
  - User profile/settings
  - Or after completing a check-in
  - Or on the check-in tab
- User's preference should persist across sessions

## Actual Behavior
- No visible option to change check-in preference
- Users stuck with default check-in style
- No way to switch between Quick and Enhanced as default
- Missing user customization feature

## Technical Details
- Component likely missing: CheckinPreferenceToggle
- File: `/frontend/src/components/CheckinPreferenceToggle.tsx` (exists but not rendered?)
- Need to verify where this should be displayed
- Check if component is conditionally hidden

## Possible Root Cause
1. Component not imported/rendered in parent component
2. Conditional rendering hiding the toggle
3. Feature flag or A/B test hiding it
4. Removed during recent refactoring
5. Hidden behind onboarding completion state

## Impact
- Reduces user control over their experience
- Forces users into one check-in style
- May reduce engagement if users prefer different style
- Missing personalization feature

## Previous Implementation
- Check git history for when this was last visible
- Verify if this was intentionally removed
- Look for related feature flags

## Suggested Fix
1. Locate where CheckinPreferenceToggle should be rendered
2. Common locations to check:
   - User profile/settings page
   - Check-in success screen
   - Check-in tab header
   - App settings menu
3. Ensure component is properly imported and rendered
4. Verify user preference is saved and retrieved correctly

## Related Issues
- May be related to onboarding flow changes
- Could be affected by A/B testing (ON-01)
- Check if this is intentionally hidden for new users

## User Story Impact
Users who prefer quick check-ins are forced to see "Want more details?" prompt, while users who prefer detailed tracking have to click through extra steps each time.

## Resolution
**Date**: 2025-08-01
**Fixed by**: @assistant

### Solution Summary
Fixed the CheckinPreferenceToggle visibility logic to ensure it's always visible for users who have completed at least one check-in. The toggle was being hidden due to complex conditional logic that required 3+ check-ins and other conditions.

### Technical Details
1. Simplified the visibility logic in CheckinPreferenceToggle component
2. Changed from requiring 3 check-ins to showing toggle after 1 check-in
3. Always show subtle preference button for users with existing check-ins
4. Maintained the full preference card display after 3 check-ins

### Files Modified
- `/frontend/src/components/CheckinPreferenceToggle.tsx` - Updated visibility logic to show toggle for users with 1+ check-ins