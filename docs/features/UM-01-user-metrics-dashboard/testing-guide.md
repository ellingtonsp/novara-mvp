# Testing Guide: User Metrics Dashboard

## Test Scenarios

### Scenario 1: New User Empty State
**Setup**: Brand new user, no check-ins
**Steps**:
1. Create new user account
2. Navigate to metrics dashboard
3. Observe empty state

**Expected**:
- Beautiful empty state UI appears
- Clear benefits explanation
- "Start Your First Check-In" CTA
- No errors or mock data

### Scenario 2: Basic Metrics Calculation
**Setup**: User with 7 check-ins
**Steps**:
1. Create user with test data
2. Submit 7 daily check-ins with varied data
3. View metrics dashboard

**Expected**:
- Real calculations appear
- Medication adherence % accurate
- Check-in streak shows 7
- PHQ-4 score calculated from moods

### Scenario 3: Trend Analysis
**Setup**: User with 14+ check-ins showing improvement
**Steps**:
1. Create check-ins with improving mood pattern
2. Include medication adherence improving over time
3. View metrics trends

**Expected**:
- Trends show "improving" 
- Visual indicators (green arrows)
- Protective factors identified

### Scenario 4: Risk Factor Identification
**Setup**: User with concerning patterns
**Steps**:
1. Create check-ins with:
   - Low medication adherence (<80%)
   - High anxiety scores
   - Missed check-ins
2. View outlook tab

**Expected**:
- Risk factors clearly listed
- Lower cycle probability
- Actionable recommendations

## Automated Test Scripts

```bash
# Test empty state
node scripts/test-metrics-e2e.js

# Test with sample data
node scripts/test-user-metrics.js emily@test.com

# Performance test
node scripts/test-metrics-performance.js

# Field validation
node scripts/test-metrics-calculations.js
```

## Manual Testing Checklist

### Overview Tab
- [ ] All metrics cards display
- [ ] Progress bars accurate
- [ ] Colors match values (green/yellow/red)
- [ ] Strengths and risks listed

### Treatment Tab  
- [ ] Adherence rate calculated correctly
- [ ] Missed doses count accurate
- [ ] Research insight displayed
- [ ] Trend indicator working

### Well-being Tab
- [ ] PHQ-4 score displayed
- [ ] Mood interpretation correct
- [ ] Coping strategies listed
- [ ] Most effective strategy highlighted

### Outlook Tab
- [ ] Probability percentage shown
- [ ] Risk factors accurate
- [ ] Protective factors listed
- [ ] Research insights included

## Edge Cases

1. **No medication data**: Should show 0% gracefully
2. **Single check-in**: No trends, just current state
3. **Missing moods**: Uses default value (3)
4. **Future dates**: Ignored in calculations
5. **Duplicate dates**: Uses most recent

## Load Testing

```javascript
// Create user with 100 check-ins
// Measure response time
// Target: <2 seconds
// Fail: >5 seconds
```

## Integration Tests

1. **Auth flow**: Metrics require valid token
2. **Data freshness**: Updates after new check-in
3. **Tab switching**: State preserved
4. **Refresh**: Data reloads correctly

## Regression Tests

Ensure these still work:
- Daily check-in submission
- User authentication
- Dashboard navigation
- Insights display