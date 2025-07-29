# Functional Logic: User Metrics Calculations

## Core Calculation Engine

### 1. Medication Adherence
```javascript
function calculateMedicationAdherence(checkins) {
  const lastWeek = getLast7Days(checkins);
  const medicationData = lastWeek.filter(c => c.medication_taken !== 'not tracked');
  
  if (medicationData.length === 0) return { rate: 0, trend: 'stable' };
  
  const taken = medicationData.filter(c => c.medication_taken === 'yes').length;
  const rate = Math.round((taken / medicationData.length) * 100);
  
  // Compare to previous week for trend
  const prevWeek = getPreviousWeek(checkins);
  const prevRate = calculatePreviousRate(prevWeek);
  
  let trend = 'stable';
  if (rate > prevRate + 5) trend = 'improving';
  else if (rate < prevRate - 5) trend = 'declining';
  
  return { rate, trend, missed: medicationData.length - taken };
}
```

### 2. PHQ-4 Mental Health Score
```javascript
function calculatePHQ4Score(checkins) {
  const moodScores = {
    'amazing': 1,
    'good': 2,
    'okay': 3,
    'tough': 4,
    'very tough': 5
  };
  
  const lastWeek = getLast7Days(checkins);
  const scores = lastWeek.map(c => moodScores[c.mood_today] || 3);
  
  if (scores.length === 0) return { score: 0, trend: 'stable' };
  
  const avgMood = scores.reduce((a, b) => a + b, 0) / scores.length;
  const phq4Score = Math.round((avgMood - 1) * 3); // Scale to 0-12
  
  return { score: phq4Score, trend: calculateTrend(phq4Score, prevScore) };
}
```

### 3. Check-in Streak
```javascript
function calculateCheckInStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  
  const sorted = checkins.sort((a, b) => 
    new Date(b.date_submitted) - new Date(a.date_submitted)
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sorted.length; i++) {
    const checkinDate = new Date(sorted[i].date_submitted);
    checkinDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (checkinDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  
  return streak;
}
```

### 4. Cycle Completion Probability
```javascript
function calculateCycleCompletionProbability(metrics) {
  let score = 50; // Base score
  
  // Adherence factor (up to +20)
  if (metrics.medicationAdherenceRate >= 90) score += 20;
  else if (metrics.medicationAdherenceRate >= 80) score += 15;
  else if (metrics.medicationAdherenceRate >= 70) score += 10;
  else score += 5;
  
  // Mental health factor (up to +15)
  if (metrics.currentPHQ4Score < 3) score += 15;
  else if (metrics.currentPHQ4Score < 6) score += 10;
  else if (metrics.currentPHQ4Score < 9) score += 5;
  
  // Engagement factor (up to +15)
  if (metrics.checkInStreak >= 7) score += 15;
  else if (metrics.checkInStreak >= 3) score += 10;
  else score += 5;
  
  return Math.min(95, Math.max(25, score));
}
```

### 5. Risk & Protective Factors
```javascript
function identifyFactors(metrics, checkins) {
  const risks = [];
  const protective = [];
  
  // Risk factors
  if (metrics.medicationAdherenceRate < 80) 
    risks.push('Low medication adherence');
  if (metrics.currentPHQ4Score >= 6) 
    risks.push('Elevated anxiety/depression');
  if (metrics.checkInStreak < 3) 
    risks.push('Inconsistent tracking');
  
  // Protective factors
  if (metrics.medicationAdherenceRate >= 85) 
    protective.push('Strong medication adherence');
  if (metrics.partnerInvolvementRate >= 50) 
    protective.push('Active partner support');
  if (metrics.checkInStreak >= 7) 
    protective.push('Consistent daily check-ins');
  
  return { risks, protective };
}
```

## Data Processing Flow
```
User Request → Fetch Check-ins → Calculate Metrics → Apply Research → Return JSON
      ↓             ↓                   ↓                 ↓              ↓
   Auth Check   Last 30 days      All formulas      Risk/Success    Frontend
```

## Performance Optimizations
1. **Caching**: Results cached for 5 minutes
2. **Batching**: All calculations in single pass
3. **Limits**: Max 100 check-ins analyzed
4. **Async**: Non-blocking calculations