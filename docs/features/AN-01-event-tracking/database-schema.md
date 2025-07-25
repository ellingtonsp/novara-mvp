# AN-01 Event Tracking - Database Schema Documentation

> **Feature**: AN-01 Event Tracking Instrumentation  
> **Epic**: Analytics & Insights  
> **Story ID**: AN-01  

## 🎯 Overview

This document describes the database schema considerations for AN-01 event tracking. The implementation primarily uses PostHog for analytics storage, but includes database considerations for user identification and event correlation.

## 📊 Database Architecture

### **Primary Storage**: PostHog
- **Event Storage**: All analytics events stored in PostHog
- **User Profiles**: User properties and identification in PostHog
- **Funnel Analysis**: PostHog provides built-in funnel and retention analysis
- **Real-time Processing**: Events processed and available immediately

### **Secondary Storage**: Application Database
- **User Records**: User accounts and authentication data
- **Event Correlation**: Link PostHog events to application data
- **Audit Trail**: Compliance and debugging purposes

## 🗄️ Database Schema

### **No Schema Changes Required**

The AN-01 implementation does **not require any database schema changes** to the existing Novara MVP database. All analytics data is stored in PostHog, while the application database continues to store:

- **Users**: User accounts and authentication
- **Check-ins**: Daily user check-ins
- **Insights**: Generated insights and recommendations
- **Configuration**: Application settings and preferences

### **Existing Schema Usage**

#### **Users Table**
```sql
-- Existing Users table structure
CREATE TABLE Users (
    id TEXT PRIMARY KEY,           -- Airtable record ID (used as user_id in events)
    email TEXT UNIQUE NOT NULL,    -- User email (not included in events)
    nickname TEXT,                 -- User nickname (not included in events)
    confidence_meds INTEGER,       -- User confidence levels
    confidence_costs INTEGER,
    confidence_overall INTEGER,
    primary_need TEXT,
    cycle_stage TEXT,
    created_at TEXT,               -- ISO timestamp
    updated_at TEXT
);
```

**Event Integration**:
- `user_id` field used as `distinct_id` in PostHog events
- No personal data (email, nickname) included in events
- `created_at` timestamp for user lifecycle analysis

#### **Check-ins Table**
```sql
-- Existing Check-ins table structure
CREATE TABLE Checkins (
    id TEXT PRIMARY KEY,           -- Check-in ID (used in event correlation)
    user_id TEXT NOT NULL,         -- References Users.id
    mood_today TEXT,               -- Mood selection (converted to symptom_flags)
    confidence_today INTEGER,      -- Confidence level (used as mood_score)
    user_note TEXT,                -- Optional user notes
    cycle_day INTEGER,             -- Optional cycle day
    created_at TEXT,               -- ISO timestamp
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

**Event Integration**:
- `user_id` links to PostHog user identification
- `confidence_today` used as `mood_score` in events
- `mood_today` converted to `symptom_flags` array
- `created_at` for timing analysis

#### **Insights Table**
```sql
-- Existing Insights table structure
CREATE TABLE Insights (
    id TEXT PRIMARY KEY,           -- Insight ID (used as insight_id in events)
    user_id TEXT NOT NULL,         -- References Users.id
    type TEXT NOT NULL,            -- Insight type (used as insight_type)
    title TEXT,                    -- Insight title
    message TEXT,                  -- Insight content
    created_at TEXT,               -- ISO timestamp
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

**Event Integration**:
- `id` used as `insight_id` in `insight_viewed` events
- `type` used as `insight_type` in events
- `user_id` for user attribution
- `created_at` for insight lifecycle analysis

## 🔗 PostHog Integration

### **User Identification**
```typescript
// PostHog user identification using database user_id
const identifyUser = (user: User) => {
  posthog.identify(user.id, {
    email: user.email,           // Only in PostHog, not in events
    nickname: user.nickname,     // Only in PostHog, not in events
    confidence_meds: user.confidence_meds,
    confidence_costs: user.confidence_costs,
    confidence_overall: user.confidence_overall,
    primary_need: user.primary_need,
    cycle_stage: user.cycle_stage,
    created_at: user.created_at
  });
};
```

### **Event Correlation**
```typescript
// Link PostHog events to database records
const trackCheckinSubmitted = (checkin: Checkin, user: User) => {
  posthog.capture('checkin_submitted', {
    user_id: user.id,                    // Links to Users.id
    checkin_id: checkin.id,              // Links to Checkins.id
    mood_score: checkin.confidence_today,
    symptom_flags: checkin.mood_today.split(', '),
    time_to_complete_ms: checkin.time_to_complete_ms,
    cycle_day: checkin.cycle_day,
    environment: environmentConfig.environment,
    timestamp: checkin.created_at
  });
};
```

## 📊 Data Flow

### **Event Data Flow**
```
User Action → Database Operation → Success Response → PostHog Event → Analytics Dashboard
```

### **User Data Flow**
```
User Creation → Database Insert → PostHog Identification → Event Attribution
```

### **Correlation Flow**
```
Database Record → PostHog Event → Funnel Analysis → Business Intelligence
```

## 🔒 Privacy & Compliance

### **Data Separation**
- **Application Database**: Contains personal data (email, nickname)
- **PostHog Events**: Only user_id and business metrics
- **No PII in Events**: Personal data never included in analytics events

### **Data Minimization**
```typescript
// ✅ CORRECT: Only business data in events
const signupEvent = {
  user_id: user.id,              // Database ID only
  signup_method: 'email',        // Business metric
  environment: 'production',     // System context
  timestamp: new Date().toISOString()
};

// ❌ WRONG: Never include personal data
const signupEvent = {
  user_id: user.id,
  email: user.email,             // Personal data - DON'T DO THIS
  nickname: user.nickname,       // Personal data - DON'T DO THIS
  signup_method: 'email'
};
```

### **Audit Trail**
- **Database Logs**: Application database changes logged
- **PostHog Events**: All events timestamped and documented
- **Compliance**: HIPAA and GDPR compliant data handling

## 🚨 Data Integrity

### **Referential Integrity**
- **User Events**: All events include valid user_id
- **Check-in Events**: Link to valid check-in records
- **Insight Events**: Link to valid insight records

### **Data Validation**
```typescript
// Validate event data against database schema
const validateEventData = (event: any, user: User) => {
  // Ensure user exists
  if (!user || !user.id) {
    throw new Error('Invalid user for event tracking');
  }
  
  // Ensure required fields
  if (!event.user_id || !event.environment || !event.timestamp) {
    throw new Error('Missing required event fields');
  }
  
  // Ensure no PII
  if (event.email || event.nickname || event.phone) {
    throw new Error('Personal data not allowed in events');
  }
  
  return event;
};
```

### **Error Handling**
```typescript
// Handle database errors gracefully
const trackEvent = async (event: any, user: User) => {
  try {
    // Validate user exists in database
    const dbUser = await getUserById(user.id);
    if (!dbUser) {
      console.warn('User not found in database, skipping event');
      return;
    }
    
    // Validate event data
    const validatedEvent = validateEventData(event, dbUser);
    
    // Send to PostHog
    posthog.capture(event.name, validatedEvent);
    
  } catch (error) {
    console.error('Event tracking error:', error);
    // Don't affect user experience
  }
};
```

## 📈 Analytics Considerations

### **User Lifecycle Analysis**
```sql
-- Database queries for user lifecycle analysis
-- (Used in conjunction with PostHog events)

-- User signup to first check-in
SELECT 
    u.id,
    u.created_at as signup_date,
    MIN(c.created_at) as first_checkin_date,
    JULIANDAY(MIN(c.created_at)) - JULIANDAY(u.created_at) as days_to_first_checkin
FROM Users u
LEFT JOIN Checkins c ON u.id = c.user_id
GROUP BY u.id;

-- User engagement patterns
SELECT 
    u.id,
    COUNT(c.id) as total_checkins,
    AVG(c.confidence_today) as avg_confidence,
    MAX(c.created_at) as last_checkin_date
FROM Users u
LEFT JOIN Checkins c ON u.id = c.user_id
GROUP BY u.id;
```

### **Event Correlation**
```typescript
// Correlate PostHog events with database records
const correlateEvents = async (userId: string) => {
  // Get database user data
  const user = await getUserById(userId);
  const checkins = await getCheckinsByUserId(userId);
  const insights = await getInsightsByUserId(userId);
  
  // Correlate with PostHog events
  const posthogEvents = await posthog.getEvents({
    distinctId: userId,
    limit: 100
  });
  
  return {
    user,
    checkins,
    insights,
    posthogEvents
  };
};
```

## 🔧 Performance Considerations

### **Database Performance**
- **No Additional Queries**: Event tracking doesn't add database load
- **Existing Indexes**: Current indexes support event correlation
- **No Schema Changes**: No migration or performance impact

### **PostHog Performance**
- **Async Events**: Non-blocking event submission
- **Batch Processing**: PostHog handles event batching
- **CDN Delivery**: PostHog uses global CDN for fast delivery

### **Memory Usage**
- **Minimal Impact**: Event tracking adds negligible memory usage
- **No Caching**: Events sent immediately, no local caching
- **Garbage Collection**: Event objects cleaned up automatically

## 🧪 Testing Considerations

### **Database Testing**
```typescript
// Test database integration
describe('Database Integration', () => {
  it('should correlate events with database records', async () => {
    // Create test user
    const user = await createTestUser();
    
    // Create test check-in
    const checkin = await createTestCheckin(user.id);
    
    // Track event
    trackCheckinSubmitted(checkin, user);
    
    // Verify correlation
    const events = await posthog.getEvents({ distinctId: user.id });
    expect(events).toContainEqual(
      expect.objectContaining({
        event: 'checkin_submitted',
        properties: {
          user_id: user.id,
          checkin_id: checkin.id
        }
      })
    );
  });
});
```

### **Data Integrity Testing**
```typescript
// Test data integrity
describe('Data Integrity', () => {
  it('should not include PII in events', () => {
    const user = { id: 'test123', email: 'test@example.com', nickname: 'TestUser' };
    const event = createSignupEvent(user);
    
    expect(event).not.toHaveProperty('email');
    expect(event).not.toHaveProperty('nickname');
    expect(event.user_id).toBe('test123');
  });
});
```

## 📊 Monitoring & Alerts

### **Database Monitoring**
- **Query Performance**: Monitor existing query performance
- **Data Integrity**: Monitor referential integrity
- **Storage Usage**: Monitor database storage growth

### **PostHog Monitoring**
- **Event Delivery**: Monitor event delivery success rate
- **Data Quality**: Monitor event payload completeness
- **Performance**: Monitor event processing time

### **Correlation Monitoring**
- **User Identification**: Monitor user identification success
- **Event Linking**: Monitor event-to-record correlation
- **Data Consistency**: Monitor data consistency between systems

## 🔄 Migration Considerations

### **No Migration Required**
- **Schema Unchanged**: No database schema changes needed
- **Data Preserved**: All existing data remains intact
- **Backward Compatible**: Existing functionality unchanged

### **Future Considerations**
- **Event Storage**: Consider database event storage for compliance
- **Real-time Analytics**: Consider database views for real-time dashboards
- **Data Warehouse**: Consider data warehouse for advanced analytics

## 📋 Implementation Checklist

### **Database Integration**
- [ ] Verify user_id consistency between database and PostHog
- [ ] Test event correlation with database records
- [ ] Validate data integrity and referential integrity
- [ ] Monitor database performance impact

### **Privacy Compliance**
- [ ] Verify no PII in PostHog events
- [ ] Test data minimization requirements
- [ ] Validate audit trail capabilities
- [ ] Confirm compliance with privacy regulations

### **Performance Validation**
- [ ] Test database query performance
- [ ] Monitor PostHog event delivery
- [ ] Validate memory usage impact
- [ ] Confirm no user experience degradation

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01  
**Owner**: Engineering Team 