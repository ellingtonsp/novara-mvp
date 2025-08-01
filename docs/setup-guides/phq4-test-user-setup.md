# PHQ-4 Test User Setup Guide

## Overview

This guide documents the setup of test user accounts configured for PHQ-4 assessment testing. The PHQ-4 (Patient Health Questionnaire-4) is a validated mental health screening tool that the application uses for systematic mental health monitoring.

## Test Users Created

### Primary PHQ-4 Test User
- **Email:** `phq4-test@novara.com`
- **Password:** (No password - use test login flow)
- **User ID:** `871a5ddf-8b30-47bc-b50d-77922e6b509a`
- **Purpose:** Dedicated PHQ-4 testing and development
- **Status:** ✅ Ready for PHQ-4 assessment

**Configuration:**
- ✅ Onboarding completed (`baseline_completed: true`)
- ✅ Sample data: 3 days of check-ins for realistic testing
- ✅ No existing PHQ-4 assessments (ready for first assessment)
- ✅ Complete user profile with confidence scores and journey context

### Secondary PHQ-4 Test User (BUG-009)
- **Email:** `bug009@test.com`
- **Password:** `Test123!`
- **User ID:** `d8592a8f-6b8a-4828-9aa4-f3a0bddc423b`
- **Purpose:** Dual-purpose testing (bug fixes + PHQ-4)
- **Status:** ✅ Ready for PHQ-4 assessment

**Configuration:**
- ✅ Onboarding completed (`baseline_completed: true`)
- ✅ Existing check-in data from previous bug testing
- ✅ PHQ-4 history cleared to trigger fresh assessment
- ✅ Can be used for both bug testing and PHQ-4 development

## Database Schema

The test users are configured in the PostgreSQL database with Schema V2:

### Users Table
```sql
SELECT id, email, created_at FROM users 
WHERE email IN ('phq4-test@novara.com', 'bug009@test.com');
```

### User Profiles Table
```sql  
SELECT user_id, nickname, baseline_completed, confidence_meds, 
       confidence_costs, confidence_overall, primary_need, cycle_stage
FROM user_profiles 
WHERE user_id IN (SELECT id FROM users WHERE email IN ('phq4-test@novara.com', 'bug009@test.com'));
```

### Health Events (Sample Data)
```sql
SELECT user_id, event_type, event_subtype, occurred_at, event_data
FROM health_events 
WHERE user_id IN (SELECT id FROM users WHERE email IN ('phq4-test@novara.com', 'bug009@test.com'))
ORDER BY occurred_at DESC;
```

## PHQ-4 Readiness Criteria

For a user to be ready for PHQ-4 assessment:

1. **Onboarding Complete:** `baseline_completed = true`
2. **No Recent PHQ-4:** Either no assessments or last assessment >14 days ago
3. **Valid Profile:** Complete user profile with required fields

Both test users meet these criteria.

## Scripts Available

### Setup Script
```bash
cd backend
node scripts/setup-phq4-test-user.js
```
- Creates new PHQ-4 test user
- Updates existing user if found
- Adds sample check-in data
- Clears PHQ-4 history to ensure fresh assessment

### Update Script (BUG-009)
```bash
cd backend  
node scripts/update-bug009-for-phq4.js
```
- Updates existing BUG-009 user for PHQ-4 readiness
- Ensures baseline completion
- Clears PHQ-4 history

### Verification Script
```bash
cd backend
node scripts/verify-phq4-test-user.js
```
- Verifies both test users are correctly configured
- Checks onboarding status, PHQ-4 history, and sample data
- Provides testing guidance

## Current PHQ-4 Implementation Status

### ✅ Completed
- PHQ-4 Assessment component (`PHQ4Assessment.tsx`)
- Database schema supports PHQ-4 data storage
- Dashboard displays PHQ-4 scores when available
- Test users configured and ready

### ⏳ Pending (MH-01 Story)
- **Smart Scheduling Logic:** Automatic PHQ-4 prompting based on intervals
- **Dashboard Integration:** Cards/prompts when PHQ-4 is due
- **API Endpoints:** `/api/phq4/status`, `/api/phq4/complete`, etc.
- **Risk-based Frequency:** Adjust intervals based on scores
- **Direct Route:** `/phq4` for standalone access

## Testing Instructions

### Current Testing (Manual)
1. Start development servers (Frontend: 4200, Backend: 9002)
2. Login with either test user
3. Navigate to components that use PHQ-4 directly
4. Test the PHQ-4 Assessment component functionality

### Future Testing (When MH-01 Implemented)
1. Login with test user
2. Dashboard should show PHQ-4 prompt/card
3. Complete assessment through prompted flow
4. Verify scheduling logic (next due date calculation)
5. Test risk-based frequency adjustments

## Notes

- **No Password Required:** Primary test user uses test login flow
- **Local Database:** Uses PostgreSQL on localhost:5432/novara_local
- **Sample Data:** Realistic check-ins added for proper testing context
- **Schema V2:** Uses modern event-sourced architecture
- **Ready State:** Both users will trigger PHQ-4 assessment when smart scheduling is implemented

This setup provides a solid foundation for developing and testing the PHQ-4 smart scheduling feature (MH-01).