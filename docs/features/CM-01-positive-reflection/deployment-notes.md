# CM-01: Deployment Notes & Environment Considerations

## Pre-Deployment Checklist

### Frontend Dependencies
- [x] No new npm packages required
- [x] Client-side sentiment analysis (no external APIs)
- [x] PostHog analytics already configured
- [x] TypeScript interfaces added for type safety

### Backend Dependencies
- [x] No new npm packages required
- [x] Airtable schema updates needed (see below)
- [x] Environment variables unchanged
- [x] No breaking changes to existing endpoints

### Database Schema Updates Required

**Airtable DailyCheckins Table - Add Fields:**
```
sentiment (Single Select)
  Options: positive, neutral, negative

sentiment_confidence (Number)
  Format: Decimal (0.000)
  
sentiment_scores (Long Text)
  Description: JSON string with detailed sentiment scores
  
sentiment_processing_time (Number)
  Format: Integer (milliseconds)
```

**SQL Commands for Reference:**
```sql
-- If using SQLite for local development
ALTER TABLE DailyCheckins ADD COLUMN sentiment TEXT;
ALTER TABLE DailyCheckins ADD COLUMN sentiment_confidence REAL;
ALTER TABLE DailyCheckins ADD COLUMN sentiment_scores TEXT;
ALTER TABLE DailyCheckins ADD COLUMN sentiment_processing_time INTEGER;
```

## Environment-Specific Considerations

### Local Development
- No additional setup required
- SQLite will auto-create new columns on first use
- Test sentiment analysis with browser console commands

### Staging Environment
- Verify PostHog analytics are working
- Test sentiment analysis performance on staging data
- Validate Airtable schema updates
- Run full test suite from `test-CM-01-sentiment-analysis.md`

### Production Environment
- Monitor sentiment processing performance (target <150ms)
- Track sentiment_scored events in PostHog dashboard
- Watch for any impact on check-in submission rates
- Monitor user engagement with celebratory copy

## Deployment Order

### 1. Backend Deployment First
```bash
# Deploy backend with sentiment data handling
railway environment staging
railway service novara-staging
railway up

# Verify backend accepts sentiment_analysis in request body
# Test endpoint: POST /api/checkins
```

### 2. Frontend Deployment Second
```bash
# Deploy frontend with sentiment analysis
cd frontend
vercel --target staging

# Verify sentiment analysis works in browser console
# Test celebratory copy variants display
```

### 3. Validation Tests
- Run complete test suite: `test-CM-01-sentiment-analysis.md`
- Verify analytics events in PostHog
- Check database for sentiment data storage

## Performance Monitoring

### Key Metrics to Watch
- **Sentiment Processing Time:** Should average <150ms
- **Check-in Completion Rate:** Should not decrease
- **Positive Sentiment Detection:** Monitor distribution
- **User Engagement:** Track insight interaction rates

### PostHog Analytics Setup
```javascript
// Verify these events are firing
'sentiment_scored' // New CM-01 event
'checkin_submitted' // Existing AN-01 event
'insight_viewed' // Existing AN-01 event
```

### Error Monitoring
- Watch for sentiment analysis failures in console logs
- Monitor for increased check-in submission errors
- Track any PostHog event tracking failures

## Rollback Strategy

### Frontend Rollback
```bash
# Quick frontend rollback if issues
cd frontend
vercel --target staging --force
# Deploy previous known-good commit
```

### Backend Rollback
```bash
# Backend rollback - remove sentiment handling
railway environment staging
railway service novara-staging
# Deploy previous commit without sentiment fields
```

### Database Rollback
- Sentiment fields are optional - no impact if removed
- Existing check-ins continue working normally
- No data loss if feature is disabled

## Feature Flag Strategy

### Gradual Rollout Option
```typescript
// Add feature flag in environment.ts if needed
export const SENTIMENT_ANALYSIS_ENABLED = 
  import.meta.env.VITE_ENABLE_SENTIMENT === 'true';

// Use in DailyCheckinForm.tsx
if (SENTIMENT_ANALYSIS_ENABLED) {
  // Perform sentiment analysis
} else {
  // Skip sentiment analysis
}
```

## Success Criteria

### Technical Metrics
- [ ] Sentiment analysis processing <150ms average
- [ ] No increase in check-in submission errors
- [ ] sentiment_scored events tracking successfully
- [ ] Database storing sentiment data correctly

### User Experience Metrics
- [ ] Positive sentiment detection working accurately
- [ ] Celebratory copy displaying for positive check-ins
- [ ] No user complaints about performance
- [ ] Neutral/negative flows unchanged

### Business Metrics (Post-Deployment)
- [ ] Users with mood ≥8 marking insights "Helpful" (target: ≥55%)
- [ ] D7 retention among users with ≥1 positive day (target: ≥55%)

## Post-Deployment Tasks

### Week 1: Monitoring
- Review sentiment distribution in PostHog
- Check performance metrics in browser dev tools
- Collect user feedback on celebratory copy
- Monitor error rates and analytics

### Week 2: Optimization
- Analyze sentiment accuracy with real user data
- A/B test different copy variants
- Optimize performance if needed
- Plan Phase 2 enhancements

### Month 1: Success Metrics
- Measure against CM-01 success criteria
- Prepare data for quarterly review
- Document lessons learned
- Plan DistilBERT upgrade path

## Known Issues & Mitigations

### Browser Compatibility
- **Issue:** performance.now() not available in very old browsers
- **Mitigation:** Graceful fallback to Date.now()

### Analytics Tracking
- **Issue:** PostHog may fail in some environments
- **Mitigation:** Sentiment analysis continues, errors logged

### Performance Edge Cases
- **Issue:** Very long user text (>1000 chars) may exceed 150ms
- **Mitigation:** Text truncation after 500 characters

## Emergency Contacts

### Technical Issues
- **Frontend:** Check Vercel deployment logs
- **Backend:** Check Railway deployment logs  
- **Analytics:** Check PostHog error dashboard
- **Database:** Check Airtable connection status

### Feature Disable
```bash
# Emergency disable via environment variable
# Set VITE_ENABLE_SENTIMENT=false in Vercel
# Redeploy frontend to disable feature
``` 