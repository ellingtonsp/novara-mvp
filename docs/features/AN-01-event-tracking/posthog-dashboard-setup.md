# PostHog Dashboard Setup Guide - AN-01 Event Tracking

## Overview

This guide provides step-by-step instructions for creating the "Activation & Retention" dashboard in PostHog as required by AN-01 acceptance criteria.

## Dashboard Requirements

### Dashboard Name
**"Activation & Retention"**

### Required Funnels & Metrics

#### 1. Activation Funnel
- **Funnel**: signup → checkin_submitted (first) → insight_viewed
- **Purpose**: Measure user activation from signup to first insight engagement
- **Breakdown**: signup_method, referrer

#### 2. Retention Analysis
- **Metric**: People who performed signup and returned with checkin_submitted
- **Timeframes**: D1, D7, D30 retention
- **Breakdown**: signup_method, referrer

#### 3. Feature Usage Metrics
- **Check-in Completion Rate**: Daily check-ins submitted
- **Insight Engagement**: Insight views and dwell time
- **Share Actions**: Share button usage across surfaces

## Step-by-Step Setup

### Step 1: Access PostHog Dashboard

1. **Login to PostHog**: https://app.posthog.com
2. **Navigate to**: Project → Dashboards
3. **Create New Dashboard**: Click "New Dashboard"

### Step 2: Create Activation Funnel

1. **Add Funnel Widget**:
   - Click "Add Widget" → "Funnel"
   - Name: "User Activation Funnel"

2. **Configure Funnel Steps**:
   ```
   Step 1: Event = "signup"
   Step 2: Event = "checkin_submitted" 
   Step 3: Event = "insight_viewed"
   ```

3. **Set Time Range**: Last 30 days
4. **Add Breakdown**: signup_method, referrer

### Step 3: Create Retention Analysis

1. **Add Retention Widget**:
   - Click "Add Widget" → "Retention"
   - Name: "User Retention Analysis"

2. **Configure Retention**:
   - **Starting Event**: "signup"
   - **Returning Event**: "checkin_submitted"
   - **Time Periods**: 1, 7, 30 days

3. **Add Breakdown**: signup_method, referrer

### Step 4: Add Feature Usage Metrics

#### Check-in Completion Rate
1. **Add Trends Widget**:
   - Name: "Daily Check-ins"
   - Event: "checkin_submitted"
   - Display: Line chart
   - Time Range: Last 30 days

#### Insight Engagement
1. **Add Trends Widget**:
   - Name: "Insight Views"
   - Event: "insight_viewed"
   - Breakdown: insight_type
   - Display: Bar chart

#### Share Actions
1. **Add Trends Widget**:
   - Name: "Share Actions"
   - Event: "share_action"
   - Breakdown: share_surface, destination
   - Display: Pie chart

### Step 5: Configure Dashboard Settings

1. **Dashboard Properties**:
   - Name: "Activation & Retention"
   - Description: "AN-01 Event Tracking Dashboard - User activation and retention metrics"
   - Access: Read-only for team members

2. **Refresh Settings**:
   - Auto-refresh: Every 5 minutes
   - Time Range: Last 30 days (default)

### Step 6: Share Dashboard

1. **Get Shareable Link**:
   - Click "Share" button
   - Copy readonly link
   - Format: `https://app.posthog.com/dashboard/[dashboard-id]?share_token=[token]`

2. **Share in Slack**:
   - Channel: #product-analytics
   - Message: "AN-01 Dashboard ready: [link]"

## Dashboard Validation Checklist

### ✅ Funnel Configuration
- [ ] signup → checkin_submitted → insight_viewed funnel created
- [ ] Breakdown by signup_method and referrer
- [ ] Conversion rates visible and reasonable

### ✅ Retention Configuration
- [ ] D1/D7/D30 retention metrics configured
- [ ] Starting event: signup
- [ ] Returning event: checkin_submitted
- [ ] Breakdown filters applied

### ✅ Feature Usage Metrics
- [ ] Daily check-in completion rate
- [ ] Insight view engagement
- [ ] Share action tracking
- [ ] Proper time ranges and breakdowns

### ✅ Dashboard Settings
- [ ] Dashboard named "Activation & Retention"
- [ ] Read-only access configured
- [ ] Auto-refresh enabled
- [ ] Shareable link generated

## Expected Metrics & Benchmarks

### Activation Funnel Targets
- **Signup → First Check-in**: Target ≥50% (D1)
- **First Check-in → Insight View**: Target ≥30% (D1)
- **Overall Funnel**: Target ≥15% (D1)

### Retention Targets
- **D1 Retention**: Target ≥50%
- **D7 Retention**: Target ≥25%
- **D30 Retention**: Target ≥10%

### Feature Usage Targets
- **Daily Check-in Rate**: Target ≥60% of active users
- **Insight View Rate**: Target ≥40% of users with insights
- **Share Action Rate**: Target ≥5% of users

## Troubleshooting

### Common Issues

#### No Events Appearing
1. **Check Event Names**: Ensure events match exactly: "signup", "checkin_submitted", "insight_viewed", "share_action"
2. **Verify API Key**: Confirm PostHog API key is correct in environment variables
3. **Check Environment**: Ensure events are being sent to correct PostHog project

#### Funnel Steps Not Working
1. **Event Timing**: Ensure events fire in correct sequence
2. **User Identification**: Verify user_id is consistent across events
3. **Time Windows**: Check if funnel time window is appropriate

#### Retention Metrics Missing
1. **Event Attribution**: Ensure events are properly attributed to users
2. **Time Periods**: Verify retention time periods are configured correctly
3. **Data Volume**: Check if sufficient data exists for retention analysis

### Debugging Steps

1. **Check PostHog Activity**:
- Go to Activity (left sidebar menu)
   - Verify events are being received
   - Check event properties and user identification

2. **Validate Event Properties**:
   - Ensure required properties are present
   - Check property types (string, number, array)
   - Verify user_id format

3. **Test Event Sending**:
   - Use PostHog debugger to test event sending
   - Verify events appear in real-time

## Maintenance

### Regular Tasks
- **Weekly**: Review funnel conversion rates
- **Monthly**: Update retention benchmarks
- **Quarterly**: Review dashboard configuration and metrics

### Updates Required
- **New Features**: Add new events to relevant funnels
- **Property Changes**: Update breakdown filters
- **User Feedback**: Adjust metrics based on product insights

## Success Criteria

### Technical Success
- [ ] Dashboard loads without errors
- [ ] All widgets display data correctly
- [ ] Auto-refresh works properly
- [ ] Shareable link accessible to team

### Business Success
- [ ] Funnel conversion rates measurable
- [ ] Retention trends visible
- [ ] Feature usage patterns clear
- [ ] Data-driven decisions possible

---

**Dashboard Status**: ✅ **READY FOR IMPLEMENTATION**

The PostHog dashboard setup is complete and ready for deployment. Follow the step-by-step guide above to create the "Activation & Retention" dashboard and validate all metrics are working correctly. 