# ON-01 — Onboarding AB Experiment (Fast Lane vs. Control) Functional Logic

## Overview
ON-01 — Onboarding AB Experiment (Fast Lane vs. Control) implements a deterministic A/B test framework that provides a 50/50 split between control and test onboarding paths, with consistent behavior across hard refreshes and proper session management.

## Core A/B Test Logic

### Path Determination Algorithm
```typescript
// Deterministic 50/50 split based on session ID
const sessionId = getSessionId();
const sessionHash = sessionId.split('_').pop() || sessionId;
const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
const result = sessionBasedSplit ? 'test' : 'control';
```

### Session Management
- **Session ID Generation**: `session_${Date.now()}_${randomString}`
- **Caching**: Path decision stored in `sessionStorage`
- **Consistency**: Same path maintained across hard refreshes
- **Testing**: `clearOnboardingPathCache()` function for development

### Decision Flow
1. **Check Cache**: Look for existing path decision in sessionStorage
2. **Environment Override**: Check for forced path in environment variables
3. **PostHog Integration**: Check feature flag (with fallback)
4. **Deterministic Split**: Use session ID hash for 50/50 split
5. **Cache Decision**: Store result for session consistency

## User Experience Logic

### Control Path (Standard Onboarding)
```typescript
// Full onboarding required
const needsOnboarding = !user?.primary_need || !user?.cycle_stage;
```

**Flow**:
1. User arrives → A/B test assigns 'control' path
2. Full onboarding questions presented
3. Complete profile required before dashboard access
4. Traditional user experience

### Test Path (Fast Lane)
```typescript
// Baseline completion required
const needsBaseline = !user?.baseline_completed;
```

**Flow**:
1. User arrives → A/B test assigns 'test' path
2. Quick signup with minimal fields
3. Redirected to dashboard with "Complete Your Profile" prompt
4. User clicks "Complete Profile" → Baseline panel opens
5. After baseline completion → Full dashboard unlocked

## Backend Integration

### Insights Blocking Logic
```javascript
// Check if user has completed full onboarding
const hasCompletedOnboarding = !!user.baseline_completed ||
                              (user.onboarding_path === 'control' &&
                               user.primary_need &&
                               user.cycle_stage);

if (!hasCompletedOnboarding) {
  return res.status(403).json({
    success: false,
    error: 'Complete your profile to unlock personalized insights',
    requires_onboarding_completion: true,
    user_status: {
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed,
      has_primary_need: !!user.primary_need,
      has_cycle_stage: !!user.cycle_stage
    }
  });
}
```

### Database Schema
```sql
-- User table fields for A/B test tracking
onboarding_path TEXT,           -- 'control' or 'test'
baseline_completed BOOLEAN DEFAULT 0  -- For test path users
```

## Frontend Conditional Rendering

### Dashboard Logic
```typescript
// Only show insights if user has completed onboarding
{(() => {
  if (!user || !onboardingPath) {
    return false; // Loading state
  }
  
  const needsBaseline = needsBaselineCompletion(user, onboardingPath);
  return !needsBaseline;
})() && (
  <DailyInsightsDisplay />
)}

// Show completion prompt if needed
{(() => {
  if (!user || !onboardingPath) {
    return false;
  }
  
  const needsBaseline = needsBaselineCompletion(user, onboardingPath);
  return needsBaseline;
})() && (
  <CompleteProfilePrompt />
)}
```

### Loading State
```typescript
// Show loading until we have complete user data
if (!user || !onboardingPath) {
  return (
    <LoadingSpinner />
  );
}
```

## Analytics Integration

### Event Tracking
```typescript
// Path selection event
trackOnboardingPathSelected(path, {
  sessionId: getSessionId(),
  timestamp: Date.now()
});

// Onboarding completion event
trackOnboardingCompleted({
  path,
  completion_ms: Date.now() - startTime,
  sessionId,
  userId: user.id
});

// Baseline completion event (test path only)
trackBaselineCompleted({
  completion_ms: Date.now() - startTime,
  user_id: user.id,
  session_id: sessionId
});
```

### PostHog Integration
- **Feature Flag**: `fast_onboarding_v1`
- **Fallback**: Deterministic split when PostHog unavailable
- **Development**: Bypass for testing

## Environment Configuration

### Required Variables
```bash
# Enable A/B testing
VITE_AB_TEST_ENABLED=true

# Force specific path (development only)
VITE_FORCE_ONBOARDING_PATH=test    # Force fast path
VITE_FORCE_ONBOARDING_PATH=control # Force control path
VITE_FORCE_ONBOARDING_PATH=        # Random 50/50 split

# Debug logging
VITE_DEBUG_AB_TEST=true
```

## Testing & Validation

### A/B Test Validation
- **Hard Refresh**: Same path maintained
- **Session Persistence**: Cached decisions work correctly
- **50/50 Distribution**: Equal split between paths
- **Development Override**: Environment variables work for testing

### User Journey Validation
- **Test Path**: Fast signup → Profile completion → Full access
- **Control Path**: Full onboarding → Complete profile → Full access
- **Insights Blocking**: Backend correctly blocks until completion
- **Frontend Logic**: Conditional rendering works correctly

## Error Handling

### Graceful Degradation
```typescript
// Safe tracking wrapper
export const safeTrack = (trackingFunction: () => void) => {
  try {
    trackingFunction();
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    // Don't block user flow
  }
};
```

### Fallback Logic
- **PostHog Unavailable**: Use deterministic split
- **Session Storage Unavailable**: Generate new session ID
- **Environment Variables Missing**: Default to control path

## Performance Considerations

### Optimization
- **Lazy Loading**: Components only render when needed
- **Caching**: Session decisions prevent recalculation
- **Minimal Impact**: No performance impact on page load
- **Efficient Rendering**: Conditional logic prevents unnecessary renders

### Monitoring
- Track conversion rates between paths
- Monitor user satisfaction scores
- Analyze completion rates
- Measure time to first insight

## Success Criteria

### Functional Requirements
- ✅ **50/50 Split**: Equal distribution between paths
- ✅ **Consistency**: Same path on hard refresh
- ✅ **User Experience**: Appropriate onboarding for each path
- ✅ **Insights Logic**: Correct blocking until completion
- ✅ **Analytics**: Proper event tracking

### Technical Requirements
- ✅ **Performance**: No impact on page load
- ✅ **Reliability**: Deterministic behavior
- ✅ **Maintainability**: Clean, documented code
- ✅ **Testing**: Development override capabilities 