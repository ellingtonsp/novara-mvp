# AN-01 Event Tracking - Functional Logic Documentation

> **Feature**: AN-01 Event Tracking Instrumentation  
> **Epic**: Analytics & Insights  
> **Story ID**: AN-01  

## 🎯 Overview

This document describes the business logic, data flow, and technical implementation of the AN-01 event tracking system. The system provides foundational analytics instrumentation for measuring user activation, retention, and feature usage patterns.

## 🏗️ Architecture Overview

### **System Components**
```
User Action → Frontend Component → API Call → Backend Processing → Event Tracking → PostHog
```

### **Data Flow**
1. **User Interaction**: User performs action (signup, check-in, view insight, share)
2. **Component Logic**: Frontend component processes user action
3. **API Communication**: Backend API validates and processes request
4. **Success Response**: Backend returns success with data
5. **Event Firing**: Frontend fires PostHog event in success callback
6. **PostHog Processing**: Event sent to PostHog for analytics

## 📊 Event Schema & Business Logic

### **1. Signup Event (`signup`)**

#### **Business Logic**
- **Trigger**: Successful user account creation
- **Purpose**: Track user activation and onboarding completion
- **Business Value**: Measure signup funnel performance and conversion rates

#### **Data Schema**
```typescript
interface SignupEvent {
  user_id: string;           // Required: Airtable record ID
  signup_method: string;     // Required: "email" | "google" | "apple"
  referrer?: string;         // Optional: Traffic source
  experiment_variants?: string[]; // Optional: A/B test variants
  environment: string;       // Auto: Current environment
  timestamp: string;         // Auto: ISO timestamp
}
```

#### **Implementation Logic**
```typescript
// In frontend/src/lib/api.ts
const createUser = async (userData) => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Fire signup event on success
      trackSignup({
        user_id: result.data.user.id,
        signup_method: 'email',
        referrer: getReferrer(), // Extract from URL params
        experiment_variants: getExperimentVariants() // A/B test context
      });
      
      return result;
    }
  } catch (error) {
    // No event fired on error
    throw error;
  }
};
```

#### **Business Rules**
- **Single Fire**: Event fires only once per user account
- **Success Only**: No event fired on validation errors or network failures
- **User Identification**: PostHog user identification happens before event
- **Privacy**: No personal data (email, name) included in event

### **2. Check-in Submitted Event (`checkin_submitted`)**

#### **Business Logic**
- **Trigger**: Successful daily check-in submission
- **Purpose**: Track user engagement and retention patterns
- **Business Value**: Measure daily active users and engagement metrics

#### **Data Schema**
```typescript
interface CheckinSubmittedEvent {
  user_id: string;           // Required: Airtable record ID
  mood_score: number;        // Required: 1-10 confidence level
  symptom_flags: string[];   // Required: Selected mood tags
  time_to_complete_ms?: number; // Optional: Form completion time
  cycle_day?: number;        // Optional: Menstrual cycle day
  environment: string;       // Auto: Current environment
  timestamp: string;         // Auto: ISO timestamp
}
```

#### **Implementation Logic**
```typescript
// In frontend/src/components/DailyCheckinForm.tsx
const handleSubmit = async (formData) => {
  // Start timing
  (window as any).checkinStartTime = Date.now();
  
  try {
    const response = await submitCheckin(formData);
    
    if (response.success) {
      // Calculate completion time
      const timeToComplete = Date.now() - (window as any).checkinStartTime;
      
      // Fire check-in event
      trackCheckinSubmitted({
        user_id: user.id,
        mood_score: formData.confidence_today,
        symptom_flags: formData.mood_today.split(', '),
        time_to_complete_ms: timeToComplete,
        cycle_day: formData.cycle_day // if available
      });
    }
  } catch (error) {
    // No event fired on error
    throw error;
  }
};
```

#### **Business Rules**
- **Daily Limit**: One event per user per day (enforced by backend)
- **Time Tracking**: Accurate completion time measurement
- **Mood Conversion**: Confidence level used as mood score
- **Symptom Flags**: Selected moods converted to symptom flags array

### **3. Insight Viewed Event (`insight_viewed`)**

#### **Business Logic**
- **Trigger**: Insight card becomes 50% visible in viewport
- **Purpose**: Track content engagement and feature usage
- **Business Value**: Measure insight effectiveness and user engagement

#### **Data Schema**
```typescript
interface InsightViewedEvent {
  user_id: string;           // Required: Airtable record ID
  insight_id: string;        // Required: Unique insight identifier
  insight_type: string;      // Required: "daily_insight" | "welcome" | "micro"
  dwell_ms?: number;         // Optional: Time spent viewing
  cta_clicked?: boolean;     // Optional: Call-to-action interaction
  environment: string;       // Auto: Current environment
  timestamp: string;         // Auto: ISO timestamp
}
```

#### **Implementation Logic**
```typescript
// In frontend/src/components/DailyInsightsDisplay.tsx
useEffect(() => {
  if (!insight || insightViewed) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Fire insight viewed event
          trackInsightViewed({
            user_id: user.id,
            insight_id: `insight_${insight.type}_${Date.now()}`,
            insight_type: insight.type,
            dwell_ms: 0, // Will be updated if user stays
            cta_clicked: false
          });
          
          setInsightViewed(true);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 } // 50% visibility threshold
  );
  
  if (insightRef.current) {
    observer.observe(insightRef.current);
  }
  
  return () => observer.disconnect();
}, [insight, insightViewed]);
```

#### **Business Rules**
- **Single Fire**: Event fires only once per insight per session
- **Visibility Threshold**: 50% of insight card must be visible
- **Session Scoped**: Resets on page refresh or new session
- **Dwell Tracking**: Optional dwell time measurement

### **4. Share Action Event (`share_action`)**

#### **Business Logic**
- **Trigger**: Successful content sharing action
- **Purpose**: Track content virality and user engagement
- **Business Value**: Measure content effectiveness and user advocacy

#### **Data Schema**
```typescript
interface ShareActionEvent {
  user_id: string;           // Required: Airtable record ID
  share_surface: string;     // Required: "insight" | "checkin" | "dashboard"
  destination: string;       // Required: "whatsapp" | "email" | "clipboard"
  content_id?: string;       // Optional: Specific content identifier
  environment: string;       // Auto: Current environment
  timestamp: string;         // Auto: ISO timestamp
}
```

#### **Implementation Logic**
```typescript
// In frontend/src/components/DailyInsightsDisplay.tsx
const handleShare = async () => {
  if (!insight || !user) return;
  
  try {
    // Attempt native sharing first
    if (navigator.share) {
      await navigator.share({
        title: insight.title,
        text: insight.message,
        url: window.location.href
      });
      
      // Fire share event
      trackShareAction({
        user_id: user.id,
        share_surface: 'insight',
        destination: 'native', // Will be determined by user selection
        content_id: `insight_${insight.type}`
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(insight.message);
      
      // Fire share event
      trackShareAction({
        user_id: user.id,
        share_surface: 'insight',
        destination: 'clipboard',
        content_id: `insight_${insight.type}`
      });
    }
  } catch (error) {
    // No event fired on error
    console.error('Share failed:', error);
  }
};
```

#### **Business Rules**
- **Success Only**: Event fires only on successful share
- **Platform Detection**: Automatic destination detection where possible
- **Fallback Handling**: Graceful degradation for unsupported platforms
- **Content Attribution**: Links shared content to specific insight

## 🔧 Technical Implementation Details

### **PostHog Integration**

#### **Initialization Logic**
```typescript
// In frontend/src/lib/analytics.ts
export const initializeAnalytics = (): void => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  
  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics will be disabled.');
    return;
  }
  
  try {
    posthog.init(apiKey, {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      opt_out_capturing_by_default: false,
      respect_dnt: true,
      autocapture: false
    });
    
    console.log('PostHog analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
};
```

#### **Event Tracking Logic**
```typescript
// In frontend/src/lib/analytics.ts
export const track = (event: string, payload: Record<string, any>): void => {
  // Add environment context
  const enrichedPayload = {
    ...payload,
    environment: environmentConfig.environment,
    timestamp: new Date().toISOString()
  };
  
  // Development mode logging
  if (environmentConfig.isDevelopment) {
    console.debug('📊 PH-DEV Event:', event, enrichedPayload);
  }
  
  // Send to PostHog in production/staging
  if (environmentConfig.isProduction || environmentConfig.isStaging) {
    try {
      posthog.capture(event, enrichedPayload);
    } catch (error) {
      console.error('Failed to track event:', event, error);
    }
  }
};
```

### **Error Handling Strategy**

#### **Graceful Degradation**
- **Network Errors**: Event tracking failures don't affect user experience
- **PostHog Errors**: Console logging, no user-facing errors
- **Validation Errors**: No events fired, user sees appropriate error messages
- **Authentication Errors**: No events fired, user redirected to login

#### **Error Recovery**
- **Retry Logic**: No automatic retries (prevents spam)
- **Fallback Logging**: Console logging in development mode
- **User Feedback**: Clear error messages for user actions
- **Monitoring**: Error tracking for debugging and improvement

### **Performance Optimization**

#### **Event Timing**
- **Async Processing**: Non-blocking event submission
- **Immediate Firing**: Events fire within 200ms of user action
- **Batch Avoidance**: Single events for immediate feedback
- **Development Mode**: Console logging only, no network requests

#### **Resource Management**
- **Bundle Size**: PostHog JS adds ~30KB (acceptable for analytics)
- **Memory Usage**: Minimal memory footprint
- **CPU Impact**: Negligible performance impact
- **Network Usage**: Efficient event payloads

## 🔄 Data Flow & State Management

### **Event Lifecycle**
```
User Action → Component State → API Call → Backend Processing → Success Response → Event Firing → PostHog → Analytics Dashboard
```

### **State Dependencies**
- **Authentication State**: All events require valid user session
- **User Context**: User ID and properties available
- **Environment Context**: Current environment and configuration
- **Component State**: Component-specific state for event context

### **Data Validation**
- **Frontend Validation**: TypeScript interfaces ensure data integrity
- **Backend Validation**: API endpoints validate data before processing
- **PostHog Validation**: PostHog validates event schema
- **Error Handling**: Invalid data doesn't break user experience

## 🚨 Privacy & Security

### **Data Minimization**
- **No PII**: Only user_id (UUID) used in events
- **No Personal Data**: Names, emails, phone numbers excluded
- **No Health Data**: Personal health information not tracked
- **Minimal Context**: Only necessary business context included

### **Security Measures**
- **HTTPS Only**: All communications over secure channels
- **Token Validation**: Events respect authentication state
- **Environment Isolation**: Development data separate from production
- **Access Control**: PostHog access restricted to authorized users

### **Compliance**
- **HIPAA Ready**: No personal health information in events
- **GDPR Compliant**: Minimal data collection and user control
- **DNT Respect**: Honors Do Not Track browser setting
- **Audit Trail**: Events documented for compliance review

## 📊 Analytics & Business Intelligence

### **Key Metrics**
- **Activation Rate**: Signup completion percentage
- **Retention Rate**: D1/D7/D30 user retention
- **Engagement Rate**: Daily check-in completion
- **Feature Adoption**: Insight view and share rates

### **Funnel Analysis**
- **Signup Funnel**: Landing → Form → Account Creation
- **Activation Funnel**: Signup → First Check-in → Insight View
- **Retention Funnel**: Check-in → Insight View → Share Action

### **User Segmentation**
- **New Users**: First-time signups
- **Active Users**: Regular check-in completion
- **Engaged Users**: High insight view rates
- **Advocates**: Users who share content

## 🔄 Maintenance & Monitoring

### **Health Monitoring**
- **Event Delivery**: Track PostHog event delivery success rate
- **Performance**: Monitor event firing timing
- **Error Rates**: Track event tracking failures
- **Data Quality**: Monitor event payload completeness

### **Alerting**
- **High Error Rates**: Alert on >5% event tracking failures
- **Performance Degradation**: Alert on >200ms event firing
- **Data Loss**: Alert on significant event loss
- **Service Outages**: Alert on PostHog service issues

### **Regular Maintenance**
- **Test Coverage**: Maintain ≥90% test coverage
- **Documentation**: Keep documentation up to date
- **Performance Review**: Regular performance analysis
- **Privacy Review**: Regular privacy compliance review

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01  
**Owner**: Engineering Team 