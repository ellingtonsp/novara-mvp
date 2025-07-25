# AN-01 Event Tracking - Testing Scenarios Documentation

> **Feature**: AN-01 Event Tracking Instrumentation  
> **Epic**: Analytics & Insights  
> **Story ID**: AN-01  

## 🎯 Overview

This document provides comprehensive testing scenarios for the AN-01 event tracking implementation. It covers unit tests, integration tests, and manual testing procedures to ensure all acceptance criteria are met.

## 🧪 Test Categories

### **1. Unit Tests**
- **Location**: `frontend/src/lib/analytics.test.ts`
- **Coverage**: ≥90% branch coverage requirement
- **Framework**: Vitest + React Testing Library
- **Status**: ✅ Complete

### **2. Integration Tests**
- **Location**: `frontend/src/test/AN-01-integration.test.tsx`
- **Coverage**: Real component usage scenarios
- **Framework**: Vitest + React Testing Library
- **Status**: ✅ Complete

### **3. Manual Testing**
- **Location**: This document
- **Coverage**: End-to-end user journeys
- **Environment**: Staging and production
- **Status**: ✅ Ready for execution

## 📋 Test Scenarios

### **Scenario 1: Signup Event Tracking**

#### **Test Case 1.1: Successful Signup**
**Objective**: Verify signup event fires correctly on successful account creation

**Steps**:
1. Navigate to landing page
2. Fill out onboarding form with valid data
3. Click "Get Started" button
4. Verify account creation success
5. Check browser console for signup event
6. Verify PostHog dashboard for event appearance

**Expected Results**:
- ✅ Account created successfully
- ✅ `signup` event appears in console within 200ms
- ✅ Event payload contains: `user_id`, `signup_method: "email"`
- ✅ Event appears in PostHog within 30s
- ✅ User redirected to welcome insight

**Test Data**:
```json
{
  "email": "test@example.com",
  "nickname": "TestUser",
  "confidence_meds": 5,
  "confidence_costs": 7,
  "confidence_overall": 6,
  "primary_need": "medical_clarity"
}
```

#### **Test Case 1.2: Signup with Referrer**
**Objective**: Verify referrer tracking in signup events

**Steps**:
1. Navigate to landing page with `?ref=google` parameter
2. Complete signup process
3. Verify referrer included in event payload

**Expected Results**:
- ✅ `referrer: "google"` in event payload
- ✅ All other signup event requirements met

#### **Test Case 1.3: Signup Failure**
**Objective**: Verify no event fired on signup failure

**Steps**:
1. Fill out form with invalid email
2. Submit form
3. Verify validation error displayed
4. Check console for absence of signup event

**Expected Results**:
- ❌ No `signup` event fired
- ✅ User sees validation error message
- ✅ Form remains on page

### **Scenario 2: Check-in Submitted Event Tracking**

#### **Test Case 2.1: Successful Check-in**
**Objective**: Verify check-in event fires correctly on successful submission

**Steps**:
1. Login with existing user
2. Navigate to check-in form
3. Select mood options and confidence level
4. Add optional notes
5. Click "Submit" button
6. Verify check-in success
7. Check console for check-in event

**Expected Results**:
- ✅ Check-in saved successfully
- ✅ `checkin_submitted` event appears in console within 200ms
- ✅ Event payload contains: `user_id`, `mood_score`, `symptom_flags`
- ✅ `time_to_complete_ms` accurately measured
- ✅ Event appears in PostHog within 30s

**Test Data**:
```json
{
  "mood_today": "hopeful, excited",
  "confidence_today": 8,
  "user_note": "Feeling optimistic today"
}
```

#### **Test Case 2.2: Check-in with Timing**
**Objective**: Verify accurate completion time tracking

**Steps**:
1. Start check-in form
2. Wait 30 seconds
3. Complete form submission
4. Verify `time_to_complete_ms` is approximately 30000

**Expected Results**:
- ✅ `time_to_complete_ms` within ±1000ms of actual time
- ✅ All other check-in event requirements met

#### **Test Case 2.3: Check-in Failure**
**Objective**: Verify no event fired on check-in failure

**Steps**:
1. Submit check-in with invalid data
2. Verify validation error displayed
3. Check console for absence of check-in event

**Expected Results**:
- ❌ No `checkin_submitted` event fired
- ✅ User sees validation error message
- ✅ Form remains on page

### **Scenario 3: Insight Viewed Event Tracking**

#### **Test Case 3.1: Insight Visibility**
**Objective**: Verify insight viewed event fires when insight becomes visible

**Steps**:
1. Login with existing user
2. Navigate to dashboard
3. Scroll to insight card
4. Verify insight becomes 50% visible
5. Check console for insight viewed event

**Expected Results**:
- ✅ `insight_viewed` event appears in console when 50% visible
- ✅ Event payload contains: `user_id`, `insight_id`, `insight_type`
- ✅ Event fires only once per insight per session
- ✅ Event appears in PostHog within 30s

#### **Test Case 3.2: Multiple Insights**
**Objective**: Verify multiple insights tracked separately

**Steps**:
1. Navigate to dashboard with multiple insights
2. Scroll through each insight
3. Verify separate events for each insight

**Expected Results**:
- ✅ Separate `insight_viewed` events for each insight
- ✅ Unique `insight_id` for each event
- ✅ Correct `insight_type` for each insight

#### **Test Case 3.3: Insight Refresh**
**Objective**: Verify event resets on page refresh

**Steps**:
1. View insight (event fires)
2. Refresh page
3. Scroll to same insight
4. Verify event fires again

**Expected Results**:
- ✅ Event fires again after page refresh
- ✅ Same insight tracked as new session

### **Scenario 4: Share Action Event Tracking**

#### **Test Case 4.1: Successful Share**
**Objective**: Verify share event fires on successful sharing

**Steps**:
1. Navigate to insight card
2. Click share button
3. Select sharing destination (clipboard)
4. Verify share success
5. Check console for share event

**Expected Results**:
- ✅ Share action completed successfully
- ✅ `share_action` event appears in console within 200ms
- ✅ Event payload contains: `user_id`, `share_surface`, `destination`
- ✅ Event appears in PostHog within 30s

#### **Test Case 4.2: Share Cancellation**
**Objective**: Verify no event fired on share cancellation

**Steps**:
1. Click share button
2. Cancel share dialog
3. Verify no share event fired

**Expected Results**:
- ❌ No `share_action` event fired
- ✅ Share dialog closes without action

#### **Test Case 4.3: Share Failure**
**Objective**: Verify no event fired on share failure

**Steps**:
1. Attempt share on unsupported platform
2. Verify share failure
3. Check console for absence of share event

**Expected Results**:
- ❌ No `share_action` event fired
- ✅ User sees appropriate error message

## 🔧 Performance Testing

### **Test Case P1: Event Timing**
**Objective**: Verify events fire within 200ms requirement

**Steps**:
1. Use browser dev tools Performance tab
2. Perform user action (signup, check-in, etc.)
3. Measure time from action to event firing
4. Repeat 10 times for each event type

**Expected Results**:
- ✅ All events fire within 200ms
- ✅ Average timing <100ms
- ✅ No events exceed 200ms threshold

### **Test Case P2: Load Testing**
**Objective**: Verify system handles high event volume

**Steps**:
1. Simulate 500 events per minute
2. Monitor for 10 minutes
3. Check event loss rate
4. Monitor system performance

**Expected Results**:
- ✅ Event loss rate <0.5% per day
- ✅ System performance unaffected
- ✅ PostHog receives all events

## 🚨 Error Handling Testing

### **Test Case E1: PostHog Unavailable**
**Objective**: Verify graceful degradation when PostHog is unavailable

**Steps**:
1. Block PostHog API calls (network tab)
2. Perform user actions
3. Verify user experience unaffected
4. Check console for error logging

**Expected Results**:
- ✅ User experience unaffected
- ✅ Console shows PostHog error logs
- ✅ No user-facing errors
- ✅ Events logged in development mode

### **Test Case E2: Network Errors**
**Objective**: Verify handling of network failures

**Steps**:
1. Disconnect network during user action
2. Perform user action
3. Verify appropriate error handling
4. Reconnect and verify normal operation

**Expected Results**:
- ✅ User sees appropriate error message
- ✅ No events fired on network failure
- ✅ System recovers when network restored

### **Test Case E3: Authentication Errors**
**Objective**: Verify handling of authentication failures

**Steps**:
1. Use expired JWT token
2. Perform user action
3. Verify authentication error handling
4. Verify no events fired

**Expected Results**:
- ✅ User redirected to login
- ✅ No events fired with invalid authentication
- ✅ Clear error message displayed

## 🔒 Privacy & Security Testing

### **Test Case S1: PII Validation**
**Objective**: Verify no personal data in events

**Steps**:
1. Perform all user actions
2. Capture event payloads
3. Verify no email, name, or phone in events
4. Verify only user_id used for identification

**Expected Results**:
- ✅ No personal data in event payloads
- ✅ Only user_id used for identification
- ✅ All events privacy-compliant

### **Test Case S2: DNT Compliance**
**Objective**: Verify Do Not Track compliance

**Steps**:
1. Enable Do Not Track in browser
2. Perform user actions
3. Verify PostHog respects DNT setting
4. Check for appropriate behavior

**Expected Results**:
- ✅ PostHog respects DNT setting
- ✅ No tracking when DNT enabled
- ✅ User experience unaffected

## 📊 Data Quality Testing

### **Test Case D1: Event Schema Validation**
**Objective**: Verify all events match required schema

**Steps**:
1. Perform all user actions
2. Capture event payloads
3. Validate against TypeScript interfaces
4. Verify all required fields present

**Expected Results**:
- ✅ All events match required schema
- ✅ All required fields present
- ✅ Optional fields handled correctly
- ✅ Data types correct

### **Test Case D2: Environment Detection**
**Objective**: Verify correct environment in events

**Steps**:
1. Test in development environment
2. Test in staging environment
3. Test in production environment
4. Verify environment field correct

**Expected Results**:
- ✅ Environment field matches actual environment
- ✅ Development: console logging only
- ✅ Staging/Production: PostHog events sent

## 🚀 Deployment Testing

### **Test Case DP1: Staging Deployment**
**Objective**: Verify events work in staging environment

**Steps**:
1. Deploy to staging
2. Perform all user actions
3. Verify events appear in PostHog
4. Check environment detection

**Expected Results**:
- ✅ All events work in staging
- ✅ Environment detected as "staging"
- ✅ Events appear in PostHog staging project

### **Test Case DP2: Production Deployment**
**Objective**: Verify events work in production environment

**Steps**:
1. Deploy to production
2. Perform all user actions
3. Verify events appear in PostHog
4. Check environment detection

**Expected Results**:
- ✅ All events work in production
- ✅ Environment detected as "production"
- ✅ Events appear in PostHog production project

## 📋 Test Execution Checklist

### **Pre-Test Setup**
- [ ] Test environment configured
- [ ] PostHog API keys set
- [ ] Browser dev tools open
- [ ] Network tab monitoring enabled
- [ ] Console logging enabled

### **Test Execution**
- [ ] Run unit tests: `npm test analytics.test.ts`
- [ ] Run integration tests: `npm test AN-01-integration.test.tsx`
- [ ] Execute manual test scenarios
- [ ] Verify all acceptance criteria
- [ ] Document any issues found

### **Post-Test Validation**
- [ ] All tests passing
- [ ] Coverage ≥90%
- [ ] Performance requirements met
- [ ] Privacy requirements met
- [ ] Documentation updated

## 🎯 Success Criteria

### **Technical Requirements**
- ✅ All 4 events implemented and tested
- ✅ Events fire within 200ms
- ✅ ≥90% test coverage achieved
- ✅ Error handling robust
- ✅ Privacy compliance verified

### **Business Requirements**
- ✅ Activation funnel measurable
- ✅ Retention analysis possible
- ✅ Feature usage trackable
- ✅ Data quality high
- ✅ Performance impact minimal

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01  
**Owner**: Engineering Team 