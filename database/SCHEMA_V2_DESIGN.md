# Schema V2 Design Documentation

## Overview
This new schema implements event sourcing for health data while maintaining backward compatibility. It's designed for "Option B" (1-week implementation) with clear upgrade paths to "Option C" (full platform refactor).

## Core Design Principles

### 1. **Event Sourcing for Health Data**
Instead of updating rows, we append events:
```sql
-- Old way (updates lost history)
UPDATE daily_checkins SET mood_today = 'anxious' WHERE id = 123;

-- New way (preserves history)
INSERT INTO health_events (user_id, event_type, event_data, occurred_at)
VALUES (user_id, 'mood', '{"mood": "anxious", "confidence": 7}', NOW());
```

### 2. **Domain Separation**
Each domain has its own tables:
- **Users & Auth**: `users`, `user_profiles`
- **Health Data**: `health_events` (central)
- **Medications**: `user_medications`, `medication_adherence`
- **Assessments**: `assessment_definitions`, `assessment_responses`
- **Insights**: `insights`, `insight_interactions`

### 3. **JSONB for Flexibility**
Event data stored as JSONB allows schema evolution without migrations:
```json
// Mood event
{
  "mood": "anxious",
  "confidence": 7,
  "note": "Worried about upcoming retrieval"
}

// Medication event  
{
  "medication_id": "uuid",
  "status": "taken",
  "time": "08:30",
  "side_effects": ["mild headache"]
}

// Symptom event
{
  "symptoms": ["bloating", "fatigue"],
  "severity": 6,
  "triggers": ["injection", "stress"]
}
```

## Event Types Reference

### Core Event Types
```javascript
const EventTypes = {
  MOOD: 'mood',
  MEDICATION: 'medication',
  SYMPTOM: 'symptom',
  ASSESSMENT: 'assessment',
  VITAL: 'vital',
  TREATMENT: 'treatment',
  APPOINTMENT: 'appointment',
  NOTE: 'note'
};

const EventSubtypes = {
  MOOD: ['daily_checkin', 'quick_checkin', 'enhanced_checkin'],
  MEDICATION: ['scheduled', 'as_needed', 'injection'],
  SYMPTOM: ['side_effect', 'treatment_reaction', 'general'],
  ASSESSMENT: ['phq4', 'gad7', 'custom']
};
```

## Migration Strategy

### Phase 1: Dual Write (Day 1-2)
```javascript
// Write to both old and new schemas
async function createCheckin(data) {
  // Write to legacy table
  await db.query('INSERT INTO daily_checkins_legacy...');
  
  // Write to event system
  await createHealthEvent({
    type: 'mood',
    subtype: 'daily_checkin',
    data: {
      mood: data.mood_today,
      confidence: data.confidence_today,
      // All enhanced fields preserved!
      anxiety_level: data.anxiety_level,
      side_effects: data.side_effects
    }
  });
}
```

### Phase 2: New API Endpoints (Day 3-4)
```javascript
// Legacy endpoint (keep working)
app.post('/api/checkins', legacyCheckinHandler);

// New event-based endpoint
app.post('/api/health-events', createHealthEvent);
app.get('/api/health-events', getHealthTimeline);

// New domain endpoints
app.post('/api/medications/:id/take', recordMedicationTaken);
app.post('/api/assessments/:type/complete', completeAssessment);
```

### Phase 3: Gradual Frontend Migration (Day 5-7)
```javascript
// Feature flag for new system
const useNewHealthSystem = await checkFeatureFlag('new_health_events');

if (useNewHealthSystem) {
  // Use new event-based API
  await api.createHealthEvent({...});
} else {
  // Use legacy checkin API
  await api.createCheckin({...});
}
```

## Upgrade Paths to Option C

### 1. **Microservices Ready**
Current design supports service separation:
```
health-service → health_events, assessments
medication-service → user_medications, medication_adherence  
insights-service → insights, ML models
analytics-service → materialized views, aggregations
```

### 2. **Event Streaming Ready**
Health events table designed for streaming:
```sql
-- Option C: Stream to Kafka/Kinesis
SELECT * FROM health_events 
WHERE created_at > last_processed
ORDER BY created_at;
```

### 3. **Analytics Database Ready**
Materialized views can be replaced with ClickHouse:
```sql
-- Option C: Replicate to ClickHouse for analytics
CREATE TABLE clickhouse.health_events AS 
SELECT * FROM postgres.health_events;
```

### 4. **Multi-tenant Ready**
Can add tenant_id to all tables:
```sql
-- Option C: B2B multi-tenant
ALTER TABLE health_events ADD COLUMN tenant_id UUID;
CREATE INDEX idx_tenant ON health_events(tenant_id, user_id);
```

## Performance Optimizations

### Indexes Strategy
```sql
-- Time-series queries (most common)
CREATE INDEX idx_health_events_user_date 
ON health_events(user_id, occurred_at DESC);

-- Event type queries
CREATE INDEX idx_health_events_type 
ON health_events(event_type, event_subtype);

-- JSONB queries (specific paths)
CREATE INDEX idx_mood_events 
ON health_events((event_data->>'mood')) 
WHERE event_type = 'mood';
```

### Materialized Views Refresh
```sql
-- Refresh strategy (cron job or triggers)
-- Every hour for daily metrics
SELECT refresh_user_metrics();

-- Real-time for critical metrics (Option C)
CREATE TRIGGER refresh_on_event 
AFTER INSERT ON health_events
FOR EACH STATEMENT EXECUTE FUNCTION refresh_user_metrics();
```

## Example Queries

### Get User's Mood Timeline
```sql
SELECT 
  occurred_at,
  event_data->>'mood' as mood,
  event_data->>'confidence' as confidence,
  event_data->>'note' as note
FROM health_events
WHERE user_id = ? 
  AND event_type = 'mood'
ORDER BY occurred_at DESC
LIMIT 30;
```

### Calculate Medication Adherence
```sql
WITH medication_window AS (
  SELECT COUNT(*) FILTER (WHERE event_data->>'status' = 'taken') as taken,
         COUNT(*) as total
  FROM health_events
  WHERE user_id = ?
    AND event_type = 'medication'
    AND occurred_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT 
  ROUND(100.0 * taken / NULLIF(total, 0), 1) as adherence_rate
FROM medication_window;
```

### Get Insights with Interactions
```sql
SELECT 
  i.*,
  EXISTS(
    SELECT 1 FROM insight_interactions ii
    WHERE ii.insight_id = i.id 
    AND ii.action = 'viewed'
  ) as viewed
FROM insights i
WHERE i.user_id = ?
  AND i.expires_at > NOW()
ORDER BY i.priority DESC, i.created_at DESC;
```

## Backward Compatibility

The `daily_checkins_legacy` view maintains compatibility:
```sql
-- Old code continues to work
SELECT * FROM daily_checkins_legacy WHERE user_id = ?;

-- But internally uses new event system
-- View automatically aggregates events into legacy format
```

## Next Steps

1. **Implement Core Tables** (Day 1)
2. **Build Event API** (Day 2)
3. **Create Migration Scripts** (Day 3)
4. **Update Backend Services** (Day 4-5)
5. **Gradual Frontend Migration** (Day 6-7)
6. **Performance Testing** (Day 7)

This design gives you modern architecture benefits while keeping implementation realistic for a 1-week timeline.