# ON-01 A/B Test Comprehensive Test Script

## 🎯 **Test Objective**
Verify that the PostHog feature flag A/B test for onboarding paths is working correctly according to the ON-01 specification.

## 📋 **Test Setup**

### **Environment Variables**
```bash
# Frontend (.env.development)
VITE_AB_TEST_ENABLED=true
VITE_DEBUG_AB_TEST=true
VITE_FORCE_ONBOARDING_PATH=test  # For testing specific paths
```

### **PostHog Feature Flag**
- **Flag Name**: `fast_onboarding_v1`
- **Rollout**: 50% (should be configured in PostHog dashboard)

## 🧪 **Test Scenarios**

### **Test 1: Feature Flag Logic**
**Objective**: Verify 50/50 split and path selection

**Steps**:
1. Clear browser session storage
2. Visit `http://localhost:4200`
3. Click "Start Your Journey"
4. Check console for A/B test debug logs
5. Verify path selection (control vs test)

**Expected Results**:
- Console shows: `🧪 A/B Test: PostHog fast_onboarding_v1 = true/false`
- Path should be either 'control' or 'test'
- Event tracked: `onboarding_path_selected`

### **Test 2: Control Path (6-question onboarding)**
**Objective**: Verify standard onboarding flow

**Steps**:
1. Force control path: `VITE_FORCE_ONBOARDING_PATH=control`
2. Complete full onboarding form
3. Submit and verify user creation
4. Check database for `onboarding_path: 'control'` and `baseline_completed: true`

**Expected Results**:
- Full 6-question form displayed
- User created with complete baseline data
- No Baseline Panel shown after check-in
- Event tracked: `onboarding_completed` with path='control'

### **Test 3: Test Path (3-question Fast Lane)**
**Objective**: Verify Fast Lane onboarding flow

**Steps**:
1. Force test path: `VITE_FORCE_ONBOARDING_PATH=test`
2. Complete Fast Lane form (email, cycle_stage, primary_concern)
3. Submit and verify user creation
4. Check database for `onboarding_path: 'test'` and `baseline_completed: false`

**Expected Results**:
- Fast Lane form with only 3 fields
- User created with partial baseline data
- Baseline Panel appears after first check-in
- Event tracked: `onboarding_completed` with path='test'

### **Test 4: Baseline Panel Completion**
**Objective**: Verify Baseline Panel blocks insights until completed

**Steps**:
1. Complete Fast Lane onboarding (test path)
2. Submit first check-in
3. Verify Baseline Panel appears
4. Complete remaining 3 questions (nickname, confidence_meds, confidence_costs)
5. Verify insights are now accessible

**Expected Results**:
- Baseline Panel blocks insight access
- Panel shows remaining 3 questions
- After completion, `baseline_completed: true` in database
- Event tracked: `baseline_completed`
- Insights become accessible

### **Test 5: Analytics Events**
**Objective**: Verify all required events are tracked

**Steps**:
1. Complete both control and test paths
2. Check PostHog dashboard for events

**Expected Events**:
- `onboarding_path_selected` { path: 'control' | 'test' }
- `onboarding_completed` { path, completion_ms }
- `baseline_completed` { completion_ms } (test path only)

### **Test 6: Database Schema**
**Objective**: Verify database fields are properly set

**SQLite Query**:
```sql
SELECT email, onboarding_path, baseline_completed, 
       confidence_meds, confidence_costs, confidence_overall
FROM users 
WHERE email LIKE '%test%'
ORDER BY created_at DESC;
```

**Expected Results**:
- Control users: `baseline_completed = 1`, full confidence data
- Test users: `baseline_completed = 0` initially, updated to `1` after panel

## 🔧 **Manual Testing Commands**

### **Test Control Path**
```bash
# Set environment
export VITE_FORCE_ONBOARDING_PATH=control
export VITE_DEBUG_AB_TEST=true

# Start development
./scripts/start-dev-stable.sh

# Test user creation
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-control@example.com",
    "nickname": "TestControl",
    "confidence_meds": 7,
    "confidence_costs": 6,
    "confidence_overall": 8,
    "primary_need": "medical_clarity",
    "cycle_stage": "ivf_prep",
    "onboarding_path": "control",
    "baseline_completed": true
  }'
```

### **Test Fast Lane Path**
```bash
# Set environment
export VITE_FORCE_ONBOARDING_PATH=test
export VITE_DEBUG_AB_TEST=true

# Test user creation
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-fast@example.com",
    "nickname": "TestFast",
    "confidence_meds": 5,
    "confidence_costs": 5,
    "confidence_overall": 5,
    "primary_need": "emotional_support",
    "cycle_stage": "ivf_prep",
    "onboarding_path": "test",
    "baseline_completed": false
  }'
```

### **Test Baseline Panel Update**
```bash
# Update baseline completion
curl -X PATCH http://localhost:9002/api/users/baseline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "UpdatedNickname",
    "confidence_meds": 8,
    "confidence_costs": 7,
    "confidence_overall": 9,
    "baseline_completed": true
  }'
```

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ Feature flag determines path (50/50 split)
- ✅ Control path shows 6-question form
- ✅ Test path shows 3-question Fast Lane
- ✅ Baseline Panel blocks insights for test users
- ✅ All analytics events tracked correctly
- ✅ Database fields properly set and updated

### **Performance Requirements**
- ✅ Onboarding completion ≥82% for test path
- ✅ Baseline completion rate ≥90% for test path
- ✅ No significant performance degradation

### **User Experience**
- ✅ Smooth transition between paths
- ✅ Clear messaging in Baseline Panel
- ✅ No broken flows or dead ends
- ✅ Proper error handling

## 🐛 **Known Issues & Workarounds**

### **Issue 1: PostHog Not Available in Development**
**Workaround**: Use `VITE_FORCE_ONBOARDING_PATH` for testing

### **Issue 2: Database Schema Mismatch**
**Workaround**: Ensure SQLite schema includes `onboarding_path` and `baseline_completed` fields

### **Issue 3: Analytics Events Not Showing**
**Workaround**: Check PostHog dashboard configuration and API key

## 📝 **Test Results Template**

```
Test Date: ___________
Tester: ___________

Test 1 - Feature Flag Logic: ✅/❌
Test 2 - Control Path: ✅/❌  
Test 3 - Test Path: ✅/❌
Test 4 - Baseline Panel: ✅/❌
Test 5 - Analytics Events: ✅/❌
Test 6 - Database Schema: ✅/❌

Issues Found:
- 

Recommendations:
- 

Overall Status: ✅ PASS / ❌ FAIL
```

## 🚀 **Next Steps After Testing**

1. **Deploy to Staging**: Test with real PostHog feature flag
2. **Monitor Analytics**: Track conversion rates and completion rates
3. **Gather Feedback**: Collect user feedback on both paths
4. **Optimize**: Make adjustments based on data and feedback
5. **Production Rollout**: Gradually roll out to production users 