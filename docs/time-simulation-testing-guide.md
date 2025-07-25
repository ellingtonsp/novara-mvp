# Time Simulation Testing Framework

## 🎯 **Overview**

The Time Simulation Testing Framework enables comprehensive testing of time-dependent features in the Novara MVP application. This framework is essential for validating features like question rotation, streak calculations, weekly insights, and future scenario planning.

## 🛠️ **Framework Components**

### **Core Classes**

#### **TimeSimulator**
```javascript
const simulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
simulator.start();                    // Override Date.now() and new Date()
simulator.advanceTime({ days: 7 });   // Jump forward 7 days
simulator.setDate('2025-02-15');      // Set specific date
simulator.getCurrentISO();            // Get current simulated date
simulator.stop();                     // Restore normal Date behavior
```

#### **TestUserFactory**
```javascript
const newUser = TestUserFactory.createNewUser();           // Considering IVF
const stimUser = TestUserFactory.createStimulationUser();  // In stimulation
const pregnantUser = TestUserFactory.createPregnantUser(); // Pregnant
const customUser = TestUserFactory.createUser({            // Custom profile
  cycle_stage: 'transfer',
  confidence_meds: 3
});
```

#### **MockCheckinFactory**
```javascript
const basicCheckin = MockCheckinFactory.createCheckin(user);
const positiveCheckin = MockCheckinFactory.createPositiveCheckin(user);
const mixedCheckin = MockCheckinFactory.createMixedSentimentCheckin(user);
const negativeCheckin = MockCheckinFactory.createNegativeCheckin(user);
```

---

## 📋 **Testing Scenarios**

### **1. Question Rotation Testing**

**Purpose**: Verify questions adapt correctly to cycle stage progression and confidence changes.

```javascript
// Test cycle stage progression
const user = TestUserFactory.createNewUser();
const journeyStages = ['considering', 'ivf_prep', 'stimulation', 'retrieval', 'transfer', 'tww', 'pregnant'];

journeyStages.forEach(stage => {
  user.cycle_stage = stage;
  const questions = generateQuestionsForUser(user);
  
  // Verify appropriate medication questions for each stage
  expect(questions.find(q => q.context === 'medication_preparation')).toBeDefined(); // For prep stages
  expect(questions.find(q => q.context === 'medication_active')).toBeDefined();      // For active stages
});
```

**Key Test Cases**:
- ✅ Preparation questions for `considering` and `ivf_prep` stages
- ✅ Active treatment questions for `stimulation`, `retrieval`, `transfer`, `tww` stages  
- ✅ Pregnancy-specific questions for `pregnant` stage
- ✅ Confidence-based follow-up question adaptation
- ✅ Emergency questions for very low confidence (≤2)
- ✅ Cycle stage update prompts for accounts >30 days old

### **2. Streak Functionality Testing**

**Purpose**: Validate streak calculation, reset handling, and recovery patterns.

```javascript
// Test streak building and reset
const user = TestUserFactory.createUser();
const checkins = [];

// Build 10-day streak
for (let day = 1; day <= 10; day++) {
  simulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
  checkins.push(MockCheckinFactory.createCheckin(user, {
    date_submitted: simulator.getCurrentDateString()
  }));
}

// Skip day 11 (breaks streak)
// Resume day 12-15
for (let day = 12; day <= 15; day++) {
  simulator.setDate(`2025-01-${day}T10:00:00.000Z`);
  checkins.push(MockCheckinFactory.createCheckin(user, {
    date_submitted: simulator.getCurrentDateString()
  }));
}

const streak = calculateCurrentStreak(user.id, checkins);
expect(streak.current).toBe(4);    // Current streak: days 12-15
expect(streak.longest).toBe(10);   // Longest streak: days 1-10
```

**Key Test Cases**:
- ✅ Consecutive day streak calculation
- ✅ Streak reset after missed days
- ✅ Multiple check-ins per day (counts as 1)
- ✅ Milestone detection (7, 14, 30, 100 days)
- ✅ Recovery motivation messages
- ✅ Weekly streak insights and patterns
- ✅ Optimal check-in time prediction
- ✅ Streak risk assessment

### **3. Weekly Insights Testing**

**Purpose**: Test pattern recognition, trend analysis, and insight evolution over time.

```javascript
// Test confidence progression insights
const confidenceProgression = [
  [3, 3, 4, 3, 4, 3, 4], // Week 1: Low baseline (avg 3.4)
  [4, 4, 5, 4, 5, 5, 4], // Week 2: Improving (avg 4.4)
  [5, 6, 5, 6, 6, 5, 6], // Week 3: Good progress (avg 5.6)
  [6, 7, 6, 7, 7, 6, 7]  // Week 4: Strong confidence (avg 6.6)
];

let dayCounter = 1;
confidenceProgression.forEach((week) => {
  week.forEach(confidence => {
    simulator.setDate(`2025-01-${String(dayCounter).padStart(2, '0')}T10:00:00.000Z`);
    checkins.push(MockCheckinFactory.createCheckin(user, {
      confidence_today: confidence,
      medication_confidence_today: confidence
    }));
    dayCounter++;
  });
});

const weeklyInsights = generateWeeklyInsights(user, checkins);
expect(weeklyInsights[0].trend).toBe('improving');
expect(weeklyInsights[3].achievement).toBeDefined();
```

**Key Test Cases**:
- ✅ Confidence trend detection (improving/declining)
- ✅ Cyclical pattern recognition (weekend dips, weekly cycles)
- ✅ Insight sophistication progression (basic → intermediate → advanced)
- ✅ Stage-specific insight adaptation
- ✅ Achievement and milestone detection
- ✅ Risk prediction and preemptive support
- ✅ Weekly summary generation with actionable recommendations
- ✅ Insight quality tracking and adaptation

### **4. Future Scenario Testing**

**Purpose**: Test system behavior across extended time periods and various life scenarios.

```javascript
// Test 6-month IVF journey simulation
const futureScenarios = [
  { months: 1, stage: 'stimulation', description: 'Started stimulation' },
  { months: 2, stage: 'transfer', description: 'First transfer' },
  { months: 3, stage: 'tww', description: 'Two week wait' },
  { months: 4, stage: 'between_cycles', description: 'Between cycles' },
  { months: 5, stage: 'stimulation', description: 'Second cycle' },
  { months: 6, stage: 'pregnant', description: 'Success!' }
];

futureScenarios.forEach(scenario => {
  simulator.setDate('2025-01-01T00:00:00.000Z');
  simulator.advanceTime({ weeks: scenario.months * 4 });
  
  user.cycle_stage = scenario.stage;
  const questions = generateQuestionsForUser(user);
  
  // Verify questions adapt to each stage
  validateStageSpecificQuestions(questions, scenario.stage);
});
```

**Key Test Cases**:
- ✅ Long-term cycle stage progression
- ✅ 3-month+ streak pattern analysis
- ✅ Seasonal behavior variations
- ✅ System performance over extended periods
- ✅ Data consistency across time jumps

---

## 🚀 **Running Tests**

### **Command Line Interface**

```bash
# Run all time simulation tests
node scripts/run-time-simulation-tests.js

# Run specific test suites
node scripts/run-time-simulation-tests.js questions        # Question rotation only
node scripts/run-time-simulation-tests.js streaks         # Streak functionality only  
node scripts/run-time-simulation-tests.js insights        # Weekly insights only
node scripts/run-time-simulation-tests.js future-scenarios # Future scenarios only
```

### **Jest Integration**

```bash
# Run specific test files
npm test test/unit/time-simulation.test.js
npm test test/unit/question-rotation.test.js
npm test test/unit/streak-functionality.test.js
npm test test/unit/weekly-insights.test.js

# Run all unit tests
npm test test/unit/
```

### **Example Test Output**

```
🚀 Starting Comprehensive Time Simulation Tests
================================================

📋 Testing Question Rotation Over Time
--------------------------------------
🔄 Test 1: IVF Journey Progression Questions
   Week 1 (Considering IVF): medication_readiness_today
   Week 2 (Considering IVF): medication_readiness_today
   Week 1 (IVF Preparation): medication_readiness_today
   Week 2 (IVF Preparation): medication_readiness_today
   Week 1 (Stimulation Phase): medication_confidence_today
   Week 2 (Stimulation Phase): medication_confidence_today

🎯 Test 2: Confidence-Based Question Adaptation
   Confidence 2: medication_concern_today (medication_focus)
   Confidence 4: medication_concern_today (medication_focus)
   Confidence 6: medication_momentum (medication_check)
   Confidence 8: medication_momentum (medication_check)
✅ Question rotation tests completed

📈 Testing Streak Functionality
-------------------------------
🔥 Test 1: Building Check-in Streak
   Day 5: Current streak = 5, Longest = 5
   Day 10: Current streak = 10, Longest = 10
   Day 15: Current streak = 0, Longest = 14  # Reset day
   Day 16: Current streak = 1, Longest = 14  # Recovery starts

📊 Test 2: Weekly Streak Insights
   Week 1: 1.00 check-in rate (7/7 days)
   Week 2: 0.86 check-in rate (6/7 days)  # Missing day 15
   Week 3: 1.00 check-in rate (7/7 days)

🔄 Test 3: Streak Recovery Patterns
   Recovery complete: 10-day streak rebuilt
✅ Streak functionality tests completed
```

---

## 📊 **Best Practices**

### **1. Test Design Principles**

- **Deterministic**: Always use fixed start dates and controlled progressions
- **Isolated**: Each test should clean up its time state
- **Realistic**: Use patterns that mirror real user behavior
- **Comprehensive**: Test edge cases, failures, and recovery scenarios

### **2. Time Management**

```javascript
describe('My Time-Dependent Feature', () => {
  let timeSimulator;

  beforeEach(() => {
    timeSimulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
    timeSimulator.start();
  });

  afterEach(() => {
    timeSimulator.stop();  // Critical: Always clean up
  });

  test('should handle time progression correctly', () => {
    // Test implementation
  });
});
```

### **3. Data Patterns**

```javascript
// Good: Realistic progression patterns
const confidenceProgression = [
  [3, 3, 4, 3, 4, 3, 4], // Gradual improvement
  [4, 4, 5, 4, 5, 5, 4], // Some variation
  [5, 6, 5, 6, 6, 5, 6]  // Upward trend
];

// Avoid: Unrealistic perfect patterns
const unrealistic = [
  [1, 2, 3, 4, 5, 6, 7], // Too linear
  [10, 10, 10, 10, 10]   // No variation
];
```

### **4. Performance Considerations**

- Use `simulator.setDate()` for large time jumps instead of many `advanceTime()` calls
- Batch check-in creation when possible
- Clean up large datasets between tests
- Monitor memory usage for long-term simulations

---

## 🔧 **Advanced Features**

### **Custom Time Patterns**

```javascript
// Simulate medication cycle patterns
const medicationCycle = {
  stimulationPhase: { 
    duration: 10, 
    confidencePattern: [7, 6, 5, 4, 3, 4, 5, 6, 7, 8] 
  },
  retrievalPhase: { 
    duration: 3, 
    confidencePattern: [6, 5, 7] 
  }
};

// Execute pattern
medicationCycle.stimulationPhase.confidencePattern.forEach((confidence, day) => {
  simulator.advanceTime({ days: 1 });
  createCheckinWithConfidence(user, confidence);
});
```

### **Multi-User Scenario Testing**

```javascript
// Test cohort behavior
const cohort = [
  TestUserFactory.createNewUser(),
  TestUserFactory.createStimulationUser(),
  TestUserFactory.createPregnantUser()
];

cohort.forEach(user => {
  // Run same time progression for all users
  simulateUserJourney(user, 30); // 30 days
});

// Analyze cohort patterns
const cohortInsights = generateCohortInsights(cohort);
```

### **Seasonal and Calendar Testing**

```javascript
// Test holiday/weekend behavior
const holidays = ['2025-12-25', '2025-01-01', '2025-07-04'];

holidays.forEach(holiday => {
  simulator.setDate(holiday);
  const questions = generateQuestionsForUser(user);
  
  // Verify holiday-appropriate messaging
  expect(questions.some(q => q.supportive_messaging)).toBeTruthy();
});
```

---

## 📈 **Integration with CI/CD**

### **Automated Testing**

```yaml
# .github/workflows/time-simulation-tests.yml
name: Time Simulation Tests
on: [push, pull_request]

jobs:
  temporal-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run time simulation tests
        run: |
          node scripts/run-time-simulation-tests.js all
          npm test test/unit/
```

### **Performance Monitoring**

```javascript
// Add performance tracking to tests
const startTime = Date.now();
await runTimeSimulationTest();
const duration = Date.now() - startTime;

expect(duration).toBeLessThan(5000); // Should complete in <5 seconds
```

---

## 🎯 **Future Enhancements**

### **Planned Features**
- **Real-time simulation**: Connect to live system for hybrid testing
- **Machine learning patterns**: Generate realistic user behavior from ML models
- **Multi-timezone testing**: Test across different user timezones
- **Performance benchmarking**: Automated performance regression detection
- **Visual timeline tools**: GUI for designing and visualizing test scenarios

### **Advanced Scenarios**
- **Pregnancy journey simulation**: 40-week progression with changing needs
- **Multiple cycle attempts**: Success/failure cycles with emotional progression
- **Seasonal affective patterns**: Mood variations based on calendar dates
- **Medication adherence patterns**: Complex dosing schedule simulations

---

## 💡 **Tips and Troubleshooting**

### **Common Issues**

1. **Memory Leaks**: Always call `simulator.stop()` in test cleanup
2. **Date Inconsistencies**: Use `simulator.getCurrentDateString()` for consistent formatting
3. **Timezone Issues**: Use UTC dates in simulations to avoid timezone complications
4. **Performance**: Batch operations when creating large datasets

### **Debugging Time Issues**

```javascript
// Add logging to understand time flow
simulator.start();
console.log('🕐 Simulation started:', simulator.getCurrentISO());

simulator.advanceTime({ days: 7 });
console.log('⏭️  Advanced 7 days:', simulator.getCurrentISO());

// Verify Date.now() is overridden
console.log('Date.now():', new Date(Date.now()).toISOString());
console.log('new Date():', new Date().toISOString());
```

---

This comprehensive time simulation framework enables thorough testing of all temporal features in the Novara MVP, ensuring robust behavior across various user journeys and time periods! 🚀 