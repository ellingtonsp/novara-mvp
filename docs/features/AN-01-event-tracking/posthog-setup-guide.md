# PostHog Setup Guide for AN-01 Event Tracking

## 🎯 Overview
This guide walks through setting up PostHog for the AN-01 Event Tracking Instrumentation feature. PostHog will capture user events to analyze activation & retention funnels.

## 📋 Prerequisites
- Novara staging deployment complete (✅ Done)
- Access to environment variable configuration
- Admin access to Vercel and Railway dashboards

## 🚀 Step-by-Step Setup

### 1. Create PostHog Account

1. **Visit PostHog**: Go to [https://app.posthog.com](https://app.posthog.com)
2. **Sign Up**: Click "Get Started" or "Sign Up"
3. **Choose Plan**: Select **PostHog Cloud** (free tier available)
4. **Organization Setup**:
   - Organization Name: `Novara Fertility`
   - Your Role: `Product Manager` or `Developer`
   - Team Size: `1-10` (or appropriate size)

### 2. Create Project

1. **Project Creation**:
   - Project Name: `Novara MVP`
   - Project URL: `https://novara-mvp.vercel.app`
   - Time Zone: `UTC` (recommended for global users)

2. **Data Capture Setup**:
   - **Enable Autocapture**: ❌ **DISABLE** (we're using custom events)
   - **Session Recording**: ❌ **DISABLE** (privacy compliance)
   - **Feature Flags**: ✅ **ENABLE** (for future A/B testing)
   - **Surveys**: ✅ **ENABLE** (for user feedback)

### 3. Get API Keys

1. **Navigate to Project Settings**:
   - Go to Project Settings → API Keys
   - Copy the **Project API Key** (starts with `phc_`)

2. **Environment-Specific Keys**:
   - **Staging**: Use the same key for now (can separate later)
   - **Production**: Will use the same key initially

### 4. Configure Environment Variables

#### Vercel Staging Environment
1. Go to [Vercel Dashboard](https://vercel.com/novara-fertility/novara-mvp)
2. Navigate to Settings → Environment Variables
3. Add:
   ```
   VITE_POSTHOG_API_KEY=phc_your_api_key_here
   VITE_ENV=staging
   VITE_DEBUG=false
   ```

#### Railway Staging Environment
1. Go to [Railway Dashboard](https://railway.app/project/f3025bf5-5cd5-4b7b-b045-4d477a4c7835)
2. Navigate to novara-staging service → Variables
3. Add:
   ```
   POSTHOG_API_KEY=phc_your_api_key_here
   NODE_ENV=staging
   ```

### 5. Test Configuration

#### Frontend Test
1. Visit staging frontend: https://novara-ix22j0sn9-novara-fertility.vercel.app
2. Open browser console (F12)
3. Look for PostHog initialization logs:
   ```
   PostHog initialized successfully
   ```

#### Backend Test
1. Check staging backend health: https://novara-staging-staging.up.railway.app/api/health
2. Should return environment: "staging"

### 6. Create Initial Dashboard

#### Activation & Retention Dashboard
1. **Go to Dashboards** in PostHog
2. **Create New Dashboard**: "Novara Activation & Retention"
3. **Add Key Metrics**:

   **Funnel Analysis**:
   - Event: `signup` → `checkin_submitted` → `insight_viewed`
   - Time Window: Last 7 days
   - Breakdown: By day

   **User Journey**:
   - Event: `signup`
   - Filter: Last 30 days
   - Breakdown: By `signup_method`

   **Engagement**:
   - Event: `checkin_submitted`
   - Filter: Last 7 days
   - Breakdown: By `mood_score`

### 7. Set Up Alerts (Optional)

#### D1 Funnel Alert
1. **Create Alert**:
   - Metric: Funnel completion rate
   - Condition: < 50% completion
   - Time Window: Last 24 hours
   - Notification: Email/Slack

#### High Churn Alert
1. **Create Alert**:
   - Metric: Users who signed up but didn't check in
   - Condition: > 70% of new users
   - Time Window: Last 7 days

## 🔍 Event Schema Reference

### Event Types (AN-01 Implementation)

#### `signup`
```json
{
  "user_id": "rec123456789",
  "signup_method": "email",
  "referrer": "direct",
  "environment": "staging",
  "timestamp": "2025-07-25T05:30:00.000Z"
}
```

#### `checkin_submitted`
```json
{
  "user_id": "rec123456789",
  "mood_score": 5,
  "symptom_flags": ["hopeful", "anxious"],
  "time_to_complete_ms": 45000,
  "environment": "staging",
  "timestamp": "2025-07-25T05:30:00.000Z"
}
```

#### `insight_viewed`
```json
{
  "user_id": "rec123456789",
  "insight_id": "insight_001",
  "insight_type": "daily_micro",
  "environment": "staging",
  "timestamp": "2025-07-25T05:30:00.000Z"
}
```

#### `share_action` (Future)
```json
{
  "user_id": "rec123456789",
  "share_platform": "whatsapp",
  "content_type": "insight",
  "environment": "staging",
  "timestamp": "2025-07-25T05:30:00.000Z"
}
```

## 🧪 Testing Checklist

### Pre-Launch Testing
- [ ] PostHog initialization logs appear in console
- [ ] Events fire when users sign up
- [ ] Events fire when users submit check-ins
- [ ] Events fire when insights are viewed
- [ ] No PII data in event payloads
- [ ] DNT (Do Not Track) respected
- [ ] Events appear in PostHog dashboard

### Post-Launch Monitoring
- [ ] D1 funnel completion rate ≥ 50%
- [ ] No console errors related to PostHog
- [ ] Event volume matches user activity
- [ ] Dashboard loads without errors

## 🚨 Troubleshooting

### Common Issues

#### "PostHog not initialized"
- Check `VITE_POSTHOG_API_KEY` environment variable
- Verify API key format (starts with `phc_`)
- Check browser console for errors

#### "Events not appearing"
- Verify PostHog project is active
- Check network tab for failed requests
- Ensure environment is not development (events disabled)

#### "Wrong environment detected"
- Check `VITE_ENV` environment variable
- Verify staging vs production URLs
- Check Railway environment variables

### Debug Commands
```bash
# Test staging frontend
curl -f https://novara-ix22j0sn9-novara-fertility.vercel.app

# Test staging backend
curl -f https://novara-staging-staging.up.railway.app/api/health

# Check environment variables
echo $VITE_POSTHOG_API_KEY
echo $VITE_ENV
```

## 📊 Success Metrics

### Week 1 Targets
- **D1 Funnel Completion**: ≥ 50%
- **Event Volume**: Match user signup volume
- **Error Rate**: < 1% of events fail

### Month 1 Targets
- **Retention Rate**: ≥ 30% D7 retention
- **Engagement**: ≥ 3 check-ins per active user
- **Insight Views**: ≥ 80% of check-ins result in insight views

## 🔄 Next Steps

1. **Complete PostHog setup** using this guide
2. **Test event tracking** with integration test script
3. **Monitor D1 funnel** for first week
4. **Create additional dashboards** based on insights
5. **Plan Sprint 2** churn-risk stories based on data

## 📞 Support

- **PostHog Documentation**: [https://posthog.com/docs](https://posthog.com/docs)
- **PostHog Community**: [https://posthog.com/slack](https://posthog.com/slack)
- **Novara Implementation**: Check `docs/features/AN-01-event-tracking/README.md`

---

**Last Updated**: 2025-07-25  
**Version**: 1.0  
**Status**: Ready for implementation 