# AN-01 Event Tracking - User Journey Documentation

> **Feature**: AN-01 Event Tracking Instrumentation  
> **Epic**: Analytics & Insights  
> **Story ID**: AN-01  

## 🎯 Overview

This document describes the complete user journeys and interactions that trigger AN-01 event tracking. Each journey maps to specific PostHog events that enable Product & Growth teams to analyze activation, retention, and feature usage funnels.

## 👤 User Personas

### **Primary Personas**
- **Emily "Hopeful Planner"** - New user exploring fertility support
- **Alex "One-and-Done"** - Returning user seeking ongoing guidance
- **Product Manager** - Analyzing user behavior and funnel performance

## 🚀 User Journey 1: Account Creation (signup)

### **Journey Description**
New user discovers Novara, completes onboarding, and creates an account.

### **User Flow**
```
Landing Page → Onboarding Form → Account Creation → Welcome Insight
```

### **Step-by-Step Flow**

#### **Step 1: Landing Page Discovery**
- **User Action**: User visits Novara landing page
- **Context**: Organic search, social media, or direct referral
- **No Event**: Landing page views not tracked (privacy-focused)

#### **Step 2: Onboarding Form Interaction**
- **User Action**: User fills out onboarding form
- **Fields**: Email, nickname, confidence levels, primary needs
- **No Event**: Form interactions not tracked (privacy-focused)

#### **Step 3: Account Creation**
- **User Action**: User clicks "Get Started" button
- **Backend Process**: 
  - Validates form data
  - Creates user record in database
  - Generates JWT token
  - Returns success response
- **Event Trigger**: `signup` event fired in success callback
- **Event Payload**:
  ```typescript
  {
    user_id: "rec1234567890",
    signup_method: "email",
    referrer: "google", // optional
    experiment_variants: ["variant_a"], // optional
    environment: "production",
    timestamp: "2025-07-25T10:30:00.000Z"
  }
  ```

#### **Step 4: Welcome Insight**
- **User Action**: User sees personalized welcome insight
- **Context**: First-time user experience
- **Event Trigger**: `insight_viewed` event (covered in Journey 3)

### **Success Criteria**
- User account created successfully
- `signup` event appears in PostHog within 30s
- User redirected to welcome insight
- JWT token stored for authentication

### **Failure Scenarios**
- **Network Error**: Form submission fails, no event fired
- **Validation Error**: Invalid email/required fields, no event fired
- **Duplicate User**: Existing email, no event fired
- **PostHog Error**: Account created but event tracking fails (graceful degradation)

## 📝 User Journey 2: Daily Check-in (checkin_submitted)

### **Journey Description**
Authenticated user completes daily mood and confidence check-in.

### **User Flow**
```
Dashboard → Check-in Form → Form Submission → Success Response → Insight Display
```

### **Step-by-Step Flow**

#### **Step 1: Dashboard Access**
- **User Action**: User navigates to dashboard
- **Context**: Authenticated user session
- **No Event**: Dashboard views not tracked (privacy-focused)

#### **Step 2: Check-in Form Interaction**
- **User Action**: User interacts with check-in form
- **Start Time**: `(window as any).checkinStartTime = Date.now()`
- **Form Fields**:
  - Mood selection (multiple choice)
  - Confidence level (1-10 slider)
  - Optional notes
- **No Event**: Form interactions not tracked (privacy-focused)

#### **Step 3: Form Submission**
- **User Action**: User clicks "Submit" button
- **Backend Process**:
  - Validates form data
  - Saves check-in to database
  - Generates personalized insight
  - Returns success response
- **Event Trigger**: `checkin_submitted` event fired in success callback
- **Event Payload**:
  ```typescript
  {
    user_id: "rec1234567890",
    mood_score: 7,
    symptom_flags: ["hopeful", "anxious"],
    time_to_complete_ms: 45000,
    cycle_day: 14, // optional
    environment: "production",
    timestamp: "2025-07-25T10:30:00.000Z"
  }
  ```

#### **Step 4: Insight Display**
- **User Action**: User sees personalized daily insight
- **Context**: Post-check-in reward and guidance
- **Event Trigger**: `insight_viewed` event (covered in Journey 3)

### **Success Criteria**
- Check-in saved successfully
- `checkin_submitted` event appears in PostHog within 30s
- Personalized insight displayed
- Completion time accurately tracked

### **Failure Scenarios**
- **Network Error**: Form submission fails, no event fired
- **Validation Error**: Invalid data, no event fired
- **Authentication Error**: Expired token, no event fired
- **PostHog Error**: Check-in saved but event tracking fails (graceful degradation)

## 👁️ User Journey 3: Insight Viewing (insight_viewed)

### **Journey Description**
User views personalized insights, triggering visibility tracking.

### **User Flow**
```
Insight Card → Intersection Observer → Visibility Threshold → Event Tracking
```

### **Step-by-Step Flow**

#### **Step 1: Insight Card Display**
- **User Action**: Insight card rendered in UI
- **Context**: Dashboard, welcome flow, or post-check-in
- **Setup**: IntersectionObserver configured with 50% threshold

#### **Step 2: Visibility Detection**
- **User Action**: User scrolls or navigates to insight
- **Technology**: IntersectionObserver API
- **Threshold**: 50% of insight card visible in viewport
- **Single Fire**: Event fires only once per insight per session

#### **Step 3: Event Tracking**
- **Trigger**: IntersectionObserver callback when threshold met
- **Event Payload**:
  ```typescript
  {
    user_id: "rec1234567890",
    insight_id: "daily_insight_1753251146511",
    insight_type: "daily_insight",
    dwell_ms: 5000, // optional
    cta_clicked: false, // optional
    environment: "production",
    timestamp: "2025-07-25T10:30:00.000Z"
  }
  ```

#### **Step 4: Dwell Time Tracking**
- **User Action**: User continues viewing insight
- **Technology**: setTimeout tracking
- **Optional Event**: Additional `insight_viewed` with updated dwell_ms

### **Success Criteria**
- Insight becomes 50% visible
- `insight_viewed` event appears in PostHog within 30s
- Event fires only once per insight per session
- Dwell time accurately tracked

### **Failure Scenarios**
- **IntersectionObserver Unsupported**: Fallback to manual tracking
- **PostHog Error**: Event tracking fails (graceful degradation)
- **User Scrolls Away**: Event still fired (threshold already met)

## 📤 User Journey 4: Share Action (share_action)

### **Journey Description**
User shares insights or content with others.

### **User Flow**
```
Share Button → Share Dialog → Platform Selection → Content Sharing → Event Tracking
```

### **Step-by-Step Flow**

#### **Step 1: Share Button Interaction**
- **User Action**: User clicks share button on insight
- **Context**: Insight card, dashboard, or specific content
- **UI**: Share button with platform options

#### **Step 2: Share Dialog**
- **User Action**: Share dialog appears
- **Options**: WhatsApp, Email, Clipboard, Social Media
- **Technology**: Web Share API or custom dialog

#### **Step 3: Platform Selection**
- **User Action**: User selects sharing destination
- **Options**: 
  - `whatsapp` - Direct WhatsApp sharing
  - `email` - Email composition
  - `clipboard` - Copy to clipboard
  - `social` - Social media platforms

#### **Step 4: Content Sharing**
- **User Action**: Content shared successfully
- **Technology**: Web Share API or clipboard API
- **Event Trigger**: `share_action` event fired after successful share
- **Event Payload**:
  ```typescript
  {
    user_id: "rec1234567890",
    share_surface: "insight",
    destination: "whatsapp",
    content_id: "insight_daily_1753251146511", // optional
    environment: "production",
    timestamp: "2025-07-25T10:30:00.000Z"
  }
  ```

### **Success Criteria**
- Share action completed successfully
- `share_action` event appears in PostHog within 30s
- Correct destination and surface tracked
- User receives confirmation

### **Failure Scenarios**
- **Web Share API Unsupported**: Fallback to clipboard
- **Share Cancelled**: No event fired
- **Network Error**: Share fails, no event fired
- **PostHog Error**: Share succeeds but event tracking fails (graceful degradation)

## 🔄 Cross-Journey Interactions

### **User Session Flow**
```
signup → insight_viewed → checkin_submitted → insight_viewed → share_action
```

### **Event Dependencies**
- **Authentication Required**: All events require valid user session
- **User Identification**: PostHog user identification before event tracking
- **Environment Context**: All events include environment and timestamp
- **Error Isolation**: Event tracking failures don't affect user experience

### **Performance Requirements**
- **Event Timing**: All events fire within 200ms of user action
- **Non-blocking**: Event tracking doesn't block UI interactions
- **Graceful Degradation**: PostHog failures don't break user flows
- **Development Mode**: Console logging only, no network requests

## 📊 Analytics Value

### **Activation Funnel**
```
Landing Page → signup → insight_viewed → checkin_submitted
```

### **Retention Analysis**
- **D1 Retention**: Users who signup and return within 24 hours
- **D7 Retention**: Users who complete check-in within 7 days
- **D30 Retention**: Users who maintain check-in habit

### **Feature Usage**
- **Insight Engagement**: Which insights drive most views
- **Share Behavior**: Most shared content types
- **User Patterns**: Time-to-complete and dwell time analysis

### **Drop-off Points**
- **Signup Abandonment**: Users who start but don't complete signup
- **Check-in Drop-off**: Users who signup but don't complete first check-in
- **Engagement Decline**: Users who stop viewing insights

## 🚨 Privacy & Compliance

### **Data Minimization**
- **No PII**: Only user_id (UUID) used in events
- **No Names**: User names not tracked
- **No Emails**: Email addresses not tracked
- **No Phone Numbers**: Phone numbers not tracked

### **User Control**
- **DNT Respect**: Honors Do Not Track browser setting
- **Session Recording**: Disabled for privacy
- **Autocapture**: Disabled to prevent unintended tracking
- **Opt-out**: Users can disable tracking (future enhancement)

### **Compliance**
- **HIPAA Ready**: No personal health information in events
- **GDPR Compliant**: Minimal data collection
- **Audit Trail**: Events documented for compliance review

## 🔧 Technical Implementation

### **Event Firing Points**
- **signup**: `frontend/src/lib/api.ts` → `createUser()` success callback
- **checkin_submitted**: `frontend/src/lib/api.ts` → `submitCheckin()` success callback
- **insight_viewed**: `frontend/src/components/DailyInsightsDisplay.tsx` → IntersectionObserver
- **share_action**: `frontend/src/components/DailyInsightsDisplay.tsx` → `handleShare()`

### **Error Handling**
- **Network Errors**: Graceful degradation, no event fired
- **PostHog Errors**: Console logging, user experience unaffected
- **Validation Errors**: No event fired, user sees error message
- **Authentication Errors**: No event fired, user redirected to login

### **Performance Optimization**
- **Async Tracking**: Non-blocking event submission
- **Batch Processing**: Single events for immediate feedback
- **Development Mode**: Console logging only
- **Error Isolation**: Tracking failures don't affect core functionality

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01  
**Owner**: Engineering Team 