# Staging UAT Checklist

## Pre-Deployment Verification
- [ ] Frontend deployed successfully
- [ ] Backend deployed successfully  
- [ ] Database migrations applied (medication_taken field)
- [ ] Environment variables confirmed

## Functional Testing

### 1. Medication Tracking Feature
- [ ] Login as test user
- [ ] Complete a daily check-in WITH medication tracking
- [ ] Select "Yes" for medication taken
- [ ] Select "No" for medication taken
- [ ] Skip medication tracking
- [ ] Verify data saves correctly

### 2. Metrics Dashboard
- [ ] Navigate to dashboard
- [ ] Verify NO 500 errors in console
- [ ] Check medication adherence shows dots correctly
- [ ] Verify engagement score shows real percentage
- [ ] Confirm tooltips work on all metrics
- [ ] Test swipe navigation on mobile

### 3. Timezone Fix
- [ ] Complete check-in at different times
- [ ] Verify date uses LOCAL timezone (not GMT)
- [ ] Check that daily check-in persistence works
- [ ] Confirm "already checked in today" appears correctly

### 4. Data Validation
- [ ] Check backend logs for errors
- [ ] Verify Airtable records have correct dates
- [ ] Confirm medication_taken field is populated
- [ ] Check metrics calculations are accurate

## Performance Testing
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] Mobile responsiveness works
- [ ] API response times < 2s

## Edge Cases
- [ ] New user experience (no check-ins)
- [ ] User with 1-2 check-ins (under threshold)
- [ ] User with 3+ medication check-ins
- [ ] Browser refresh maintains state

## Regression Testing
- [ ] Existing features still work
- [ ] Login/logout functions
- [ ] Daily check-in form submits
- [ ] Insights display correctly

## Sign-off
- [ ] All critical features tested
- [ ] No blocking bugs found
- [ ] Performance acceptable
- [ ] Ready for production

Date: ___________
Tested by: ___________