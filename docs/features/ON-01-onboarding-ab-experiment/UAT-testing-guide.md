# ON-01 UAT Testing Guide

## 🎯 User Acceptance Testing (UAT) Requirements

**Feature**: ON-01 — Onboarding AB Experiment (Fast Lane vs. Control)  
**Status**: Ready for UAT Validation  
**Required Before**: Production Deployment  

## 📋 UAT Prerequisites

### Environment Setup
```bash
# 1. Ensure stable development environment
./scripts/start-dev-stable.sh

# 2. Verify backend is running on port 9002
curl http://localhost:9002/api/health

# 3. Verify frontend is running on port 4200
curl http://localhost:4200
```

### Test Data Requirements
- Clean SQLite database: `backend/data/novara-local.db`
- No existing test users with conflicting emails
- Fresh browser session for each test

## 🧪 UAT Test Scenarios

### Test Scenario 1: A/B Test Distribution Validation
**Objective**: Verify 50/50 split works correctly across multiple sessions

**Steps**:
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:4200`
3. Note which onboarding path appears (Fast Lane vs. Control)
4. Close browser completely
5. Repeat steps 1-4 for **10 iterations**
6. Record results: Fast Lane count vs. Control count

**Expected Result**: 
- Distribution should be roughly 50/50 (40-60% range acceptable)
- Each session should be consistent (same path if refreshed)

**Acceptance Criteria**: 
- ✅ Distribution within 40-60% range
- ✅ Session consistency maintained
- ✅ No errors in browser console

---

### Test Scenario 2: Fast Lane (Test Path) User Journey
**Objective**: Validate complete fast onboarding flow

**Steps**:
1. Force test path: Set `VITE_FORCE_ONBOARDING_PATH=test` in frontend .env
2. Navigate to `http://localhost:4200`
3. Verify Fast Lane form appears (3 fields only)
4. Complete Fast Lane form:
   - Email: `uat-fastlane-{timestamp}@test.com`
   - Cycle Stage: Select "IVF Prep"
   - Primary Concern: Select "Medical Clarity"
5. Submit form
6. Verify Baseline Panel appears
7. Complete Baseline Panel:
   - Nickname: "FastLaneUser"
   - Confidence scores: 7, 6, 8
   - Top concern: "Financial stress"
8. Submit baseline
9. Verify user reaches main app (insights available)

**Expected Result**:
- Fast Lane form shows only 3 essential fields
- Baseline Panel appears after Fast Lane completion
- User can access insights after baseline completion

**Acceptance Criteria**:
- ✅ Fast Lane form displays correctly
- ✅ Baseline Panel appears after submission
- ✅ User data saved correctly in database
- ✅ Insights accessible after completion

---

### Test Scenario 3: Control Path User Journey
**Objective**: Validate standard onboarding flow

**Steps**:
1. Force control path: Set `VITE_FORCE_ONBOARDING_PATH=control` in frontend .env
2. Navigate to `http://localhost:4200`
3. Verify full onboarding form appears (all fields)
4. Complete full onboarding form:
   - Email: `uat-control-{timestamp}@test.com`
   - Nickname: "ControlUser"
   - Confidence scores: 8, 7, 9
   - Primary need: "Emotional Support"
   - Cycle stage: "IVF Prep"
   - Top concern: "Medication side effects"
5. Submit form
6. Verify user reaches main app directly (no baseline panel)

**Expected Result**:
- Full onboarding form displays all fields
- No baseline panel appears after submission
- User can access insights immediately

**Acceptance Criteria**:
- ✅ Full onboarding form displays correctly
- ✅ No baseline panel appears
- ✅ User data saved correctly
- ✅ Insights accessible immediately

---

### Test Scenario 4: Insights Blocking Validation
**Objective**: Verify incomplete users are blocked from insights

**Steps**:
1. Create incomplete test user:
   - Force test path
   - Complete Fast Lane form only
   - **DO NOT** complete baseline panel
   - Close browser
2. Navigate to `http://localhost:4200`
3. Try to access insights page
4. Verify blocking message appears

**Expected Result**:
- Incomplete users see blocking message
- Cannot access insights until baseline completed

**Acceptance Criteria**:
- ✅ Blocking message displayed
- ✅ Insights not accessible
- ✅ Clear guidance to complete baseline

---

### Test Scenario 5: Database Validation
**Objective**: Verify data persistence and schema

**Steps**:
1. Complete both test scenarios (Fast Lane + Control)
2. Check database records:
```bash
sqlite3 backend/data/novara-local.db "
SELECT email, onboarding_path, baseline_completed, nickname 
FROM users 
WHERE email LIKE '%uat-%'
ORDER BY created_at DESC
LIMIT 5;"
```

**Expected Result**:
- Test path users: `onboarding_path='test'`, `baseline_completed=1`
- Control path users: `onboarding_path='control'`, `baseline_completed=0`
- All required fields populated correctly

**Acceptance Criteria**:
- ✅ Database schema supports all fields
- ✅ Data persistence working correctly
- ✅ Boolean conversion working (baseline_completed as integer)

---

### Test Scenario 6: Analytics Tracking Validation
**Objective**: Verify PostHog events are tracked correctly

**Steps**:
1. Open browser developer tools
2. Navigate to Network tab
3. Complete Fast Lane journey
4. Check for PostHog events:
   - `onboarding_path_selected`
   - `onboarding_completed`
   - `baseline_completed`

**Expected Result**:
- All required events tracked
- Correct event properties included

**Acceptance Criteria**:
- ✅ Events tracked in PostHog
- ✅ Correct event properties
- ✅ No duplicate events

## 📊 UAT Success Criteria

### Minimum Requirements (Must Pass)
- [ ] A/B test distribution within 40-60% range
- [ ] Fast Lane journey completes successfully
- [ ] Control path journey completes successfully
- [ ] Insights blocking works for incomplete users
- [ ] Database persistence working correctly
- [ ] No console errors in browser

### Production Readiness (All Must Pass)
- [ ] All minimum requirements met
- [ ] Analytics tracking working
- [ ] Session consistency maintained
- [ ] No data loss or corruption
- [ ] Performance acceptable (<2s response times)

## 🚨 UAT Failure Resolution

### If A/B Distribution Fails
1. Check `abTestUtils.ts` session ID generation
2. Verify deterministic logic
3. Test with larger sample size

### If Baseline Completion Fails
1. Check database schema
2. Verify API endpoint functionality
3. Test boolean conversion logic

### If Insights Blocking Fails
1. Check user completion logic
2. Verify blocking middleware
3. Test with incomplete user data

## 📝 UAT Reporting

### Required Documentation
1. **Test Results Summary**: Pass/fail for each scenario
2. **Distribution Analysis**: Actual vs. expected A/B split
3. **Error Log**: Any issues encountered and resolutions
4. **Performance Metrics**: Response times and load times
5. **Database Validation**: Schema and data integrity check

### UAT Completion Checklist
- [ ] All test scenarios executed
- [ ] Results documented
- [ ] Issues resolved or documented
- [ ] Performance acceptable
- [ ] Ready for staging deployment

## 🎯 Next Steps After UAT

### If UAT Passes
1. Update feature status to "UAT Complete"
2. Create staging deployment plan
3. Schedule production deployment
4. Update roadmap status

### If UAT Fails
1. Document specific failures
2. Create fix plan
3. Implement fixes
4. Re-run UAT
5. Repeat until all criteria pass

---

**UAT Status**: 🔄 **PENDING**  
**Last Updated**: July 27, 2025  
**Next Review**: After UAT completion

## 🚨 CRITICAL FIX APPLIED (July 27, 2025)

### Issue Resolved
- **CORS Error**: `Method PATCH is not allowed by Access-Control-Allow-Methods`
- **Baseline Completion**: Users couldn't complete baseline due to CORS blocking

### Fix Applied
- Added `PATCH` method to CORS configuration in `backend/server.js`
- Restarted backend server to apply changes
- Verified fix with automated test: `test-ON-01-uat-baseline-fix.js`

### Verification
✅ Baseline completion now works correctly  
✅ Users can access insights after baseline completion  
✅ CORS preflight requests for PATCH method succeed  

**Status**: ✅ **READY FOR UAT RETESTING** 