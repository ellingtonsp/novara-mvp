# 📊 Airtable Schema Updates for Evidence-Based Features

## Current Status (as of deployment)

### ✅ Existing Tables
- **Users** - Profile and preferences
- **DailyCheckins** - Basic mood and confidence tracking
- **WeeklyCheckins** - Weekly reflections
- **UserFlags** - Feature flags
- **InsightEngagement** - Tracking insight interactions

### ❌ Missing Tables Required
- **FVMAnalytics** - Event tracking for outcomes
- **PHQ4Assessments** - Mental health assessments
- **MedicationAdherence** - Detailed medication tracking
- **AppointmentFeedback** - Post-appointment insights
- **CycleOutcomes** - Treatment outcome correlations

## 🚨 Immediate Schema Updates Required

### 1. Enhanced DailyCheckins Fields
The current DailyCheckins table needs additional fields to support our evidence-based features:

```
Table: DailyCheckins
New Fields to Add:
├── anxiety_level (Number - 1-10)
├── took_all_medications (Checkbox)
├── missed_doses (Number)
├── injection_confidence (Number - 1-10, optional)
├── side_effects (Long Text - JSON array)
├── appointment_within_3_days (Checkbox)
├── appointment_anxiety (Number - 1-10, optional)
├── coping_strategies_used (Long Text - JSON array)
├── partner_involved_today (Checkbox)
├── wish_knew_more_about (Long Text - JSON array)
└── enhanced_data (Long Text - JSON for additional metrics)
```

### 2. Create FVMAnalytics Table
As documented in the migration guide, this table is critical for tracking outcomes:

```
Table: FVMAnalytics
├── Id (Primary Key)
├── user_id (Link to Users)
├── event_type (Single Select)
│   Options: check_in_preference_selected, phq4_completed, 
│           medication_missed, high_anxiety_recorded
├── event_timestamp (Date & Time)
├── event_data (Long Text - JSON)
└── created_at (Created Time)
```

### 3. Create PHQ4Assessments Table
For mental health tracking and outcome correlation:

```
Table: PHQ4Assessments
├── Id (Primary Key)
├── user_id (Link to Users)
├── total_score (Number)
├── anxiety_score (Number)
├── depression_score (Number)
├── risk_level (Single Select: minimal, mild, moderate, severe)
├── assessment_date (Date)
└── created_at (Created Time)
```

## 🔄 Backend Compatibility

The backend currently stores enhanced check-in data in localStorage on the frontend because the Airtable schema doesn't support these fields. To fully enable the evidence-based features:

1. **Update DailyCheckins** table with new fields
2. **Modify backend** to accept and store enhanced fields
3. **Update database-factory.js** to map new fields
4. **Test data flow** from frontend through to Airtable

## 📋 Migration Steps

### Phase 1: Core Fields (Do First)
1. Add enhanced fields to DailyCheckins table
2. Test with a few check-ins to ensure compatibility
3. Update backend to persist enhanced data

### Phase 2: Analytics Tables (This Week)
1. Create FVMAnalytics table
2. Create PHQ4Assessments table
3. Update backend endpoints to write to these tables

### Phase 3: Outcome Tracking (Next Sprint)
1. Create MedicationAdherence table
2. Create AppointmentFeedback table
3. Create CycleOutcomes table
4. Build outcome correlation views

## ⚠️ Important Notes

1. **Data Loss Risk**: Currently, enhanced check-in data (anxiety levels, medication adherence, etc.) is only stored in localStorage and not persisted to Airtable.

2. **A/B Testing**: Check-in preference data for A/B testing is not being captured in Airtable.

3. **PHQ-4 Data**: Mental health assessments are completed but results aren't stored.

4. **Outcome Predictions**: The outcome prediction engine works but has no historical data to improve accuracy.

## 🎯 Benefits Once Implemented

- Track medication adherence impact on cycle success
- Correlate anxiety levels with treatment outcomes  
- Identify which interventions improve outcomes
- Personalize support based on historical patterns
- Generate evidence-based insights for users

## 🚀 Next Steps

1. **Immediate**: Add enhanced fields to DailyCheckins table
2. **This Week**: Create FVMAnalytics and PHQ4Assessments tables
3. **Update Backend**: Modify endpoints to handle new fields
4. **Test E2E**: Verify data flows from frontend to Airtable