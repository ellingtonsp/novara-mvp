# Database Schema: User Metrics

## Tables Used

### daily_checkins
Primary source for metrics calculations.

```sql
-- Existing fields used for metrics
mood_today VARCHAR(50)              -- 'amazing', 'good', 'okay', 'tough', 'very tough'
confidence_today INTEGER            -- 1-10 scale
date_submitted DATE                 -- For streak calculation
user_id TEXT                        -- Links to user

-- Additional fields (not in SQLite, only Airtable)
medication_taken VARCHAR(20)        -- 'yes', 'no', 'not tracked'
partner_involved BOOLEAN            -- Partner involvement flag
coping_strategies TEXT              -- JSON array of strategies
side_effects TEXT                   -- JSON array of side effects
```

### users
User profile data for context.

```sql
-- Fields used for metrics context
id TEXT PRIMARY KEY
email VARCHAR(255)
baseline_completed BOOLEAN          -- Determines if metrics shown
onboarding_path VARCHAR(50)         -- 'test' or 'control'
```

## Data Aggregation Queries

### Get User Check-ins for Metrics
```sql
-- SQLite version
SELECT * FROM daily_checkins 
WHERE user_id = ? 
ORDER BY date_submitted DESC 
LIMIT 100;

-- Airtable version (via API)
filterByFormula=user_id='${user.email}'
sort[0][field]=date_submitted
sort[0][direction]=desc
maxRecords=100
```

### Calculate Streak (Application Logic)
```javascript
// No SQL - calculated in application
// Requires consecutive date checking
```

## Field Limitations

### SQLite (Local Development)
- Missing: medication_taken, partner_involved, coping_strategies
- Impact: Some metrics return 0 in local development
- Workaround: Test with staging/production data

### Airtable (Production)
- All fields available
- Linked records for user relationship
- JSON strings for array fields

## Performance Indexes
```sql
-- Recommended indexes (SQLite)
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date_submitted DESC);
CREATE INDEX idx_checkins_date ON daily_checkins(date_submitted);
```

## Data Volume Considerations
- Average user: 30-90 check-ins
- Heavy user: 200+ check-ins
- Query limit: 100 records (last ~3 months)
- Calculation time: <500ms target