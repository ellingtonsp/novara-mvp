# Time Simulation Testing Framework - Testing Scenarios

## 🎯 **Comprehensive Test Scenarios**

This document outlines all test scenarios covered by the Time Simulation Testing Framework, including expected outcomes, validation criteria, and edge cases.

## 📋 **Question Rotation Test Scenarios**

### **Scenario QR-001: IVF Journey Progression**

**Objective**: Verify questions adapt correctly as users progress through complete IVF cycle stages.

**Test Setup**:
```javascript
const user = TestUserFactory.createNewUser();
const simulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
simulator.start();
```

**Test Steps**:
1. **Week 1-2: Considering IVF**
   - Expected Question: `medication_readiness_today`
   - Expected Context: `medication_preparation`
   - Validation: User gets preparation-focused questions

2. **Week 3-6: IVF Preparation**
   - Update: `user.cycle_stage = 'ivf_prep'`
   - Expected Question: `medication_readiness_today`
   - Expected Context: `medication_preparation`
   - Validation: Continued preparation focus with enhanced detail

3. **Week 7-8: Stimulation Phase**
   - Update: `user.cycle_stage = 'stimulation'`
   - Expected Question: `medication_confidence_today`
   - Expected Context: `medication_active`
   - Validation: Active treatment questions appear

4. **Week 9: Retrieval**
   - Update: `user.cycle_stage = 'retrieval'`
   - Expected Question: `medication_confidence_today`
   - Expected Context: `medication_active`
   - Validation: Retrieval-specific medication support

5. **Week 10: Transfer**
   - Update: `user.cycle_stage = 'transfer'`
   - Expected Question: `medication_confidence_today`
   - Expected Context: `medication_active`
   - Validation: Transfer medication confidence tracking

6. **Week 11-12: Two Week Wait**
   - Update: `user.cycle_stage = 'tww'`
   - Expected Question: `medication_confidence_today`
   - Expected Context: `medication_active`
   - Validation: Support medication questions during wait

7. **Week 13+: Pregnancy**
   - Update: `user.cycle_stage = 'pregnant'`
   - Expected Question: `pregnancy_medication_confidence`
   - Expected Context: `pregnancy_medications`
   - Validation: Pregnancy-specific medication questions

**Success Criteria**:
- ✅ Each stage triggers appropriate medication question
- ✅ Question context matches stage requirements
- ✅ No inappropriate questions for cycle stage
- ✅ Smooth transitions between stages

---

### **Scenario QR-002: Confidence-Based Question Adaptation**

**Objective**: Validate that follow-up questions adapt based on confidence levels.

**Test Matrix**:
| Confidence Level | Expected Follow-up Question | Expected Context |
|------------------|----------------------------|------------------|
| 1-2 (Critical) | `medication_emergency_check` | `emergency_check` |
| 3-4 (Low) | `medication_concern_today` | `medication_focus` |
| 5-6 (Medium) | `medication_momentum` | `medication_check` |
| 7-8 (High) | `medication_momentum` | `medication_check` |
| 9-10 (Excellent) | `medication_momentum` | `medication_check` |

**Test Implementation**:
```javascript
const confidenceLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

confidenceLevels.forEach(confidence => {
  user.confidence_meds = confidence;
  const questions = generateQuestionsForUser(user);
  
  if (confidence <= 2) {
    expect(questions.find(q => q.id === 'medication_emergency_check')).toBeDefined();
  } else if (confidence <= 4) {
    expect(questions.find(q => q.id === 'medication_concern_today')).toBeDefined();
  } else {
    expect(questions.find(q => q.id === 'medication_momentum')).toBeDefined();
  }
});
```

**Success Criteria**:
- ✅ Emergency questions trigger for confidence ≤2
- ✅ Support questions trigger for confidence 3-4
- ✅ Momentum questions trigger for confidence ≥5
- ✅ Question priority reflects urgency level

---

### **Scenario QR-003: Cycle Stage Update Prompts**

**Objective**: Test cycle stage update prompts for long-term users.

**Test Setup**:
```javascript
const user = TestUserFactory.createStimulationUser();
user.created_at = '2024-12-01T00:00:00.000Z'; // 30+ days ago
simulator.setDate('2025-01-01T00:00:00.000Z');
```

**Test Cases**:
1. **Old Account in Fast-Changing Stage**
   - Stages: `stimulation`, `retrieval`, `transfer`, `tww`
   - Expected: Cycle stage update question appears
   - Priority: 2.7 (high priority)

2. **Old Account in Stable Stage**
   - Stages: `considering`, `ivf_prep`, `pregnant`, `between_cycles`
   - Expected: No update prompt for stable stages
   - Validation: Update questions don't appear unnecessarily

3. **New Account in Any Stage**
   - Account age: <30 days
   - Expected: No update prompts for recent accounts
   - Validation: Fresh accounts don't get update questions

**Success Criteria**:
- ✅ Update prompts appear for appropriate stage/age combinations
- ✅ Update prompts don't appear for stable or new accounts
- ✅ Update questions have correct priority and options

---

## 📈 **Streak Functionality Test Scenarios**

### **Scenario SF-001: Basic Streak Building**

**Objective**: Validate consecutive day streak calculation.

**Test Implementation**:
```javascript
const user = TestUserFactory.createUser();
const checkins = [];

// Build 14-day consecutive streak
for (let day = 1; day <= 14; day++) {
  simulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
  checkins.push(MockCheckinFactory.createCheckin(user, {
    date_submitted: simulator.getCurrentDateString(),
    created_at: simulator.getCurrentISO()
  }));
}

const streak = calculateCurrentStreak(user.id, checkins);
```

**Test Cases**:
- Day 1: Current = 1, Longest = 1
- Day 7: Current = 7, Longest = 7
- Day 14: Current = 14, Longest = 14

**Success Criteria**:
- ✅ Current streak increments daily
- ✅ Longest streak tracks maximum achieved
- ✅ Streak calculation handles date progression correctly

---

### **Scenario SF-002: Streak Reset and Recovery**

**Objective**: Test streak reset behavior after missed days.

**Test Sequence**:
1. Build 10-day streak (Days 1-10)
2. Skip Day 11 (breaks streak)
3. Resume Day 12 (starts new streak)
4. Continue Days 13-15

**Expected Results**:
- Day 10: Current = 10, Longest = 10
- Day 11: No check-in (streak broken)
- Day 12: Current = 1, Longest = 10
- Day 15: Current = 4, Longest = 10

**Success Criteria**:
- ✅ Streak resets to 0 after missed day
- ✅ Longest streak preserves previous best
- ✅ New streak starts correctly after break
- ✅ Recovery tracking identifies rebuild pattern

---

### **Scenario SF-003: Multiple Check-ins Per Day**

**Objective**: Verify multiple same-day check-ins count as single day.

**Test Implementation**:
```javascript
simulator.setDate('2025-01-01T09:00:00.000Z');

// First check-in
checkins.push(MockCheckinFactory.createCheckin(user, {
  date_submitted: simulator.getCurrentDateString(),
  created_at: simulator.getCurrentISO()
}));

// Second check-in same day (6 hours later)
simulator.advanceTime({ hours: 6 });
checkins.push(MockCheckinFactory.createCheckin(user, {
  date_submitted: simulator.getCurrentDateString(),
  created_at: simulator.getCurrentISO()
}));

const streak = calculateCurrentStreak(user.id, checkins);
expect(streak.current).toBe(1); // Should be 1, not 2
```

**Success Criteria**:
- ✅ Multiple same-day check-ins count as 1 streak day
- ✅ Unique date calculation works correctly
- ✅ Timestamp differences don't affect date grouping

---

### **Scenario SF-004: Milestone Detection**

**Objective**: Test milestone achievement recognition.

**Test Matrix**:
| Streak Length | Expected Milestone | Message Pattern |
|---------------|-------------------|-----------------|
| 7 | `first_week` | "First week complete!" |
| 14 | `two_weeks` | "Two weeks strong!" |
| 30 | `one_month` | "One month champion!" |
| 50 | `fifty_days` | "Fifty days incredible!" |
| 100 | `century` | "Century club member!" |

**Test Implementation**:
```javascript
const milestoneTests = [7, 14, 30, 50, 100];

milestoneTests.forEach(targetStreak => {
  // Build streak to target length
  for (let day = 1; day <= targetStreak; day++) {
    simulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
    // Add check-in
  }
  
  const milestone = checkStreakMilestone(targetStreak);
  expect(milestone).toBeDefined();
});
```

**Success Criteria**:
- ✅ All major milestones detected correctly
- ✅ Milestone messages are appropriate and encouraging
- ✅ No false positives for non-milestone streaks

---

## 📊 **Weekly Insights Test Scenarios**

### **Scenario WI-001: Confidence Progression Tracking**

**Objective**: Test trend detection over multiple weeks.

**Test Data Pattern**:
```javascript
const confidenceProgression = [
  [3, 3, 4, 3, 4, 3, 4], // Week 1: Low baseline (avg 3.4)
  [4, 4, 5, 4, 5, 5, 4], // Week 2: Improving (avg 4.4)
  [5, 6, 5, 6, 6, 5, 6], // Week 3: Good progress (avg 5.6)
  [6, 7, 6, 7, 7, 6, 7], // Week 4: Strong confidence (avg 6.6)
  [7, 6, 5, 4, 3, 4, 5]  // Week 5: Challenge week (avg 5.1)
];
```

**Expected Insights**:
- Week 1→2: `improving` trend
- Week 2→3: `improving` trend
- Week 3→4: `improving` trend
- Week 4→5: `declining` trend

**Sophistication Progression**:
- Weeks 1-2: `basic` level insights
- Weeks 3-6: `intermediate` level insights
- Weeks 7+: `advanced` level insights

**Success Criteria**:
- ✅ Trend direction calculated correctly
- ✅ Insight sophistication increases with data
- ✅ Week-over-week comparisons accurate
- ✅ Confidence averages computed properly

---

### **Scenario WI-002: Cyclical Pattern Detection**

**Objective**: Identify weekend confidence dips and weekly cycles.

**Test Pattern**:
```javascript
const weeklyPattern = [7, 7, 6, 5, 4, 3, 3]; // Mon-Sun pattern
// Repeat for 3 weeks to establish pattern
```

**Pattern Analysis**:
- Weekday average: 6.0 (Mon-Fri)
- Weekend average: 3.0 (Sat-Sun)
- Dip threshold: 0.5 difference
- Expected: Weekend confidence dip detected

**Test Implementation**:
```javascript
const patterns = detectCyclicalPatterns(checkins);
expect(patterns.weekly_cycle.confidence_dip).toBeTruthy();
expect(patterns.weekly_cycle.pattern_strength).toBeGreaterThan(0.5);
```

**Success Criteria**:
- ✅ Weekend dip pattern identified correctly
- ✅ Pattern strength calculated appropriately
- ✅ Cyclical analysis spans multiple weeks
- ✅ Day-of-week grouping works correctly

---

### **Scenario WI-003: Achievement Detection**

**Objective**: Validate weekly achievement recognition.

**Achievement Test Cases**:
| Achievement | Trigger Condition | Expected Week |
|-------------|------------------|---------------|
| `completed_full_week` | 7 check-ins in week | Every complete week |
| `high_confidence_week` | Average confidence ≥7 | Week 4 (avg 6.6) |
| `consistency_milestone` | Week index ≥3 | Week 4+ |
| `stability_achievement` | Confidence range ≤2 | Stable weeks |

**Test Implementation**:
```javascript
const weeklyInsights = generateWeeklyInsights(user, checkins);

weeklyInsights.forEach((insight, index) => {
  if (insight.achievements.includes('completed_full_week')) {
    expect(getWeekCheckins(index)).toHaveLength(7);
  }
  
  if (insight.achievements.includes('high_confidence_week')) {
    expect(insight.average_confidence).toBeGreaterThanOrEqual(7);
  }
});
```

**Success Criteria**:
- ✅ Achievement triggers match defined conditions
- ✅ Achievement detection is consistent across weeks
- ✅ No false positive achievements
- ✅ Achievement names are descriptive and motivational

---

## 🔮 **Future Scenario Test Scenarios**

### **Scenario FS-001: Long-term Journey Simulation**

**Objective**: Test 6-month IVF journey progression.

**Journey Timeline**:
```javascript
const futureScenarios = [
  { months: 1, stage: 'stimulation', description: 'Started stimulation' },
  { months: 2, stage: 'transfer', description: 'First transfer' },
  { months: 3, stage: 'tww', description: 'Two week wait' },
  { months: 4, stage: 'between_cycles', description: 'Between cycles' },
  { months: 5, stage: 'stimulation', description: 'Second cycle' },
  { months: 6, stage: 'pregnant', description: 'Success!' }
];
```

**Test Validation**:
- Each month: Verify appropriate questions for stage
- Progression: Ensure stage transitions work correctly
- Performance: System handles long-term simulation
- Data integrity: Timestamps remain consistent

**Success Criteria**:
- ✅ 6-month simulation completes without errors
- ✅ Questions adapt correctly at each stage
- ✅ Performance remains acceptable throughout
- ✅ Data consistency maintained across timeline

---

### **Scenario FS-002: 3-Month Streak Projection**

**Objective**: Test long-term streak patterns and projections.

**Test Implementation**:
```javascript
const longTermUser = TestUserFactory.createUser();
const longTermCheckins = [];

// Simulate 90 days with 80% check-in rate
for (let day = 1; day <= 90; day++) {
  simulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
  
  const shouldCheckIn = Math.random() < 0.8; // 80% rate
  if (shouldCheckIn) {
    longTermCheckins.push(MockCheckinFactory.createCheckin(longTermUser));
  }
}
```

**Analysis Requirements**:
- Final streak calculation accuracy
- Weekly streak insights across 12+ weeks
- Pattern recognition over extended period
- Performance monitoring for large datasets

**Success Criteria**:
- ✅ 90-day simulation processes efficiently
- ✅ Streak calculations remain accurate
- ✅ Weekly insights maintain quality
- ✅ Memory usage stays within limits

---

## 🚨 **Edge Case Test Scenarios**

### **Scenario EC-001: Date Boundary Testing**

**Objective**: Test behavior across date boundaries and edge cases.

**Edge Cases**:
1. **Month Boundaries**
   - January 31 → February 1
   - February 28 → March 1 (non-leap year)
   - February 29 → March 1 (leap year)

2. **Year Boundaries**
   - December 31, 2024 → January 1, 2025

3. **Daylight Saving Time**
   - Spring forward: 2:00 AM → 3:00 AM
   - Fall back: 2:00 AM → 1:00 AM

4. **Timezone Edge Cases**
   - UTC midnight crossover
   - Different timezone check-ins

**Test Implementation**:
```javascript
const edgeDates = [
  '2025-01-31T23:59:59.999Z',
  '2025-02-01T00:00:00.000Z',
  '2024-12-31T23:59:59.999Z',
  '2025-01-01T00:00:00.000Z'
];

edgeDates.forEach(edgeDate => {
  simulator.setDate(edgeDate);
  // Test date string generation
  const dateString = simulator.getCurrentDateString();
  expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
```

**Success Criteria**:
- ✅ Date calculations work across all boundaries
- ✅ String formatting remains consistent
- ✅ No off-by-one errors in date arithmetic
- ✅ Timezone handling is correct

---

### **Scenario EC-002: Performance Stress Testing**

**Objective**: Validate framework performance under stress conditions.

**Stress Tests**:
1. **Large Dataset Simulation**
   - 1000+ check-ins per user
   - 50+ users in single test
   - 365+ days of simulation

2. **Memory Leak Detection**
   - Run 100 test cycles
   - Monitor memory usage growth
   - Verify cleanup after each cycle

3. **Time Progression Stress**
   - Rapid time advancement (1000+ days)
   - Many small time increments (hours/minutes)
   - Mixed progression patterns

**Performance Thresholds**:
- Test execution: <30 seconds for full suite
- Memory usage: <100MB peak, <10MB growth per cycle
- Data generation: >1000 check-ins per second

**Success Criteria**:
- ✅ Performance stays within defined thresholds
- ✅ No memory leaks detected
- ✅ System scales linearly with data size
- ✅ Stress tests complete without crashes

---

## ✅ **Validation and Success Criteria**

### **Overall Framework Validation**

**Test Coverage Requirements**:
- ✅ 100% of temporal features covered
- ✅ All cycle stages tested
- ✅ All confidence levels validated
- ✅ Edge cases and error conditions tested

**Quality Assurance Metrics**:
- ✅ Zero false positives in test results
- ✅ All assertions validate expected behavior
- ✅ Performance remains within acceptable bounds
- ✅ Memory cleanup verified for all tests

**Integration Validation**:
- ✅ Jest integration works correctly
- ✅ CI/CD pipeline integration successful
- ✅ Test results are actionable and clear
- ✅ Error reporting is comprehensive

This comprehensive testing scenario documentation ensures complete validation of all temporal features in the Novara MVP platform! 🚀 