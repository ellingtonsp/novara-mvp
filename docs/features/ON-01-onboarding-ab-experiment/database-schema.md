# ON-01 Database Schema: Speed-Tapper Detection

## Overview

ON-01 does not require new database tables or schema changes. The feature leverages existing user registration endpoints and analytics tracking infrastructure from AN-01. All speed-tap detection data is stored client-side in session storage.

## Existing Schema (Unaffected)

### Users Table
```sql
-- Existing table structure (unchanged)
CREATE TABLE Users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  confidence_meds INTEGER,
  confidence_costs INTEGER,
  confidence_overall INTEGER,
  primary_need TEXT,
  cycle_stage TEXT,
  top_concern TEXT,
  email_opt_in BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Analytics Events Table (AN-01)
```sql
-- Existing analytics table (enhanced for ON-01)
CREATE TABLE AnalyticsEvents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  user_id TEXT,
  properties TEXT, -- JSON string
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  environment TEXT DEFAULT 'development'
);
```

## Enhanced Analytics Properties

### Onboarding Path Selection Event
```json
{
  "event_name": "onboarding_path_selected",
  "properties": {
    "path": "fast" | "standard",
    "trigger_reason": "speed_tap" | "manual" | "default",
    "tap_count": 3,
    "time_window_ms": 10000,
    "detection_step": 2,
    "environment": "development" | "staging" | "production",
    "user_agent": "Mozilla/5.0...",
    "screen_resolution": "1920x1080"
  }
}
```

### Onboarding Completion Event
```json
{
  "event_name": "onboarding_completed",
  "properties": {
    "path": "fast" | "standard",
    "completion_ms": 25000,
    "steps_completed": 3,
    "total_steps": 3,
    "fields_completed": ["email", "cycle_stage", "primary_concern"],
    "form_errors": [],
    "retry_count": 0,
    "environment": "development" | "staging" | "production"
  }
}
```

## Client-Side Data Storage

### Session Storage Schema
```typescript
// Tap History (temporary, client-side only)
interface TapHistory {
  tapEvents: TapEvent[];
  sessionId: string;
  createdAt: number;
  lastUpdated: number;
}

// Tap Event Structure
interface TapEvent {
  timestamp: number;
  eventType: 'focus' | 'click' | 'change' | 'blur';
  step: number;
  sessionId: string;
}

// Onboarding State (temporary, client-side only)
interface OnboardingState {
  currentStep: number;
  path: 'standard' | 'fast';
  triggerReason: 'default' | 'speed_tap' | 'manual';
  startTime: number;
  tapCount: number;
  formData: Partial<UserData>;
  isSpeedTapper: boolean;
}
```

### Session Storage Keys
```typescript
const SESSION_KEYS = {
  TAP_HISTORY: 'novara_tap_history',
  ONBOARDING_STATE: 'novara_onboarding_state',
  SESSION_ID: 'novara_session_id',
  SPEED_TAP_CONFIG: 'novara_speed_tap_config'
} as const;
```

## Data Flow Architecture

### 1. Client-Side Data Collection
```typescript
// Tap events stored in session storage
sessionStorage.setItem('novara_tap_history', JSON.stringify(tapHistory));

// Onboarding state stored in session storage
sessionStorage.setItem('novara_onboarding_state', JSON.stringify(onboardingState));
```

### 2. Analytics Event Generation
```typescript
// Events sent to backend via existing AN-01 infrastructure
track('onboarding_path_selected', {
  path: 'fast',
  trigger_reason: 'speed_tap',
  // ... other properties
});
```

### 3. Backend Event Storage
```typescript
// Backend stores events in AnalyticsEvents table
const event = {
  event_name: 'onboarding_path_selected',
  user_id: userId,
  properties: JSON.stringify(eventProperties),
  timestamp: new Date(),
  environment: process.env.NODE_ENV
};

await db.run(`
  INSERT INTO AnalyticsEvents (event_name, user_id, properties, timestamp, environment)
  VALUES (?, ?, ?, ?, ?)
`, [event.event_name, event.user_id, event.properties, event.timestamp, event.environment]);
```

## Data Privacy & Security

### Client-Side Data
- **Tap History**: Stored only in session storage, cleared on logout
- **Onboarding State**: Temporary, not persisted to server
- **Session Data**: No PII, only interaction patterns
- **Auto-Cleanup**: Old tap events automatically removed after 10 seconds

### Server-Side Data
- **Analytics Events**: No PII in tap events, only aggregated metrics
- **User Data**: Same privacy controls as existing user registration
- **Event Retention**: Follows existing analytics retention policies
- **Data Encryption**: Uses existing encryption for sensitive data

## Performance Considerations

### Storage Optimization
```typescript
// Automatic cleanup of old tap events
const cleanupTapHistory = () => {
  const cutoffTime = Date.now() - 10000;
  const tapHistory = getTapHistory();
  const recentTaps = tapHistory.filter(tap => tap.timestamp > cutoffTime);
  setTapHistory(recentTaps);
};

// Limit tap history size
const MAX_TAP_HISTORY = 100;
if (tapHistory.length > MAX_TAP_HISTORY) {
  tapHistory.splice(0, tapHistory.length - MAX_TAP_HISTORY);
}
```

### Memory Management
```typescript
// Session storage size monitoring
const getSessionStorageSize = () => {
  let total = 0;
  for (let key in sessionStorage) {
    if (sessionStorage.hasOwnProperty(key)) {
      total += sessionStorage[key].length;
    }
  }
  return total;
};

// Alert if storage is getting large
const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB
if (getSessionStorageSize() > MAX_STORAGE_SIZE) {
  console.warn('Session storage size exceeded limit, cleaning up...');
  cleanupAllSessionData();
}
```

## Migration Strategy

### No Database Migration Required
- **Existing Tables**: No changes to Users or AnalyticsEvents tables
- **Backward Compatibility**: Existing user registration flow unchanged
- **Gradual Rollout**: Feature can be enabled/disabled via feature flags
- **A/B Testing**: Uses existing analytics infrastructure

### Feature Flag Implementation
```typescript
// Feature flag for ON-01
const ON01_FEATURE_FLAG = 'speed_tap_detection_enabled';

const isSpeedTapDetectionEnabled = () => {
  return localStorage.getItem(ON01_FEATURE_FLAG) === 'true' ||
         process.env.REACT_APP_SPEED_TAP_ENABLED === 'true';
};
```

## Testing Data

### Mock Tap Events for Testing
```typescript
// Test data for speed-tap detection
const mockTapEvents = [
  {
    timestamp: Date.now() - 5000,
    eventType: 'click' as const,
    step: 1,
    sessionId: 'test_session_1'
  },
  {
    timestamp: Date.now() - 3000,
    eventType: 'click' as const,
    step: 1,
    sessionId: 'test_session_1'
  },
  {
    timestamp: Date.now() - 1000,
    eventType: 'click' as const,
    step: 2,
    sessionId: 'test_session_1'
  }
];

// Should trigger fast path (3 taps in 5 seconds)
```

### Analytics Event Testing
```typescript
// Test analytics events
const testAnalyticsEvents = [
  {
    event_name: 'onboarding_path_selected',
    properties: {
      path: 'fast',
      trigger_reason: 'speed_tap',
      tap_count: 3,
      time_window_ms: 5000,
      detection_step: 2
    }
  },
  {
    event_name: 'onboarding_completed',
    properties: {
      path: 'fast',
      completion_ms: 25000,
      steps_completed: 3,
      total_steps: 3
    }
  }
];
```

## Monitoring & Observability

### Key Metrics to Track
```sql
-- Onboarding path distribution
SELECT 
  JSON_EXTRACT(properties, '$.path') as path,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_path_selected'
GROUP BY JSON_EXTRACT(properties, '$.path');

-- Completion rates by path
SELECT 
  JSON_EXTRACT(properties, '$.path') as path,
  COUNT(*) as completions,
  AVG(CAST(JSON_EXTRACT(properties, '$.completion_ms') AS INTEGER)) as avg_completion_ms
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_completed'
GROUP BY JSON_EXTRACT(properties, '$.path');

-- Speed-tap detection accuracy
SELECT 
  JSON_EXTRACT(properties, '$.trigger_reason') as trigger_reason,
  COUNT(*) as count
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_path_selected'
GROUP BY JSON_EXTRACT(properties, '$.trigger_reason');
```

### Alerting Thresholds
- **Fast Path Usage**: Alert if >50% of users trigger fast path (potential false positives)
- **Completion Rate Drop**: Alert if fast path completion <60% (baseline)
- **Detection Errors**: Alert if speed-tap detection fails >5% of the time
- **Storage Issues**: Alert if session storage errors occur frequently 