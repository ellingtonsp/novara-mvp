# Time Simulation Testing Framework - API Endpoints

## 🔌 **Testing Framework APIs**

The Time Simulation Testing Framework provides programmatic APIs for creating, controlling, and validating temporal test scenarios.

## 📡 **Core Framework APIs**

### **TimeSimulator Class**

**Constructor**
```javascript
new TimeSimulator(startDate?: string)
```
- **Parameters**: 
  - `startDate` (optional): ISO string for simulation start time (default: current time)
- **Returns**: TimeSimulator instance
- **Example**: `new TimeSimulator('2025-01-01T00:00:00.000Z')`

**Methods**

#### `start(): void`
Initializes time simulation by overriding global Date functions.
```javascript
simulator.start();
// After this call, all Date operations use simulation time
```

#### `stop(): void`
Restores original Date behavior and cleans up simulation state.
```javascript
simulator.stop();
// Critical: Always call in test cleanup to prevent memory leaks
```

#### `setDate(date: string | Date): Date`
Sets the current simulation time to a specific date.
```javascript
simulator.setDate('2025-03-15T10:30:00.000Z');
simulator.setDate(new Date('2025-03-15'));
```

#### `advanceTime(options: TimeAdvanceOptions): Date`
Advances simulation time by specified amount.
```javascript
interface TimeAdvanceOptions {
  days?: number;
  hours?: number;
  minutes?: number;
  weeks?: number;
}

// Examples
simulator.advanceTime({ days: 7 });
simulator.advanceTime({ weeks: 2, days: 3, hours: 4 });
```

#### `getCurrentDate(): Date`
Returns current simulation time as Date object.
```javascript
const currentDate = simulator.getCurrentDate();
```

#### `getCurrentISO(): string`
Returns current simulation time as ISO string.
```javascript
const isoString = simulator.getCurrentISO();
// Returns: "2025-01-15T10:30:00.000Z"
```

#### `getCurrentDateString(): string`
Returns current simulation date as YYYY-MM-DD string.
```javascript
const dateString = simulator.getCurrentDateString();
// Returns: "2025-01-15"
```

---

### **TestUserFactory Class**

**Static Methods**

#### `createUser(overrides?: Partial<User>): User`
Creates a test user with default or custom properties.
```javascript
interface User {
  id: string;
  email: string;
  nickname: string;
  confidence_meds: number;
  confidence_costs: number;
  confidence_overall: number;
  primary_need: string;
  cycle_stage: string;
  top_concern: string;
  timezone: string;
  email_opt_in: boolean;
  status: string;
  created_at: string;
}

const user = TestUserFactory.createUser({
  cycle_stage: 'stimulation',
  confidence_meds: 3
});
```

#### `createNewUser(): User`
Creates user in "considering" stage with low confidence.
```javascript
const newUser = TestUserFactory.createNewUser();
// Returns user with cycle_stage: 'considering', low confidence levels
```

#### `createStimulationUser(): User`
Creates user in active stimulation phase.
```javascript
const stimUser = TestUserFactory.createStimulationUser();
// Returns user with cycle_stage: 'stimulation', moderate confidence
```

#### `createPregnantUser(): User`
Creates user in pregnancy stage with high confidence.
```javascript
const pregnantUser = TestUserFactory.createPregnantUser();
// Returns user with cycle_stage: 'pregnant', high confidence
```

#### `createBetweenCyclesUser(): User`
Creates user between treatment cycles.
```javascript
const betweenUser = TestUserFactory.createBetweenCyclesUser();
// Returns user with cycle_stage: 'between_cycles', variable confidence
```

---

### **MockCheckinFactory Class**

**Static Methods**

#### `createCheckin(user: User, overrides?: Partial<Checkin>): Checkin`
Creates a basic check-in with default values.
```javascript
interface Checkin {
  id: string;
  user_id: string;
  mood_today: string[];
  confidence_today: number;
  primary_concern_today: string;
  medication_confidence_today: number;
  medication_concern_today: string;
  financial_stress_today: number;
  financial_concern_today: string;
  journey_readiness_today: number;
  user_note: string;
  date_submitted: string;
  created_at: string;
}

const checkin = MockCheckinFactory.createCheckin(user, {
  confidence_today: 8,
  mood_today: ['hopeful', 'excited']
});
```

#### `createPositiveCheckin(user: User): Checkin`
Creates check-in with positive sentiment and high confidence.
```javascript
const positiveCheckin = MockCheckinFactory.createPositiveCheckin(user);
// High confidence, positive moods, minimal concerns
```

#### `createMixedSentimentCheckin(user: User): Checkin`
Creates check-in with mixed sentiment (positive overall, critical concerns).
```javascript
const mixedCheckin = MockCheckinFactory.createMixedSentimentCheckin(user);
// High general confidence, but low medication confidence (critical concern)
```

#### `createNegativeCheckin(user: User): Checkin`
Creates check-in with negative sentiment and low confidence.
```javascript
const negativeCheckin = MockCheckinFactory.createNegativeCheckin(user);
// Low confidence across all areas, negative moods
```

---

### **TestAssertions Class**

**Static Methods**

#### `assertQuestionRotation(questions: Question[], expectedRotation: Question[]): void`
Validates that questions match expected rotation pattern.
```javascript
TestAssertions.assertQuestionRotation(actualQuestions, [
  { id: 'medication_readiness_today', context: 'medication_preparation' },
  { id: 'confidence_today', context: 'general' }
]);
```

#### `assertSentimentClassification(result: SentimentResult, expectedSentiment: string, expectedConfidence?: number): void`
Validates sentiment analysis results.
```javascript
TestAssertions.assertSentimentClassification(
  sentimentResult,
  'mixed',
  0.8 // minimum confidence
);
```

#### `assertCriticalConcerns(result: SentimentResult, expectedConcerns: string[]): void`
Validates critical concern detection.
```javascript
TestAssertions.assertCriticalConcerns(sentimentResult, [
  'medication',
  'financial'
]);
```

#### `assertCopyVariant(insight: Insight, expectedType: string, shouldContainText?: string): void`
Validates insight copy variant selection.
```javascript
TestAssertions.assertCopyVariant(
  insight,
  'mixed_sentiment_medication',
  'clear up that confusion'
);
```

#### `assertTimeProgression(simulator: TimeSimulator, expectedDays: number): void`
Validates time progression over specified period.
```javascript
TestAssertions.assertTimeProgression(simulator, 30);
// Validates 30 days of progression work correctly
```

---

## 🔧 **Validation Functions**

### **Streak Calculation APIs**

#### `calculateCurrentStreak(userId: string, checkins: Checkin[]): StreakResult`
Calculates current and longest streaks for a user.
```javascript
interface StreakResult {
  current: number;
  longest: number;
}

const streak = calculateCurrentStreak(user.id, checkins);
console.log(`Current: ${streak.current}, Longest: ${streak.longest}`);
```

#### `checkStreakMilestone(streak: number): string | null`
Checks if streak represents a milestone achievement.
```javascript
const milestone = checkStreakMilestone(30);
// Returns: 'one_month' | null
```

#### `getStreakEncouragementMessage(streak: number): string`
Generates encouragement message based on streak length.
```javascript
const message = getStreakEncouragementMessage(14);
// Returns: "Two weeks strong - consistency is key!"
```

#### `calculateStreakRecovery(userId: string, checkins: Checkin[]): RecoveryData`
Analyzes streak recovery patterns after breaks.
```javascript
interface RecoveryData {
  isRecovering: boolean;
  previousBest: number;
  current: number;
  daysBroken: number;
}

const recovery = calculateStreakRecovery(user.id, checkins);
```

---

### **Weekly Insights APIs**

#### `generateWeeklyInsights(user: User, checkins: Checkin[], feedback?: InsightFeedback[]): WeeklyInsight[]`
Generates comprehensive weekly insights with trend analysis.
```javascript
interface WeeklyInsight {
  week: number;
  date_range: { start: Date; end: Date };
  sophistication_level: 'basic' | 'intermediate' | 'advanced';
  focus_area: string;
  stage_specific_insights: string;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
  achievements: string[];
  predictions?: Predictions;
  pattern_insight: string;
  risk_predictions: RiskPredictions;
  preemptive_support?: Support;
}

const insights = generateWeeklyInsights(user, checkins);
```

#### `generateWeeklySummary(user: User, checkins: Checkin[]): WeeklySummary`
Creates summary of most recent week's activity.
```javascript
interface WeeklySummary {
  check_in_streak: number;
  average_confidence: number;
  confidence_range: { high: number; low: number };
  mood_patterns: MoodPatterns;
  achievements: string[];
  growth_areas: string[];
}

const summary = generateWeeklySummary(user, recentCheckins);
```

#### `detectCyclicalPatterns(checkins: Checkin[]): PatternAnalysis`
Analyzes check-in data for cyclical patterns.
```javascript
interface PatternAnalysis {
  weekly_cycle: {
    confidence_dip: boolean;
    pattern_strength: number;
  };
}

const patterns = detectCyclicalPatterns(checkins);
```

---

## 🎯 **Test Runner APIs**

### **Command Line Interface**

#### `TimeSimulationTestRunner`
Main class for orchestrating comprehensive test suites.

```javascript
class TimeSimulationTestRunner {
  constructor()
  
  async runAllTests(): Promise<void>
  // Runs complete test suite
  
  async testQuestionRotation(): Promise<void>
  // Tests question adaptation over time
  
  async testStreakFunctionality(): Promise<void>
  // Tests streak calculation and recovery
  
  async testWeeklyInsights(): Promise<void>
  // Tests weekly insight generation
  
  async testFutureScenarios(): Promise<void>
  // Tests long-term scenario validation
  
  async runSpecificTest(testType: string): Promise<void>
  // Runs individual test suite
}
```

**Usage:**
```bash
# CLI usage
node scripts/run-time-simulation-tests.js [test-type]

# Programmatic usage
const runner = new TimeSimulationTestRunner();
await runner.runAllTests();
```

---

## 📊 **Response Formats**

### **Test Results Schema**

```javascript
interface TestResults {
  question_rotation: QuestionRotationResult[];
  streak_functionality: StreakFunctionalityResult[];
  weekly_insights: WeeklyInsightsResult[];
  future_scenarios: FutureScenarioResult[];
}

interface QuestionRotationResult {
  date: string;
  stage: string;
  week: number;
  question_id: string;
  question_context: string;
  total_questions: number;
}

interface StreakFunctionalityResult {
  day: number;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
}

interface WeeklyInsightsResult {
  week: number;
  trend: string;
  sophistication_level: string;
  achievements: string[];
  predictions?: any;
}
```

---

## 🔌 **Integration APIs**

### **Jest Integration**

```javascript
// Test setup for Jest integration
import { TimeSimulator, TestUserFactory, MockCheckinFactory } from '../time-simulation.test';

describe('Temporal Feature Tests', () => {
  let timeSimulator;

  beforeEach(() => {
    timeSimulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
    timeSimulator.start();
  });

  afterEach(() => {
    timeSimulator.stop();
  });

  test('should handle time progression correctly', () => {
    // Test implementation using framework APIs
  });
});
```

### **CI/CD Integration**

```bash
# Environment variables for CI/CD
export TIME_SIMULATION_TIMEOUT=30000  # 30 second timeout
export TIME_SIMULATION_MEMORY_LIMIT=100  # 100MB memory limit
export TIME_SIMULATION_VERBOSE=true  # Enable verbose logging

# Script execution
node scripts/run-time-simulation-tests.js all --ci-mode
```

---

## 🚨 **Error Responses**

### **Common Error Types**

```javascript
// Time simulation errors
class TimeSimulationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'TimeSimulationError';
    this.code = code;
  }
}

// Error codes
const ERROR_CODES = {
  SIMULATOR_NOT_STARTED: 'SIMULATOR_NOT_STARTED',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  CLEANUP_FAILED: 'CLEANUP_FAILED',
  MEMORY_LEAK_DETECTED: 'MEMORY_LEAK_DETECTED',
  TIME_PROGRESSION_FAILED: 'TIME_PROGRESSION_FAILED'
};
```

### **Error Handling Examples**

```javascript
try {
  simulator.advanceTime({ days: 7 });
} catch (error) {
  if (error.code === 'SIMULATOR_NOT_STARTED') {
    console.error('TimeSimulator must be started before advancing time');
    simulator.start();
    simulator.advanceTime({ days: 7 });
  } else {
    throw error;
  }
}
```

---

## 📈 **Performance Monitoring APIs**

### **Performance Metrics**

```javascript
interface PerformanceMetrics {
  execution_time: number;      // Test execution time in ms
  memory_usage: number;        // Peak memory usage in MB
  simulated_time_span: number; // Days of simulated time
  data_points_generated: number; // Number of mock data points
  assertions_validated: number;  // Number of test assertions
}

// Get performance metrics
const metrics = runner.getPerformanceMetrics();
console.log(`Test completed in ${metrics.execution_time}ms`);
```

This comprehensive API documentation provides complete programmatic access to the Time Simulation Testing Framework! 🚀 