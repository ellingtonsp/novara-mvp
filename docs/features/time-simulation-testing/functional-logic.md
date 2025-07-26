# Time Simulation Testing Framework - Functional Logic

## 🧠 **Core Business Logic**

### **Time Control System**

The framework's foundation is controlled time progression that enables deterministic testing of temporal features.

**Time Override Mechanism:**
```javascript
class TimeSimulator {
  start() {
    const simulator = this;
    
    // Override Date.now() globally
    Date.now = () => simulator.currentDate.getTime();
    
    // Override Date constructor
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(simulator.currentDate);
        } else {
          super(...args);
        }
      }
      
      static now() {
        return simulator.currentDate.getTime();
      }
    };
  }
}
```

**Time Progression Logic:**
- **Deterministic**: All time operations use controlled simulator time
- **Flexible**: Support for days, hours, minutes, weeks progression
- **Isolated**: Each test gets clean time state
- **Reversible**: Original Date behavior restored on cleanup

### **User Profile Generation**

**Factory Pattern Implementation:**
```javascript
class TestUserFactory {
  static createUser(overrides = {}) {
    const defaultUser = {
      id: 'rec_test_user_' + Date.now(), // Unique per simulation time
      cycle_stage: 'ivf_prep',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      created_at: new Date().toISOString() // Uses simulation time
    };
    
    return { ...defaultUser, ...overrides };
  }
}
```

**User Profile Logic:**
- **Realistic Defaults**: Based on actual user data patterns
- **Customizable**: Override any field for specific test scenarios
- **Time-Aware**: Creation timestamps use simulation time
- **Cycle-Stage Specific**: Different factories for different journey stages

### **Check-in Data Generation**

**Mock Data Strategy:**
```javascript
class MockCheckinFactory {
  static createCheckin(user, overrides = {}) {
    const defaultCheckin = {
      id: 'rec_checkin_' + Date.now(),
      user_id: user.id,
      confidence_today: 6,
      medication_confidence_today: 5,
      mood_today: ['hopeful', 'anxious'],
      date_submitted: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      created_at: new Date().toISOString() // Full timestamp
    };
    
    return { ...defaultCheckin, ...overrides };
  }
}
```

**Data Pattern Logic:**
- **Realistic Variations**: Confidence ranges, mood combinations
- **Sentiment Patterns**: Positive, negative, mixed scenarios
- **Time Consistency**: Dates align with simulation progression
- **User Correlation**: Data reflects user's cycle stage and profile

---

## 🔄 **Data Flow Architecture**

### **Test Execution Flow**

```mermaid
graph TD
    A[Test Start] --> B[TimeSimulator.start()]
    B --> C[Override Date Functions]
    C --> D[Create Test Users]
    D --> E[Generate Mock Data]
    E --> F[Execute Time Progression]
    F --> G[Validate Feature Behavior]
    G --> H[Collect Results]
    H --> I[TimeSimulator.stop()]
    I --> J[Restore Original Date]
    J --> K[Test Complete]
```

### **Question Rotation Logic Flow**

```javascript
// Question Generation Logic
async function generateQuestionsForUser(user) {
  // 1. Determine medication status from cycle stage
  const medicationStatus = getMedicationStatusFromCycleStage(user.cycle_stage);
  
  // 2. Get stage-appropriate question
  const medicationQuestion = getMedicationQuestionForCycleStage(user.cycle_stage);
  
  // 3. Add confidence-based follow-ups
  if (user.confidence_meds <= 4) {
    questions.push(getLowConfidenceQuestion(user.cycle_stage));
  } else {
    questions.push(getHighConfidenceQuestion(user.cycle_stage));
  }
  
  // 4. Check for stage update prompts
  if (shouldCheckCycleStageUpdate(user)) {
    questions.push(getCycleStageUpdateQuestion());
  }
  
  return questions.sort((a, b) => a.priority - b.priority);
}
```

### **Streak Calculation Logic**

```javascript
function calculateCurrentStreak(userId, checkins) {
  // 1. Filter and sort user's check-ins
  const userCheckins = checkins
    .filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));
  
  // 2. Get unique dates (handle multiple daily check-ins)
  const uniqueDates = [...new Set(userCheckins.map(c => c.date_submitted))];
  
  // 3. Calculate current streak from most recent
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const mostRecent = uniqueDates[0];
  
  if (mostRecent === today || isYesterday(mostRecent)) {
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = getDateDaysAgo(i);
      if (uniqueDates[i] === expectedDate) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  }
  
  // 4. Calculate longest streak ever
  let longestStreak = calculateLongestStreak(uniqueDates);
  
  return { current: currentStreak, longest: longestStreak };
}
```

### **Weekly Insights Generation Logic**

```javascript
function generateWeeklyInsights(user, checkins, insightFeedback = []) {
  // 1. Group check-ins by week
  const weeks = groupCheckinsByWeek(checkins);
  const insights = [];
  
  weeks.forEach((weekCheckins, weekIndex) => {
    // 2. Calculate week statistics
    const weeklyStats = calculateWeeklyStats(weekCheckins);
    
    // 3. Analyze trends vs previous weeks
    const trends = analyzeTrends(weekCheckins, checkins.slice(0, weekIndex * 7));
    
    // 4. Detect patterns
    const patterns = detectWeeklyPatterns(weekCheckins);
    
    // 5. Determine sophistication level based on data history
    const sophisticationLevel = weekIndex <= 2 ? 'basic' : 
                               weekIndex <= 6 ? 'intermediate' : 'advanced';
    
    // 6. Generate stage-specific insights
    const stageInsights = generateStageSpecificInsights(user, weekCheckins);
    
    // 7. Create predictions (after sufficient data)
    const predictions = weekIndex >= 3 ? 
      generatePredictions(checkins, weekIndex) : null;
    
    insights.push({
      week: weekIndex + 1,
      sophistication_level: sophisticationLevel,
      trend: trends.overall_direction,
      insights: generateInsightMessages(weeklyStats, trends, patterns),
      achievements: detectWeeklyAchievements(weekCheckins),
      predictions: predictions,
      stage_specific_insights: stageInsights
    });
  });
  
  return insights;
}
```

---

## 🎯 **Algorithmic Components**

### **Time Progression Algorithm**

**Linear Time Advancement:**
```javascript
advanceTime({ days = 0, hours = 0, minutes = 0, weeks = 0 }) {
  const totalMs = (weeks * 7 * 24 * 60 * 60 * 1000) + 
                 (days * 24 * 60 * 60 * 1000) + 
                 (hours * 60 * 60 * 1000) + 
                 (minutes * 60 * 1000);
  
  this.currentDate.setTime(this.currentDate.getTime() + totalMs);
  return this.currentDate;
}
```

**Date Consistency Validation:**
```javascript
getCurrentDateString() {
  return this.currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

getCurrentISO() {
  return this.currentDate.toISOString(); // Full ISO timestamp
}
```

### **Pattern Recognition Algorithm**

**Cyclical Pattern Detection:**
```javascript
function detectCyclicalPatterns(checkins) {
  // 1. Group by day of week
  const dayOfWeekStats = {};
  
  checkins.forEach(checkin => {
    const dayOfWeek = new Date(checkin.date_submitted).getDay();
    if (!dayOfWeekStats[dayOfWeek]) {
      dayOfWeekStats[dayOfWeek] = [];
    }
    dayOfWeekStats[dayOfWeek].push(checkin.confidence_today);
  });
  
  // 2. Calculate averages per day
  const dayAverages = {};
  Object.keys(dayOfWeekStats).forEach(day => {
    const values = dayOfWeekStats[day];
    dayAverages[day] = values.reduce((sum, val) => sum + val, 0) / values.length;
  });
  
  // 3. Detect weekend dip pattern
  const weekendAvg = (dayAverages[0] + dayAverages[6]) / 2; // Sun + Sat
  const weekdayAvg = Object.keys(dayAverages)
    .filter(day => day >= 1 && day <= 5)
    .reduce((sum, day) => sum + dayAverages[day], 0) / 5;
  
  const hasWeekendDip = weekendAvg < weekdayAvg - 0.5; // Threshold
  
  return {
    weekly_cycle: {
      confidence_dip: hasWeekendDip,
      pattern_strength: hasWeekendDip ? 0.8 : 0.2
    }
  };
}
```

### **Trend Analysis Algorithm**

**Confidence Trajectory Calculation:**
```javascript
function analyzeTrends(weekCheckins, allPreviousCheckins) {
  // 1. Calculate current week average
  const currentWeekAvg = weekCheckins
    .reduce((sum, c) => sum + c.confidence_today, 0) / weekCheckins.length;
  
  // 2. Calculate previous week average
  const previousWeekCheckins = allPreviousCheckins.slice(-7);
  const previousWeekAvg = previousWeekCheckins.length > 0 ?
    previousWeekCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / previousWeekCheckins.length : 0;
  
  // 3. Determine trend direction
  const confidenceChange = currentWeekAvg - previousWeekAvg;
  const trendThreshold = 0.5;
  
  let direction;
  if (confidenceChange > trendThreshold) {
    direction = 'improving';
  } else if (confidenceChange < -trendThreshold) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }
  
  return {
    overall_direction: direction,
    confidence_change: confidenceChange,
    current_week_avg: currentWeekAvg,
    previous_week_avg: previousWeekAvg
  };
}
```

### **Milestone Detection Algorithm**

**Achievement Recognition:**
```javascript
function detectWeeklyAchievements(weekCheckins, weekIndex = 0) {
  const achievements = [];
  
  // 1. Check completion milestones
  if (weekCheckins.length === 7) {
    achievements.push('completed_full_week');
  }
  
  // 2. Check confidence milestones
  const avgConfidence = weekCheckins
    .reduce((sum, c) => sum + c.confidence_today, 0) / weekCheckins.length;
    
  if (avgConfidence >= 7) {
    achievements.push('high_confidence_week');
  } else if (avgConfidence >= 6) {
    achievements.push('good_confidence_week');
  }
  
  // 3. Check consistency milestones
  if (weekIndex >= 3) {
    achievements.push('consistency_milestone');
  }
  
  // 4. Check improvement milestones
  const confidenceRange = Math.max(...weekCheckins.map(c => c.confidence_today)) - 
                         Math.min(...weekCheckins.map(c => c.confidence_today));
  
  if (confidenceRange <= 2) {
    achievements.push('stability_achievement');
  }
  
  return achievements;
}
```

---

## 🔍 **Validation Logic**

### **Test Assertion Framework**

**Question Validation:**
```javascript
class TestAssertions {
  static assertQuestionRotation(questions, expectedRotation) {
    expect(questions).toHaveLength(expectedRotation.length);
    
    expectedRotation.forEach((expectedQuestion, index) => {
      const actualQuestion = questions[index];
      expect(actualQuestion.id).toBe(expectedQuestion.id);
      
      if (expectedQuestion.context) {
        expect(actualQuestion.context).toBe(expectedQuestion.context);
      }
    });
  }
  
  static assertSentimentClassification(result, expectedSentiment, expectedConfidence = null) {
    expect(result.sentiment).toBe(expectedSentiment);
    
    if (expectedConfidence !== null) {
      expect(result.confidence).toBeGreaterThanOrEqual(expectedConfidence);
    }
  }
  
  static assertCopyVariant(insight, expectedType, shouldContainText = null) {
    expect(insight.type).toBe(expectedType);
    
    if (shouldContainText) {
      expect(insight.message.toLowerCase()).toContain(shouldContainText.toLowerCase());
    }
  }
}
```

### **Data Integrity Validation**

**Time Consistency Checks:**
```javascript
function validateTimeConsistency(simulator, checkins) {
  // 1. Verify all timestamps are within simulation bounds
  const simulationStart = simulator.startDate;
  const simulationCurrent = simulator.getCurrentDate();
  
  checkins.forEach(checkin => {
    const checkinDate = new Date(checkin.created_at);
    expect(checkinDate).toBeAfter(simulationStart);
    expect(checkinDate).toBeBeforeOrEqual(simulationCurrent);
  });
  
  // 2. Verify date progression is logical
  const sortedCheckins = checkins.sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at));
  
  for (let i = 1; i < sortedCheckins.length; i++) {
    const prevDate = new Date(sortedCheckins[i-1].created_at);
    const currDate = new Date(sortedCheckins[i].created_at);
    expect(currDate).toBeAfterOrEqual(prevDate);
  }
}
```

### **Performance Validation**

**Memory Leak Detection:**
```javascript
function validateMemoryCleanup(testFunction) {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Run test
  testFunction();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Should not increase by more than 10MB
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
}
```

---

## ⚡ **Performance Optimization**

### **Efficient Data Structures**

**Optimized Check-in Grouping:**
```javascript
function groupCheckinsByWeek(checkins) {
  // Use Map for O(1) lookups
  const weekMap = new Map();
  
  checkins.forEach(checkin => {
    const date = new Date(checkin.date_submitted);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey).push(checkin);
  });
  
  // Convert to sorted array
  return Array.from(weekMap.values())
    .sort((a, b) => new Date(a[0].date_submitted) - new Date(b[0].date_submitted));
}
```

### **Batch Operations**

**Bulk Data Generation:**
```javascript
function generateBulkCheckins(user, dayCount, simulator) {
  const checkins = [];
  const startDate = simulator.getCurrentDate();
  
  // Pre-allocate array for better performance
  checkins.length = dayCount;
  
  for (let i = 0; i < dayCount; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    
    simulator.setDate(dayDate);
    
    checkins[i] = MockCheckinFactory.createCheckin(user, {
      date_submitted: simulator.getCurrentDateString(),
      created_at: simulator.getCurrentISO()
    });
  }
  
  return checkins;
}
```

### **Caching Strategy**

**Memoized Calculations:**
```javascript
const calculationCache = new Map();

function memoizedStreakCalculation(userId, checkins) {
  const cacheKey = `${userId}_${checkins.length}_${checkins[0]?.id}`;
  
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }
  
  const result = calculateCurrentStreak(userId, checkins);
  calculationCache.set(cacheKey, result);
  
  return result;
}
```

---

## 🚨 **Error Handling & Edge Cases**

### **Time State Management**

**Cleanup Validation:**
```javascript
afterEach(() => {
  if (timeSimulator && timeSimulator.isActive) {
    console.warn('⚠️ TimeSimulator not properly cleaned up');
    timeSimulator.stop();
  }
  
  // Verify Date functions are restored
  const testDate = new Date();
  const realDate = new Date();
  expect(Math.abs(testDate.getTime() - realDate.getTime())).toBeLessThan(100);
});
```

### **Data Validation**

**Input Sanitization:**
```javascript
function validateUserProfile(user) {
  // Required fields
  const requiredFields = ['id', 'email', 'cycle_stage'];
  requiredFields.forEach(field => {
    if (!user[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
  
  // Valid cycle stages
  const validStages = ['considering', 'ivf_prep', 'stimulation', 'retrieval', 'transfer', 'tww', 'pregnant', 'between_cycles'];
  if (!validStages.includes(user.cycle_stage)) {
    throw new Error(`Invalid cycle stage: ${user.cycle_stage}`);
  }
  
  // Confidence ranges
  ['confidence_meds', 'confidence_costs', 'confidence_overall'].forEach(field => {
    if (user[field] && (user[field] < 1 || user[field] > 10)) {
      throw new Error(`${field} must be between 1 and 10`);
    }
  });
}
```

### **Graceful Degradation**

**Fallback Mechanisms:**
```javascript
function safeTimeProgression(simulator, progression) {
  try {
    simulator.advanceTime(progression);
  } catch (error) {
    console.warn('Time progression failed, using fallback:', error.message);
    
    // Fallback to setting specific date
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + (progression.days || 0));
    simulator.setDate(fallbackDate);
  }
}
```

This comprehensive functional logic documentation provides the technical foundation for understanding and maintaining the Time Simulation Testing Framework! 🚀 