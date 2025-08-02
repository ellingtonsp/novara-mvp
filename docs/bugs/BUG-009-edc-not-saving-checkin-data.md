# BUG-009: Enhanced Daily Check-in Not Registering as Completed

**Priority**: 🔴 Large  
**Status**: 🔄 Open  
**Reported**: 2025-08-01  
**Reporter**: @stephen  
**Component**: Data Persistence/Check-in Flow  

## Description
After completing the Enhanced Daily Check-in (EDC), the system does not recognize it as a completed daily check-in. When users return to the check-in tab, they are prompted to complete a new daily check-in rather than being shown their existing check-in or an edit option. This indicates the EDC data is not being properly stored in the database.

## Steps to Reproduce
1. Navigate to check-in tab
2. Complete Quick Daily Check-in
3. Click "Want to share more details?"
4. Complete Enhanced Daily Check-in (all 4 steps)
5. Return to home or navigate away
6. Go back to check-in tab
7. Observe: Prompted to complete daily check-in again

## Expected Behavior
- EDC completion should register as a completed daily check-in
- Check-in tab should show:
  - "You've already checked in today" message
  - Option to view or edit today's check-in
  - Today's check-in data should be saved
- Both Quick and Enhanced check-ins should count as daily completion

## Actual Behavior
- EDC data appears to not be saved
- System doesn't recognize check-in as complete
- Users can seemingly do unlimited check-ins
- No persistence of EDC data

## Technical Details
- Critical data flow issue
- Components involved:
  - `/frontend/src/components/EnhancedDailyCheckinForm.tsx`
  - `/backend/routes/checkins.js`
  - Database daily_checkins table
- API endpoint may not be called or failing

## Possible Root Cause
1. EDC form not calling the save API endpoint
2. API endpoint failing silently
3. Different endpoint used for EDC vs Quick check-in
4. Frontend not properly handling save response
5. Database transaction not committing

## Impact
- **Critical**: User data loss
- Users lose detailed check-in information
- Breaks core app functionality
- Affects data integrity for insights
- Users may abandon app due to lost data

## Database Investigation Needed
- Check if EDC data exists in daily_checkins table
- Verify API logs for check-in POST requests
- Look for failed transactions
- Compare Quick vs Enhanced check-in save logic

## Testing Requirements
1. Monitor network tab during EDC submission
2. Check for API errors in console
3. Verify database entries after EDC
4. Test both Quick → Enhanced flow and direct Enhanced

## Suggested Fix
1. Add console logging to track EDC submission
2. Verify API endpoint is called on form completion
3. Check API response handling
4. Ensure proper error handling and user feedback
5. Add success confirmation after save
6. Implement proper check-in status checking

## Related Issues
- Related to BUG-004 (PHQ-4 flow issues)
- May affect daily streak calculations
- Could impact insight generation