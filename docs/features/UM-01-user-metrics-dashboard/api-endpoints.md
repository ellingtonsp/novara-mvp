# API Endpoints: User Metrics

## GET /api/users/metrics

Calculates and returns comprehensive user metrics based on check-in history.

### Authentication
Required: Bearer token in Authorization header

### Request
```http
GET /api/users/metrics
Authorization: Bearer <token>
```

### Response (Success - 200)
```json
{
  "success": true,
  "metrics": {
    "medicationAdherenceRate": 85,
    "medicationAdherenceTrend": "improving",
    "missedDosesLastWeek": 1,
    "currentPHQ4Score": 4,
    "phq4Trend": "improving",
    "anxietyAverage": 5.2,
    "checkInStreak": 7,
    "totalCheckIns": 42,
    "insightEngagementRate": 76,
    "checklistCompletionRate": 82,
    "copingStrategiesUsed": ["Deep breathing", "Partner support"],
    "mostEffectiveStrategy": "Deep breathing",
    "partnerInvolvementRate": 65,
    "cycleCompletionProbability": 87,
    "riskFactors": ["High anxiety days"],
    "protectiveFactors": ["Strong medication adherence", "Partner support"],
    "lastUpdated": "2025-07-29T10:00:00Z",
    "dataRange": {
      "from": "2025-06-29",
      "to": "2025-07-29"
    }
  },
  "user_id": "user123"
}
```

### Response (No Data - 200)
```json
{
  "success": true,
  "metrics": {
    "medicationAdherenceRate": 0,
    "medicationAdherenceTrend": "stable",
    "missedDosesLastWeek": 0,
    "currentPHQ4Score": 0,
    "phq4Trend": "stable",
    "anxietyAverage": 0,
    "checkInStreak": 0,
    "totalCheckIns": 0,
    "insightEngagementRate": 0,
    "checklistCompletionRate": 0,
    "copingStrategiesUsed": [],
    "mostEffectiveStrategy": "None tracked yet",
    "partnerInvolvementRate": 0,
    "cycleCompletionProbability": 50,
    "riskFactors": ["No data available yet"],
    "protectiveFactors": ["Start tracking to see your strengths"]
  }
}
```

### Error Responses
- **401 Unauthorized**: Missing or invalid token
- **404 Not Found**: User not found
- **500 Server Error**: Calculation error

## Calculation Logic

### Medication Adherence
```javascript
adherenceRate = (dosesTaken / totalDoses) * 100
trend = compareToLastWeek(adherenceRate)
```

### PHQ-4 Score Approximation
```javascript
moodToScore = {
  'amazing': 1,
  'good': 2,
  'okay': 3,
  'tough': 4,
  'very tough': 5
}
phq4Score = (avgMoodScore - 1) * 3
```

### Cycle Completion Probability
```javascript
base = 50
+ adherenceBonus (0-20)
+ mentalHealthBonus (0-15)
+ engagementBonus (0-15)
= probability (25-95%)
```

### Check-in Streak
Counts consecutive days with check-ins from today backwards.

## Performance Considerations
- Caches calculations for 5 minutes
- Limits analysis to last 100 check-ins
- Async calculation of complex metrics