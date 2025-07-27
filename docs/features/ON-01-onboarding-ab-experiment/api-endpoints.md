# ON-01 API Endpoints: Speed-Tapper Detection

## Overview

ON-01 introduces speed-tap detection and fast onboarding path. The existing onboarding endpoints remain unchanged, but we add analytics tracking and optional fast-path data handling.

## Existing Endpoints (Unaffected)

### User Registration
```
POST /api/users
```
- **Purpose**: Create new user account
- **ON-01 Impact**: None - endpoint unchanged
- **Analytics**: Enhanced with path tracking

### User Login
```
POST /api/users/login
```
- **Purpose**: Authenticate existing user
- **ON-01 Impact**: None - endpoint unchanged

## Enhanced Analytics Tracking

### Onboarding Path Selection
```javascript
// Frontend tracking (enhanced from AN-01)
track('onboarding_path_selected', {
  path: 'fast' | 'standard',
  trigger_reason: 'speed_tap' | 'manual' | 'default',
  tap_count: number,
  time_window_ms: number,
  detection_step: number,
  environment: process.env.NODE_ENV
});
```

### Onboarding Completion
```javascript
// Frontend tracking (enhanced from AN-01)
track('onboarding_completed', {
  path: 'fast' | 'standard',
  completion_ms: number,
  steps_completed: number,
  total_steps: number,
  fields_completed: string[],
  environment: process.env.NODE_ENV
});
```

## Backend Analytics Integration

### Enhanced User Creation
```javascript
// In /api/users endpoint
app.post('/api/users', async (req, res) => {
  // ... existing user creation logic ...
  
  // ON-01: Enhanced analytics
  const onboardingData = {
    path: req.body.onboarding_path || 'standard',
    trigger_reason: req.body.trigger_reason || 'default',
    completion_ms: req.body.completion_ms || null,
    steps_completed: req.body.steps_completed || null
  };
  
  // Track onboarding completion
  trackEvent('Onboarding', 'completed', {
    user_id: user.id,
    path: onboardingData.path,
    trigger_reason: onboardingData.trigger_reason,
    completion_ms: onboardingData.completion_ms,
    steps_completed: onboardingData.steps_completed
  });
  
  // ... rest of existing logic ...
});
```

## Frontend API Client Updates

### Enhanced User Creation
```typescript
// In frontend/src/lib/api.ts
export const createUser = async (userData: UserData, onboardingContext?: OnboardingContext) => {
  const payload = {
    ...userData,
    // ON-01: Add onboarding context
    onboarding_path: onboardingContext?.path || 'standard',
    trigger_reason: onboardingContext?.triggerReason || 'default',
    completion_ms: onboardingContext?.completionMs || null,
    steps_completed: onboardingContext?.stepsCompleted || null
  };
  
  return apiClient.post('/api/users', payload);
};
```

### Onboarding Context Type
```typescript
// New type for ON-01
export interface OnboardingContext {
  path: 'fast' | 'standard';
  triggerReason: 'speed_tap' | 'manual' | 'default';
  completionMs?: number;
  stepsCompleted?: number;
  tapCount?: number;
  timeWindowMs?: number;
}
```

## Speed-Tap Detection API

### Tap Event Recording
```typescript
// Frontend utility for recording taps
export const recordTapEvent = (eventType: 'focus' | 'click' | 'change', step: number) => {
  const tapEvent = {
    timestamp: Date.now(),
    eventType,
    step,
    sessionId: getSessionId()
  };
  
  // Store in session storage for detection logic
  const tapHistory = JSON.parse(sessionStorage.getItem('tapHistory') || '[]');
  tapHistory.push(tapEvent);
  
  // Keep only last 10 seconds
  const tenSecondsAgo = Date.now() - 10000;
  const recentTaps = tapHistory.filter(tap => tap.timestamp > tenSecondsAgo);
  
  sessionStorage.setItem('tapHistory', JSON.stringify(recentTaps));
  
  // Check for speed-tap detection
  return checkSpeedTapDetection(recentTaps, step);
};
```

### Speed-Tap Detection Logic
```typescript
// Frontend utility for detection
export const checkSpeedTapDetection = (tapHistory: TapEvent[], currentStep: number): boolean => {
  if (currentStep >= 3) return false; // Only detect before step 3
  
  const recentTaps = tapHistory.filter(tap => 
    Date.now() - tap.timestamp <= 10000
  );
  
  return recentTaps.length >= 3;
};
```

## Data Flow

### Standard Onboarding Flow
1. User starts onboarding
2. Each interaction recorded via `recordTapEvent()`
3. Speed-tap detection runs on each tap
4. If detected, trigger fast path transition
5. User completes onboarding (standard or fast)
6. Enhanced analytics sent to backend
7. PostHog events fired for tracking

### Fast Onboarding Flow
1. Speed-tap detected during standard flow
2. UI transitions to fast path
3. User completes 3 required fields
4. Same backend endpoint used (`/api/users`)
5. Enhanced analytics with `path: 'fast'`
6. Same welcome experience as standard

## Error Handling

### Detection Failures
```typescript
// Graceful fallback if detection fails
export const handleDetectionFailure = () => {
  console.warn('Speed-tap detection failed, falling back to standard path');
  return {
    path: 'standard' as const,
    triggerReason: 'fallback' as const
  };
};
```

### Analytics Failures
```typescript
// Ensure analytics don't block user experience
export const safeTrack = (eventName: string, properties: any) => {
  try {
    track(eventName, properties);
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    // Don't block user flow
  }
};
```

## Testing Endpoints

### Speed-Tap Detection Test
```bash
# Test detection logic
curl -X POST http://localhost:9002/api/test/speed-tap-detection \
  -H "Content-Type: application/json" \
  -d '{
    "tapEvents": [
      {"timestamp": 1000, "eventType": "click", "step": 1},
      {"timestamp": 3000, "eventType": "click", "step": 1},
      {"timestamp": 5000, "eventType": "click", "step": 2}
    ],
    "currentStep": 2
  }'
```

### Onboarding Analytics Test
```bash
# Test enhanced analytics
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "nickname": "TestUser",
    "onboarding_path": "fast",
    "trigger_reason": "speed_tap",
    "completion_ms": 25000,
    "steps_completed": 3
  }'
```

## Performance Considerations

### Detection Performance
- **Tap Recording**: O(1) operation
- **Detection Check**: O(n) where n = taps in 10s window
- **Memory Usage**: Limited to 10s of tap history
- **CPU Impact**: Minimal, runs on user interaction

### Analytics Performance
- **Event Firing**: Asynchronous, non-blocking
- **Backend Processing**: Enhanced payload size <1KB
- **PostHog Integration**: Uses existing AN-01 infrastructure
- **Error Handling**: Graceful degradation

## Security Considerations

### Data Privacy
- **Tap History**: Stored only in session storage (client-side)
- **Analytics Data**: No PII in tap events
- **User Data**: Same privacy controls as existing endpoints
- **Session Data**: Cleared on logout/session expiry

### Input Validation
- **Tap Events**: Validate timestamp, event type, step number
- **Onboarding Context**: Validate path, trigger reason
- **Completion Data**: Validate numeric ranges
- **Session Data**: Sanitize before storage 