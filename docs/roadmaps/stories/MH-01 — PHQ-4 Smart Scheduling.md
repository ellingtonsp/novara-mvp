# MH-01 — PHQ-4 Smart Scheduling

## Epic
**Mental Health Monitoring** — Implement systematic mental health assessment tracking

## Story
As a user managing my mental health alongside my physical symptoms, I want the app to automatically schedule and remind me to complete PHQ-4 assessments at appropriate intervals, so I can track my mental health without having to remember when assessments are due.

## Acceptance Criteria
1. **Scheduling Logic**
   - [ ] Trigger PHQ-4 once immediately after onboarding completion
   - [ ] Schedule biweekly (14-day) assessments for standard users
   - [ ] Schedule weekly (7-day) assessments for moderate/high-risk users
   - [ ] Prevent PHQ-4 from appearing in daily check-in flows
   - [ ] Track completion dates and calculate next due date

2. **Entry Points**
   - [ ] Dashboard card/prompt when PHQ-4 is due (primary)
   - [ ] Dedicated route `/phq4` for direct access
   - [ ] Navigation menu item with indicator when due
   - [ ] Gentle reminder after 3 days overdue

3. **User Experience**
   - [ ] Clear messaging about why PHQ-4 is important
   - [ ] Show days until next assessment
   - [ ] Allow "snooze" for 24 hours if user is busy
   - [ ] Celebrate completion with positive feedback
   - [ ] Never interrupt active check-in flows

4. **Data Persistence**
   - [ ] Store PHQ-4 completion dates in database
   - [ ] Track all PHQ-4 scores and risk levels
   - [ ] Calculate trends over time
   - [ ] Sync completion status across devices

5. **Risk-Based Adaptation**
   - [ ] Adjust frequency based on PHQ-4 results
   - [ ] Escalate to weekly for scores ≥ 6
   - [ ] Return to biweekly when stable
   - [ ] Track improvement/deterioration patterns

## Technical Considerations
- Backend endpoints for PHQ-4 scheduling logic
- Database schema updates for tracking
- Cron job or scheduler for due date calculations
- Frontend state management for PHQ-4 prompts
- Consider push notifications for future enhancement

## User Flow
1. **New User**: Completes onboarding → Sees PHQ-4 prompt → Completes assessment
2. **Returning User**: Logs in → Dashboard checks if due → Shows card if needed
3. **Completion**: User completes PHQ-4 → Positive feedback → Next date calculated
4. **Overdue**: Gentle reminder appears → User can complete or snooze

## Business Value
- **Clinical Value**: Systematic mental health monitoring improves outcomes
- **Compliance**: Meets clinical guidelines for depression/anxiety screening
- **User Trust**: Shows comprehensive care approach
- **Data Quality**: Consistent assessment intervals improve insights

## Backend Requirements
```javascript
// New endpoints needed
POST   /api/phq4/complete     // Submit PHQ-4 results
GET    /api/phq4/status       // Check if due, last date, next date
GET    /api/phq4/history      // User's PHQ-4 history
PUT    /api/phq4/snooze       // Snooze for 24 hours

// Database schema additions
phq4_assessments table:
- user_id
- completed_at
- total_score
- anxiety_score
- depression_score
- risk_level

user_phq4_schedule table:
- user_id
- last_completed
- next_due
- frequency_days
- snoozed_until
```

## UI/UX Requirements
- Dashboard card design for PHQ-4 prompt
- Progress indicator showing assessment schedule
- Clear CTAs that don't feel pushy
- Mobile-optimized PHQ-4 form
- Results summary after completion

## Dependencies
- PHQ-4 component already exists (needs minor updates)
- User authentication system
- Dashboard component for card placement
- Backend database and API infrastructure

## Definition of Done
- [ ] PHQ-4 scheduling logic implemented in backend
- [ ] Database schema updated with migrations
- [ ] Dashboard card appears when PHQ-4 is due
- [ ] Direct route `/phq4` accessible
- [ ] Completion tracked and next date calculated
- [ ] Risk-based frequency adjustment working
- [ ] User can snooze for 24 hours
- [ ] All PHQ-4 flows tested (new user, returning, overdue)
- [ ] No interference with daily check-in flows
- [ ] Documentation updated

## Story Points: 3
Moderate complexity - mostly integration work with existing PHQ-4 component and adding scheduling logic.