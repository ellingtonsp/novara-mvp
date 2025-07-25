# Time Simulation Testing Framework

## 🎯 **Feature Overview**

The Time Simulation Testing Framework is a comprehensive testing infrastructure that enables validation of time-dependent features across the Novara MVP application. This framework is critical for ensuring robust behavior of temporal features like question rotation, streak calculations, weekly insights, and future scenario planning.

## 🚀 **Quick Reference**

### **Core Components**
- **TimeSimulator**: Controls time progression for testing
- **TestUserFactory**: Creates realistic test users across cycle stages
- **MockCheckinFactory**: Generates varied check-in data patterns
- **TestAssertions**: Helper functions for common validations

### **Key Test Suites**
- **Question Rotation**: Tests adaptation to cycle stages and confidence levels
- **Streak Functionality**: Validates streak calculation, resets, and recovery
- **Weekly Insights**: Tests pattern recognition and trend analysis
- **Future Scenarios**: Long-term behavior validation

### **Quick Commands**
```bash
# Run all time simulation tests
node scripts/run-time-simulation-tests.js

# Run specific test suites
node scripts/run-time-simulation-tests.js questions
node scripts/run-time-simulation-tests.js streaks
node scripts/run-time-simulation-tests.js insights
node scripts/run-time-simulation-tests.js future-scenarios

# Jest integration
npm test test/unit/time-simulation.test.js
npm test test/unit/question-rotation.test.js
npm test test/unit/streak-functionality.test.js
npm test test/unit/weekly-insights.test.js
```

## 📋 **Business Value**

### **Patient-First Benefits**
- **Consistent Experience**: Ensures questions adapt appropriately as patients progress through their journey
- **Reliable Motivation**: Validates streak systems provide accurate encouragement and recovery support
- **Personalized Insights**: Tests that weekly insights accurately reflect patient patterns and needs
- **Future Planning**: Validates system behavior across extended treatment timelines

### **Development Benefits**
- **Temporal Feature Validation**: Test features across days, weeks, and months
- **Pattern Recognition Testing**: Validate trend detection and cyclical patterns
- **Future-Proof Development**: Test scenarios months in advance
- **Performance Monitoring**: Ensure system scales over time

## 🎯 **Strategic Alignment**

### **Roadmap Connection**
- **Epic**: CM-01 — Positive-Reflection NLP & Dynamic Copy
- **Story ID**: CM-01 (Enhanced sentiment analysis and copy variants)
- **Mission Alignment**: Accelerates patient access to accurate insights through robust temporal testing

### **Success Metrics Support**
- **Quality Assurance**: Reduces defect escape rate through comprehensive temporal testing
- **Development Velocity**: Enables confident feature iteration through automated testing
- **Documentation Coverage**: 100% documentation of temporal features and testing procedures

## 🔧 **Technical Implementation**

### **Framework Architecture**
```
Time Simulation Framework
├── Core Framework (time-simulation.test.js)
│   ├── TimeSimulator - Time control and progression
│   ├── TestUserFactory - Realistic user profile creation
│   ├── MockCheckinFactory - Check-in data generation
│   └── TestAssertions - Common validation helpers
├── Question Rotation Tests (question-rotation.test.js)
├── Streak Functionality Tests (streak-functionality.test.js)
├── Weekly Insights Tests (weekly-insights.test.js)
└── Test Runner (run-time-simulation-tests.js)
```

### **Integration Points**
- **Backend Server**: Question generation logic (`backend/server.js`)
- **Frontend Components**: Check-in forms and insight displays
- **Sentiment Analysis**: Mixed sentiment detection system
- **Analytics**: Event tracking and feedback systems

## 📊 **Testing Coverage**

### **Temporal Scenarios Covered**
- ✅ 16-week IVF journey progression
- ✅ 30-day streak building with resets
- ✅ 5-week confidence progression patterns
- ✅ 6-month future scenario planning
- ✅ Cyclical pattern detection (weekend dips, weekly cycles)
- ✅ Recovery and motivation systems
- ✅ Performance over extended periods

### **Edge Cases Validated**
- ✅ Multiple check-ins per day
- ✅ Streak resets and recovery patterns
- ✅ Confidence threshold transitions
- ✅ Cycle stage progression triggers
- ✅ Emergency question activation
- ✅ Insight quality feedback loops

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js environment
- Jest testing framework
- Project dependencies installed

### **Basic Usage**
```javascript
// Import framework
const { TimeSimulator, TestUserFactory, MockCheckinFactory } = require('./test/unit/time-simulation.test');

// Create test scenario
const simulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
simulator.start();

const user = TestUserFactory.createNewUser();
simulator.advanceTime({ weeks: 8 });

// Run tests
const questions = await generateQuestionsForUser(user);
expect(questions.find(q => q.context === 'medication_preparation')).toBeDefined();

simulator.stop();
```

## 📈 **Performance Characteristics**

### **Test Execution Times**
- **Question Rotation**: ~2-3 seconds for full 16-week simulation
- **Streak Functionality**: ~1-2 seconds for 30-day progression
- **Weekly Insights**: ~3-4 seconds for 5-week analysis
- **Future Scenarios**: ~2-3 seconds for 6-month simulation

### **Memory Usage**
- **Lightweight**: <50MB for complete test suite
- **Scalable**: Handles 3-month+ simulations efficiently
- **Clean**: Automatic cleanup prevents memory leaks

## 🔍 **Troubleshooting**

### **Common Issues**
1. **Memory Leaks**: Always call `simulator.stop()` in test cleanup
2. **Date Inconsistencies**: Use `simulator.getCurrentDateString()` for formatting
3. **Timezone Issues**: Use UTC dates to avoid complications
4. **Performance**: Batch operations for large datasets

### **Debug Commands**
```javascript
// Verify time simulation is active
console.log('Current simulated time:', simulator.getCurrentISO());
console.log('Date.now():', new Date(Date.now()).toISOString());
console.log('new Date():', new Date().toISOString());
```

## 📚 **Related Documentation**

- **[User Journey](user-journey.md)** - Complete testing workflows and scenarios
- **[Functional Logic](functional-logic.md)** - Technical implementation details
- **[API Endpoints](api-endpoints.md)** - Testing framework APIs
- **[Testing Scenarios](testing-scenarios.md)** - Comprehensive test cases
- **[Deployment Notes](deployment-notes.md)** - CI/CD integration
- **[Downstream Impact](downstream-impact.md)** - Affected components

## 💡 **Future Enhancements**

### **Planned Features**
- **Real-time Simulation**: Connect to live system for hybrid testing
- **ML Pattern Generation**: Realistic user behavior from ML models
- **Multi-timezone Testing**: Cross-timezone validation
- **Performance Benchmarking**: Automated regression detection

### **Advanced Scenarios**
- **Pregnancy Journey**: 40-week progression simulation
- **Multiple Cycles**: Success/failure cycle testing
- **Seasonal Patterns**: Calendar-based mood variations
- **Medication Adherence**: Complex dosing schedules 