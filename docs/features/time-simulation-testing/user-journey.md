# Time Simulation Testing Framework - User Journey Documentation

## 👥 **Target Users**

### **Primary Users**
- **Developers**: Creating and validating temporal features
- **QA Engineers**: Testing time-dependent functionality
- **Product Managers**: Validating user experience over time
- **Data Scientists**: Analyzing behavioral patterns and trends

### **Secondary Users**
- **DevOps Engineers**: Integrating temporal tests into CI/CD
- **Technical Writers**: Documenting temporal behaviors
- **Support Teams**: Understanding time-based feature behavior

## 🎯 **User Scenarios**

### **Scenario 1: Developer Testing Question Rotation**

**Context**: A developer has implemented new question logic that should adapt as users progress through their IVF cycle stages.

**User Journey:**
1. **Setup Test Environment**
   ```bash
   # Developer starts with clean environment
   cd novara-mvp
   npm test test/unit/question-rotation.test.js
   ```

2. **Create Test User**
   ```javascript
   const user = TestUserFactory.createNewUser(); // Starts in 'considering' stage
   const simulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
   simulator.start();
   ```

3. **Simulate IVF Journey Progression**
   ```javascript
   // Week 1-2: Considering IVF
   let questions = await generateQuestionsForUser(user);
   expect(questions.find(q => q.id === 'medication_readiness_today')).toBeDefined();
   
   // Advance to IVF prep stage
   simulator.advanceTime({ weeks: 4 });
   user.cycle_stage = 'ivf_prep';
   questions = await generateQuestionsForUser(user);
   expect(questions.find(q => q.context === 'medication_preparation')).toBeDefined();
   
   // Advance to stimulation
   simulator.advanceTime({ weeks: 4 });
   user.cycle_stage = 'stimulation';
   questions = await generateQuestionsForUser(user);
   expect(questions.find(q => q.id === 'medication_confidence_today')).toBeDefined();
   ```

4. **Validate Question Adaptation**
   - Verify preparation questions appear during early stages
   - Confirm active treatment questions appear during stimulation
   - Ensure pregnancy questions appear after success
   - Test confidence-based follow-up logic

5. **Cleanup and Results**
   ```javascript
   simulator.stop(); // Critical cleanup step
   // Review test results and question progression patterns
   ```

**Expected Outcomes:**
- ✅ Questions adapt correctly to each cycle stage
- ✅ Confidence levels trigger appropriate follow-ups
- ✅ Emergency questions appear for critical situations
- ✅ No memory leaks or time state pollution

---

### **Scenario 2: QA Engineer Testing Streak Functionality**

**Context**: A QA engineer needs to validate that streak calculations, resets, and recovery systems work correctly across various check-in patterns.

**User Journey:**
1. **Initialize Streak Testing**
   ```bash
   node scripts/run-time-simulation-tests.js streaks
   ```

2. **Test Basic Streak Building**
   ```javascript
   const user = TestUserFactory.createUser();
   const checkins = [];
   
   // Build 14-day streak
   for (let day = 1; day <= 14; day++) {
     simulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
     checkins.push(MockCheckinFactory.createCheckin(user, {
       date_submitted: simulator.getCurrentDateString()
     }));
   }
   
   const streak = calculateCurrentStreak(user.id, checkins);
   expect(streak.current).toBe(14);
   expect(streak.longest).toBe(14);
   ```

3. **Test Streak Reset and Recovery**
   ```javascript
   // Skip day 15 (breaks streak)
   simulator.setDate('2025-01-16T10:00:00.000Z');
   checkins.push(MockCheckinFactory.createCheckin(user, {
     date_submitted: simulator.getCurrentDateString()
   }));
   
   // Verify streak reset
   const resetStreak = calculateCurrentStreak(user.id, checkins);
   expect(resetStreak.current).toBe(1); // New streak started
   expect(resetStreak.longest).toBe(14); // Previous best preserved
   ```

4. **Test Milestone Detection**
   ```javascript
   // Test various milestone achievements
   const milestones = [7, 14, 30, 50, 100];
   milestones.forEach(days => {
     const milestone = checkStreakMilestone(days);
     if (days === 7) expect(milestone).toBe('first_week');
     if (days === 30) expect(milestone).toBe('one_month');
   });
   ```

5. **Validate Recovery Motivation**
   ```javascript
   const recoveryData = calculateStreakRecovery(user.id, checkins);
   expect(recoveryData.isRecovering).toBeTruthy();
   expect(recoveryData.previousBest).toBe(14);
   
   const motivationMessage = getRecoveryMotivationMessage(recoveryData);
   expect(motivationMessage).toContain('comeback');
   ```

**Expected Outcomes:**
- ✅ Consecutive days correctly counted
- ✅ Multiple same-day check-ins count as one
- ✅ Streak resets work properly after missed days
- ✅ Milestone achievements trigger correctly
- ✅ Recovery motivation provides appropriate support

---

### **Scenario 3: Product Manager Validating Weekly Insights**

**Context**: A Product Manager wants to ensure weekly insights provide valuable, accurate, and evolving feedback to users over time.

**User Journey:**
1. **Setup Insight Analysis Environment**
   ```bash
   node scripts/run-time-simulation-tests.js insights
   ```

2. **Create Realistic User Pattern**
   ```javascript
   const user = TestUserFactory.createUser();
   const confidenceProgression = [
     [3, 3, 4, 3, 4, 3, 4], // Week 1: Low baseline (avg 3.4)
     [4, 4, 5, 4, 5, 5, 4], // Week 2: Improving (avg 4.4)
     [5, 6, 5, 6, 6, 5, 6], // Week 3: Good progress (avg 5.6)
     [6, 7, 6, 7, 7, 6, 7], // Week 4: Strong confidence (avg 6.6)
     [7, 6, 5, 4, 3, 4, 5]  // Week 5: Challenge week (avg 5.1)
   ];
   ```

3. **Simulate 5-Week Journey**
   ```javascript
   let dayCounter = 1;
   const checkins = [];
   
   confidenceProgression.forEach((week, weekIndex) => {
     week.forEach(confidence => {
       simulator.setDate(`2025-01-${String(dayCounter).padStart(2, '0')}T10:00:00.000Z`);
       
       checkins.push(MockCheckinFactory.createCheckin(user, {
         confidence_today: confidence,
         medication_confidence_today: confidence,
         mood_today: confidence >= 6 ? ['hopeful', 'energetic'] : ['anxious', 'overwhelmed'],
         date_submitted: simulator.getCurrentDateString()
       }));
       
       dayCounter++;
     });
   });
   ```

4. **Analyze Weekly Insights Evolution**
   ```javascript
   const weeklyInsights = generateWeeklyInsights(user, checkins);
   
   // Validate trend detection
   expect(weeklyInsights[0].trend).toBe('improving'); // Week 1→2 improvement
   expect(weeklyInsights[3].trend).toBe('improving'); // Strong week 4
   expect(weeklyInsights[4].trend).toBe('declining'); // Challenge week 5
   
   // Verify sophistication progression
   expect(weeklyInsights[0].sophistication_level).toBe('basic');
   expect(weeklyInsights[4].sophistication_level).toBe('advanced');
   
   // Check achievement detection
   expect(weeklyInsights[3].achievements).toContain('high_confidence_week');
   ```

5. **Validate Pattern Recognition**
   ```javascript
   // Test cyclical pattern detection
   const patterns = detectCyclicalPatterns(checkins);
   
   // Test prediction capabilities
   const predictions = weeklyInsights[4].predictions;
   expect(predictions.confidence_trajectory).toBe('needs_support'); // After decline
   expect(predictions.next_week_confidence).toBeLessThan(6); // Realistic prediction
   ```

**Expected Outcomes:**
- ✅ Insights accurately reflect confidence trends
- ✅ Sophistication increases with more data
- ✅ Achievements and milestones are detected
- ✅ Predictions provide realistic expectations
- ✅ Pattern recognition identifies cyclical behaviors

---

### **Scenario 4: DevOps Engineer Integrating CI/CD Testing**

**Context**: A DevOps engineer needs to integrate time simulation tests into the automated testing pipeline.

**User Journey:**
1. **Setup CI/CD Integration**
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

2. **Configure Test Performance Monitoring**
   ```javascript
   // Add performance tracking
   const startTime = Date.now();
   await runTimeSimulationTest();
   const duration = Date.now() - startTime;
   
   expect(duration).toBeLessThan(10000); // Should complete in <10 seconds
   ```

3. **Setup Test Result Reporting**
   ```bash
   # Generate test reports
   node scripts/run-time-simulation-tests.js > test-results/temporal-tests.log
   
   # Validate test completion
   if [ $? -eq 0 ]; then
     echo "✅ Temporal tests passed"
   else
     echo "❌ Temporal tests failed"
     exit 1
   fi
   ```

4. **Monitor Test Metrics**
   - Test execution time tracking
   - Memory usage monitoring
   - Coverage reporting for temporal features
   - Performance regression detection

**Expected Outcomes:**
- ✅ Tests integrate seamlessly with CI/CD pipeline
- ✅ Performance metrics are tracked and reported
- ✅ Test failures are clearly identified and reported
- ✅ Regression detection prevents temporal bugs

---

## 🔄 **Common User Workflows**

### **Daily Development Workflow**
1. **Developer makes changes** to temporal features
2. **Run targeted tests**: `npm test test/unit/question-rotation.test.js`
3. **Validate changes** with specific time scenarios
4. **Commit changes** with confidence in temporal behavior

### **Weekly QA Workflow**
1. **Run comprehensive suite**: `node scripts/run-time-simulation-tests.js all`
2. **Review test results** and identify patterns
3. **Report findings** to development team
4. **Validate fixes** with targeted re-testing

### **Release Testing Workflow**
1. **Full temporal validation** across all features
2. **Long-term scenario testing** (3+ months simulation)
3. **Performance benchmarking** against previous releases
4. **User journey validation** end-to-end

## 📊 **Success Metrics**

### **User Experience Metrics**
- **Test Execution Speed**: <10 seconds for full suite
- **Coverage Completeness**: 100% of temporal features tested
- **Bug Detection Rate**: Early detection of time-dependent issues
- **Developer Productivity**: Reduced manual testing time

### **Quality Metrics**
- **Regression Prevention**: Zero temporal bugs in production
- **Pattern Accuracy**: Correct trend and cycle detection
- **Performance Consistency**: Stable behavior over time periods
- **User Journey Integrity**: Complete workflow validation

## 💡 **User Tips and Best Practices**

### **For Developers**
- Always use `TimeSimulator` for consistent time control
- Include both positive and edge case scenarios
- Test confidence threshold transitions thoroughly
- Validate cleanup with `simulator.stop()`

### **For QA Engineers**
- Create realistic user patterns, not perfect progressions
- Test streak recovery scenarios extensively
- Validate milestone and achievement systems
- Monitor for performance degradation over time

### **For Product Managers**
- Review insight quality and relevance regularly
- Validate prediction accuracy against real patterns
- Ensure motivational messages are appropriate
- Test various user journey paths

## 🚨 **Error Handling and Recovery**

### **Common Issues and Solutions**
1. **Memory Leaks**: Always call `simulator.stop()` in cleanup
2. **Date Inconsistencies**: Use `simulator.getCurrentDateString()`
3. **Performance Issues**: Batch operations, avoid excessive loops
4. **State Pollution**: Isolate tests with fresh simulator instances

### **Debugging Workflows**
```javascript
// Enable debug logging
simulator.start();
console.log('🕐 Simulation started:', simulator.getCurrentISO());

// Verify time override
console.log('Date.now():', new Date(Date.now()).toISOString());
console.log('new Date():', new Date().toISOString());

// Check progression
simulator.advanceTime({ days: 7 });
console.log('⏭️ Advanced 7 days:', simulator.getCurrentISO());
```

This comprehensive user journey documentation ensures all stakeholders can effectively utilize the Time Simulation Testing Framework to validate temporal features across the Novara MVP platform! 🚀 