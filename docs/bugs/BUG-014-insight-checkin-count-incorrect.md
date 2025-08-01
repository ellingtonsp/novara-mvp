# BUG-014: Daily Insight Shows Incorrect Check-in Count

**Priority**: 🟡 Medium  
**Status**: 🔄 Open  
**Reported**: 2025-08-01  
**Reporter**: @stephen  
**Component**: Daily Insights Display  

## Description
The Daily Insight modal displays an incorrect check-in count immediately after completing a check-in. The "Based on your data" section shows a blank or incorrect number of "check-ins analyzed" when it should reflect the actual count including the just-completed check-in.

## Screenshots
- Shows Daily Insight with "check-ins analyzed" (no number shown)
- Displayed immediately after completing a check-in
- Should show actual count (e.g., "2 check-ins analyzed")

## Steps to Reproduce
1. Complete a daily check-in
2. View the generated Daily Insight
3. Look at "Based on your data:" section
4. Notice missing or incorrect check-in count

## Expected Behavior
- Should show correct count: "X check-ins analyzed"
- Count should include the just-completed check-in
- Number should be visible and accurate
- Example: "2 check-ins analyzed" after second check-in

## Actual Behavior
- Shows "check-ins analyzed" without a number
- Or shows incorrect/outdated count
- Doesn't reflect the just-completed check-in
- Makes insight seem based on no data

## Technical Details
- Component: DailyInsightsDisplay
- Issue with data fetching or state management
- May be race condition between check-in save and insight generation
- Count calculation may happen before database update completes

## Possible Root Cause
1. Insight generated before check-in fully saved
2. Frontend cache not updated after check-in
3. API response missing check-in count
4. State management issue in React component
5. Database query timing issue

## Impact
- Reduces trust in insights accuracy
- Makes insights seem disconnected from user data
- Confusing user experience
- May make users think check-in didn't save

## Suggested Fix
1. Ensure check-in is fully saved before generating insight
2. Include check-in count in insight API response
3. Force refresh of check-in count after submission
4. Add loading state to prevent premature display
5. Verify database transaction completes before insight query

## Related Issues
- May be related to BUG-009 (EDC not saving)
- Could affect insight quality perception
- Related to overall data consistency