# Field Mapping Audit Report

## Executive Summary
Our audit discovered **66 fields** that are collected in the frontend but NOT properly handled by the backend. This means users are filling out forms but much of their data is being silently dropped.

## Critical Findings

### 1. Enhanced Check-in Form Issues
The Enhanced Daily Check-in form collects extensive data but only sends basic fields to the backend:
- **Collected**: 41 fields including anxiety levels, side effects, coping strategies, partner involvement, etc.
- **Actually Saved**: Only 5 fields (mood, confidence, user_note, medication_taken, date_submitted)
- **Lost Data**: 36 fields stored only in localStorage, never persisted to database

### 2. Missing Critical Health Data
These important fields are NOT being saved:
- `anxiety_level` - Key mental health indicator
- `side_effects` - Critical for medication monitoring
- `missed_doses` - Important for adherence tracking
- `injection_confidence` - Key for stimulation phase users
- `coping_strategies_used` - Important for support recommendations
- `partner_involved_today` - Relationship health indicator
- `phq4_score`, `phq4_anxiety`, `phq4_depression` - Mental health assessments

### 3. Architecture Issue
The Enhanced form is using a "store in localStorage, send basics to backend" pattern:
```javascript
// Line 239: localStorage.setItem(`enhanced_checkin_${user?.email}_${todayString}`, JSON.stringify(enhancedData));
// But only sends 5 basic fields to the backend!
```

## Impact
1. **Data Loss**: Users spending time on detailed check-ins but data isn't saved
2. **Metrics Accuracy**: Outcome predictions and support recommendations based on incomplete data
3. **User Trust**: If users discover their detailed responses aren't being saved
4. **Clinical Value**: Missing critical health tracking data

## Immediate Actions Required

### Phase 1: Quick Fixes (Do Now)
1. Add critical fields to `PRODUCTION_AIRTABLE_SCHEMA` whitelist
2. Add fields to SQLite schema for dev/local consistency
3. Create fields in Airtable (staging & production)
4. Update backend to properly handle all fields

### Phase 2: Architecture Fix (Next Sprint)
1. Decide which fields to persist vs compute
2. Update Enhanced form to send all relevant fields
3. Consider breaking into multiple endpoints if needed
4. Add validation to prevent future field drops

## Recommended Field Additions

### High Priority (Health & Safety)
```javascript
// Add to PRODUCTION_AIRTABLE_SCHEMA
'anxiety_level',           // Mental health tracking
'side_effects',           // Array - medication monitoring  
'missed_doses',           // Number - adherence tracking
'injection_confidence',   // Number - stimulation phase
'phq4_score',            // Mental health assessment
'phq4_anxiety',          // Anxiety subscore
'phq4_depression',       // Depression subscore
```

### Medium Priority (Support & Engagement)
```javascript
'coping_strategies_used', // Array - what's working
'partner_involved_today', // Boolean - relationship health
'has_appointment',        // Boolean - upcoming stress
'appointment_anxiety',    // Number - support needs
'wish_knew_more_about',  // Array - education needs
```

## Prevention Strategy

1. **Pre-deployment Check**: Update script to catch field mismatches
2. **CI/CD Integration**: Run field audit on every PR
3. **Documentation**: Maintain field mapping documentation
4. **Code Review**: Check for localStorage-only patterns
5. **Testing**: Add E2E tests that verify field persistence

## Technical Debt
The current pattern of using localStorage for complex data while only persisting basics is problematic:
- Data loss on cache clear
- No cross-device access
- Can't analyze user patterns
- Can't provide proper clinical support

## Next Steps
1. Emergency patch for critical health fields
2. Architecture review for Enhanced form
3. Data migration plan for localStorage data
4. User communication about improvements