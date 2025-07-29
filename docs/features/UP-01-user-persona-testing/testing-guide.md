# Testing Guide: Emily Persona Journey

## Test Script Overview
The `test-emily-journey.js` script simulates Emily's complete experience, tracking both friction points and value moments throughout her journey.

## Running the Test

### Basic Execution
```bash
node scripts/test-emily-journey.js
```

### What It Tests
1. **Onboarding Flow** (2-minute target)
2. **Welcome Insight** (10-minute delivery)
3. **Daily Check-ins** (Days 1, 3, 7, 14, 21)
4. **Metrics Dashboard** (Progress visualization)
5. **Re-engagement** (48-hour nudge)

### Test Output Structure
```
=== EMILY'S JOURNEY SUMMARY REPORT ===
Overall Satisfaction Score: 91.7%
Value Moments: 11
Friction Points: 1

TOP VALUE MOMENTS:
1. Quick onboarding process
2. Personal touch with nickname
3. Rapid insight delivery
...

CRITICAL FRICTION POINTS:
1. No actionable advice in first insight
...

RECOMMENDATIONS:
1. Streamline onboarding further
2. Add extra support on tough days
...

EMILY'S VERDICT:
"This app gets me..." ⭐⭐⭐⭐⭐
```

## Customizing the Test

### Modify Emily's Moods
```javascript
const EMILY_MOODS = {
  signup: { mood: 'hopeful', confidence: 6 },
  day1: { mood: 'anxious', confidence: 5 },
  // Add more days or change values
};
```

### Add New Friction Points
```javascript
addFrictionPoint(
  'Stage Name',
  'What went wrong',
  'Impact on Emily'
);
```

### Track New Value Moments
```javascript
addValueMoment(
  'Stage Name',
  'What delighted her',
  'Emily's reaction quote'
);
```

## Interpreting Results

### Satisfaction Score
- **90%+**: Excellent, Emily loves it
- **70-89%**: Good with improvements needed
- **<70%**: Major friction, needs work

### Value/Friction Ratio
- Target: 10:1 or better
- Current: 11:1 (excellent)

### Key Success Metrics
- ✅ Onboarding < 2 minutes
- ✅ First insight < 10 minutes
- ✅ Check-in completion ease
- ✅ Progress visibility
- ❌ Actionable first insight

## Extending the Test

### Add New Personas
1. Copy test-emily-journey.js
2. Update persona details
3. Modify expectations
4. Adjust friction/value criteria

### Test Specific Features
```javascript
// Add after Stage 5
async function testNewFeature() {
  log('STAGE 6: Testing [Feature]', 'emily');
  // Implementation
}
```

### Integration with WTP
The test includes willingness-to-pay markers:
- Value moments increase WTP
- Friction points decrease WTP
- Final score influences price sensitivity

## Maintenance

### When to Update
- New features added
- User flow changes
- Persona research updates
- Pricing model changes

### Validation
Run after every sprint to ensure:
- No new friction introduced
- Value moments preserved
- Emily's needs still met