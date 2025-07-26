# ON-01 Deployment Notes: Speed-Tapper Detection

## Deployment Overview

ON-01 introduces speed-tap detection and fast onboarding path. This feature requires frontend changes only and leverages existing backend infrastructure from AN-01.

## Pre-Deployment Checklist

### Environment Validation
- [ ] **AN-01 Analytics**: Verify PostHog tracking is working in target environment
- [ ] **Session Storage**: Confirm browser session storage is available
- [ ] **Feature Flags**: Set up feature flag for gradual rollout
- [ ] **Monitoring**: Ensure analytics events are being captured

### Code Review Requirements
- [ ] **Speed-Tap Detection**: Logic tested for edge cases
- [ ] **Fast Path UI**: Component styling matches design system
- [ ] **Analytics Events**: All events properly tracked
- [ ] **Error Handling**: Graceful fallbacks implemented
- [ ] **Performance**: No Core Web Vitals regressions

### Testing Requirements
- [ ] **Unit Tests**: Speed-tap detection algorithm tested
- [ ] **Integration Tests**: Fast path flow end-to-end tested
- [ ] **Performance Tests**: No significant performance impact
- [ ] **Cross-Browser**: Works in Chrome, Safari, Firefox, Edge
- [ ] **Mobile Testing**: Touch interactions work correctly

## Deployment Strategy

### Phase 1: Feature Flag Deployment
```bash
# Deploy with feature flag disabled
REACT_APP_SPEED_TAP_ENABLED=false npm run build
./scripts/deploy-staging-automated.sh
```

### Phase 2: Internal Testing
```bash
# Enable for internal testing
REACT_APP_SPEED_TAP_ENABLED=true npm run build
./scripts/deploy-staging-automated.sh
```

### Phase 3: Gradual Rollout
```bash
# Enable for 10% of users
REACT_APP_SPEED_TAP_ENABLED=true REACT_APP_ROLLOUT_PERCENTAGE=10 npm run build
./scripts/deploy-staging-automated.sh
```

### Phase 4: Full Rollout
```bash
# Enable for all users
REACT_APP_SPEED_TAP_ENABLED=true npm run build
./scripts/deploy-staging-automated.sh
```

## Environment Configuration

### Frontend Environment Variables
```bash
# .env.staging
REACT_APP_SPEED_TAP_ENABLED=true
REACT_APP_ROLLOUT_PERCENTAGE=100
REACT_APP_SPEED_TAP_CONFIG={"timeWindowMs":10000,"tapThreshold":3,"maxStep":3}

# .env.production
REACT_APP_SPEED_TAP_ENABLED=true
REACT_APP_ROLLOUT_PERCENTAGE=100
REACT_APP_SPEED_TAP_CONFIG={"timeWindowMs":10000,"tapThreshold":3,"maxStep":3}
```

### Backend Environment Variables
```bash
# No new backend environment variables required
# Uses existing AN-01 analytics infrastructure
```

## Deployment Commands

### Staging Deployment
```bash
# Deploy to staging with feature flag
cd /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp
REACT_APP_SPEED_TAP_ENABLED=true npm run build
./scripts/deploy-staging-automated.sh
```

### Production Deployment
```bash
# Deploy to production with feature flag
cd /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp
REACT_APP_SPEED_TAP_ENABLED=true npm run build
./scripts/deploy-production.sh
```

## Post-Deployment Validation

### Health Checks
```bash
# Run comprehensive health check
node scripts/monitoring/comprehensive-health-check.js

# Test speed-tap detection
node scripts/testing/test-speed-tap-detection.js

# Validate analytics events
node scripts/testing/test-onboarding-analytics.js
```

### Manual Testing Checklist
- [ ] **Standard Flow**: Users not triggering speed-tap see normal onboarding
- [ ] **Speed-Tap Detection**: Rapid interactions trigger fast path
- [ ] **Fast Path UI**: 3-field form renders correctly
- [ ] **Data Preservation**: Already-entered data carried forward
- [ ] **Analytics Events**: Path selection and completion events fired
- [ ] **Transition Experience**: Smooth animation and clear messaging

### Analytics Validation
```sql
-- Check for onboarding path selection events
SELECT 
  JSON_EXTRACT(properties, '$.path') as path,
  COUNT(*) as count
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_path_selected'
AND timestamp > datetime('now', '-1 hour')
GROUP BY JSON_EXTRACT(properties, '$.path');

-- Check for onboarding completion events
SELECT 
  JSON_EXTRACT(properties, '$.path') as path,
  COUNT(*) as completions,
  AVG(CAST(JSON_EXTRACT(properties, '$.completion_ms') AS INTEGER)) as avg_completion_ms
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_completed'
AND timestamp > datetime('now', '-1 hour')
GROUP BY JSON_EXTRACT(properties, '$.path');
```

## Rollback Plan

### Immediate Rollback
```bash
# Disable feature flag and redeploy
REACT_APP_SPEED_TAP_ENABLED=false npm run build
./scripts/deploy-staging-automated.sh
```

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD
npm run build
./scripts/deploy-staging-automated.sh
```

### Database Rollback
```bash
# No database changes required
# Analytics events can be filtered out in queries if needed
```

## Monitoring & Alerting

### Key Metrics to Monitor
- **Onboarding Completion Rate**: Should not drop below 72% baseline
- **Fast Path Usage**: Should be <30% of total onboarding sessions
- **Speed-Tap Detection Accuracy**: Should have <5% false positives
- **Analytics Event Volume**: Should match expected onboarding volume

### Alert Thresholds
```javascript
// Alert if completion rate drops
if (completionRate < 0.72) {
  alert('Onboarding completion rate below baseline');
}

// Alert if fast path usage is too high
if (fastPathUsage > 0.30) {
  alert('Fast path usage above expected threshold');
}

// Alert if detection errors occur
if (detectionErrorRate > 0.05) {
  alert('Speed-tap detection error rate too high');
}
```

### Dashboard Queries
```sql
-- Real-time onboarding completion rate
SELECT 
  COUNT(CASE WHEN JSON_EXTRACT(properties, '$.path') = 'fast' THEN 1 END) * 100.0 / COUNT(*) as fast_path_percentage,
  COUNT(*) as total_completions
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_completed'
AND timestamp > datetime('now', '-1 hour');

-- Speed-tap detection accuracy
SELECT 
  JSON_EXTRACT(properties, '$.trigger_reason') as trigger_reason,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM AnalyticsEvents 
WHERE event_name = 'onboarding_path_selected'
AND timestamp > datetime('now', '-1 hour')
GROUP BY JSON_EXTRACT(properties, '$.trigger_reason');
```

## Performance Considerations

### Bundle Size Impact
- **Speed-Tap Detection**: ~2KB additional JavaScript
- **Fast Path UI**: ~5KB additional components
- **Analytics Enhancement**: ~1KB additional tracking code
- **Total Impact**: <10KB increase in bundle size

### Runtime Performance
- **Tap Recording**: O(1) operation per user interaction
- **Detection Check**: O(n) where n = taps in 10s window (typically <10)
- **Memory Usage**: <1KB per session for tap history
- **CPU Impact**: Minimal, runs on user interaction

### Core Web Vitals
- **LCP**: No impact (no new large resources)
- **FID**: No impact (no blocking operations)
- **CLS**: No impact (no layout shifts)
- **FCP**: No impact (no new critical resources)

## Security Considerations

### Data Privacy
- **Tap History**: Stored only in session storage, cleared on logout
- **Analytics Data**: No PII in tap events, only aggregated metrics
- **User Data**: Same privacy controls as existing user registration
- **Session Data**: Cleared on logout/session expiry

### Input Validation
- **Tap Events**: Validate timestamp, event type, step number
- **Onboarding Context**: Validate path, trigger reason
- **Completion Data**: Validate numeric ranges
- **Session Data**: Sanitize before storage

## Troubleshooting

### Common Issues

#### Speed-Tap Detection Not Working
```bash
# Check feature flag
echo $REACT_APP_SPEED_TAP_ENABLED

# Check session storage
node -e "console.log('Session storage available:', typeof sessionStorage !== 'undefined')"

# Check analytics events
node scripts/testing/test-analytics-events.js
```

#### Fast Path UI Not Rendering
```bash
# Check component imports
grep -r "FastOnboarding" frontend/src/

# Check routing configuration
grep -r "onboard/fast" frontend/src/

# Check for console errors
npm run build 2>&1 | grep -i error
```

#### Analytics Events Missing
```bash
# Check PostHog configuration
grep -r "posthog" frontend/src/

# Check tracking function calls
grep -r "track.*onboarding" frontend/src/

# Validate backend analytics endpoint
curl -X POST http://localhost:9002/api/analytics/test
```

### Debug Commands
```bash
# Enable debug logging
DEBUG=speed-tap-detection npm start

# Test speed-tap detection manually
node scripts/testing/test-speed-tap-manual.js

# Validate session storage
node scripts/testing/test-session-storage.js

# Check analytics event flow
node scripts/testing/test-analytics-flow.js
```

## Success Criteria

### 1-Week Post-Deployment
- [ ] **Completion Rate**: ≥80% overall onboarding completion
- [ ] **Fast Path Usage**: 10-30% of users trigger fast path
- [ ] **Performance**: No Core Web Vitals regressions
- [ ] **Analytics**: All events properly tracked and visible in PostHog
- [ ] **User Feedback**: No negative feedback about onboarding experience

### 1-Month Post-Deployment
- [ ] **Completion Rate**: ≥10% improvement for fast-path users
- [ ] **False Positives**: <5% of thoughtful users incorrectly routed
- [ ] **Performance**: Consistent performance across all browsers
- [ ] **Analytics**: Clear data showing feature effectiveness
- [ ] **User Satisfaction**: Positive feedback about streamlined experience 