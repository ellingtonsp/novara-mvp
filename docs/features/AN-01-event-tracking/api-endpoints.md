# AN-01 Event Tracking - API Endpoints Documentation

> **Feature**: AN-01 Event Tracking Instrumentation  
> **Epic**: Analytics & Insights  
> **Story ID**: AN-01  

## 🎯 Overview

This document describes the API endpoints and backend integration for AN-01 event tracking. The implementation focuses on frontend event tracking with PostHog, but includes server-side PostHog integration for enhanced analytics.

## 📊 API Endpoints Summary

### **Frontend Event Tracking**
- **No New Endpoints**: Events sent directly to PostHog from frontend
- **Integration Points**: Existing API endpoints enhanced with event tracking
- **Authentication**: Events respect existing JWT authentication

### **Server-Side PostHog Integration**
- **New Service**: `backend/utils/posthog-server.js`
- **Middleware**: Express middleware for PostHog lifecycle management
- **Events**: Server-side signup and insight generation tracking

## 🔧 Frontend API Integration

### **1. User Creation Endpoint**

#### **Endpoint**: `POST /api/users`
**Purpose**: Create new user account with signup event tracking

#### **Request**
```typescript
interface CreateUserRequest {
  email: string;
  nickname: string;
  confidence_meds: number;
  confidence_costs: number;
  confidence_overall: number;
  primary_need: string;
  cycle_stage?: string;
}
```

#### **Response**
```typescript
interface CreateUserResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      nickname: string;
      created_at: string;
    };
    token: string;
  };
  message?: string;
}
```

#### **Event Integration**
```typescript
// In frontend/src/lib/api.ts
const createUser = async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      
      // Fire signup event on success
      trackSignup({
        user_id: result.data.user.id,
        signup_method: 'email',
        referrer: getReferrer(),
        experiment_variants: getExperimentVariants()
      });
      
      return result;
    } else {
      throw new Error('User creation failed');
    }
  } catch (error) {
    // No event fired on error
    throw error;
  }
};
```

#### **Event Payload**
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

### **2. Check-in Submission Endpoint**

#### **Endpoint**: `POST /api/checkins`
**Purpose**: Submit daily check-in with event tracking

#### **Request**
```typescript
interface SubmitCheckinRequest {
  mood_today: string;
  confidence_today: number;
  user_note?: string;
  cycle_day?: number;
}
```

#### **Response**
```typescript
interface SubmitCheckinResponse {
  success: boolean;
  data: {
    checkin: {
      id: string;
      user_id: string;
      mood_today: string;
      confidence_today: number;
      created_at: string;
    };
    insight: {
      id: string;
      type: string;
      title: string;
      message: string;
    };
  };
  message?: string;
}
```

#### **Event Integration**
```typescript
// In frontend/src/lib/api.ts
const submitCheckin = async (checkinData: SubmitCheckinRequest): Promise<SubmitCheckinResponse> => {
  try {
    const response = await fetch('/api/checkins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(checkinData)
    });

    if (response.ok) {
      const result = await response.json();
      
      // Calculate completion time
      const timeToComplete = Date.now() - (window as any).checkinStartTime;
      
      // Fire check-in event on success
      trackCheckinSubmitted({
        user_id: getCurrentUser().id,
        mood_score: checkinData.confidence_today,
        symptom_flags: checkinData.mood_today.split(', '),
        time_to_complete_ms: timeToComplete,
        cycle_day: checkinData.cycle_day
      });
      
      return result;
    } else {
      throw new Error('Check-in submission failed');
    }
  } catch (error) {
    // No event fired on error
    throw error;
  }
};
```

#### **Event Payload**
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

## 🔧 Server-Side PostHog Integration

### **1. PostHog Server Service**

#### **File**: `backend/utils/posthog-server.js`
**Purpose**: Server-side PostHog integration for enhanced analytics

#### **Configuration**
```javascript
const { PostHog } = require('posthog-node');

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: 'https://us.i.posthog.com',
  flushAt: 1,
  flushInterval: 0,
  enable: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
});
```

#### **Server-Side Events**

##### **User Creation Event**
```javascript
// In backend/routes/users.js
const createUser = async (req, res) => {
  try {
    // Create user logic...
    const user = await createUserInDatabase(userData);
    
    // Fire server-side signup event
    posthog.captureImmediate({
      distinctId: user.id,
      event: 'signup',
      properties: {
        user_id: user.id,
        signup_method: 'email',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

##### **Insight Generation Event**
```javascript
// In backend/routes/checkins.js
const submitCheckin = async (req, res) => {
  try {
    // Check-in logic...
    const checkin = await saveCheckin(checkinData);
    const insight = await generateInsight(checkin);
    
    // Fire server-side insight generation event
    posthog.captureImmediate({
      distinctId: req.user.id,
      event: 'insight_generated',
      properties: {
        user_id: req.user.id,
        insight_id: insight.id,
        insight_type: insight.type,
        checkin_id: checkin.id,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      data: { checkin, insight }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### **2. PostHog Middleware**

#### **File**: `backend/middleware/posthog.js`
**Purpose**: Express middleware for PostHog lifecycle management

#### **Middleware Implementation**
```javascript
const posthogMiddleware = (req, res, next) => {
  // Add PostHog to request context
  req.posthog = posthog;
  
  // Handle PostHog shutdown on response end
  res.on('finish', () => {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      posthog.shutdown();
    }
  });
  
  next();
};

module.exports = posthogMiddleware;
```

#### **Server Integration**
```javascript
// In backend/server.js
const posthogMiddleware = require('./middleware/posthog');

app.use(posthogMiddleware);
```

## 🔒 Authentication & Security

### **JWT Token Validation**
- **All Events**: Respect existing JWT authentication
- **User Context**: Events include authenticated user_id
- **Token Refresh**: Events work with automatic token refresh
- **Error Handling**: No events fired on authentication failures

### **API Security**
- **HTTPS Only**: All API communications encrypted
- **CORS Configuration**: Proper CORS setup for frontend
- **Rate Limiting**: Existing rate limiting applies
- **Input Validation**: All inputs validated before processing

## 📊 Event Schema Validation

### **Frontend Events**
```typescript
// TypeScript interfaces ensure data integrity
interface SignupEvent {
  user_id: string;
  signup_method: string;
  referrer?: string;
  experiment_variants?: string[];
  environment: string;
  timestamp: string;
}

interface CheckinSubmittedEvent {
  user_id: string;
  mood_score: number;
  symptom_flags: string[];
  time_to_complete_ms?: number;
  cycle_day?: number;
  environment: string;
  timestamp: string;
}

interface InsightViewedEvent {
  user_id: string;
  insight_id: string;
  insight_type: string;
  dwell_ms?: number;
  cta_clicked?: boolean;
  environment: string;
  timestamp: string;
}

interface ShareActionEvent {
  user_id: string;
  share_surface: string;
  destination: string;
  content_id?: string;
  environment: string;
  timestamp: string;
}
```

### **Server-Side Events**
```javascript
// Server-side event validation
const validateEventPayload = (payload) => {
  const required = ['user_id', 'environment', 'timestamp'];
  const missing = required.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return payload;
};
```

## 🚨 Error Handling

### **Frontend Error Handling**
```typescript
// Graceful degradation for analytics failures
const trackEvent = (event: string, payload: any) => {
  try {
    if (isAnalyticsEnabled()) {
      posthog.capture(event, payload);
    }
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't affect user experience
  }
};
```

### **Backend Error Handling**
```javascript
// Server-side error handling
const captureServerEvent = (event, payload) => {
  try {
    if (posthog && process.env.NODE_ENV !== 'development') {
      posthog.captureImmediate(event, payload);
    }
  } catch (error) {
    console.error('Server-side analytics error:', error);
    // Don't affect API response
  }
};
```

## 🔧 Environment Configuration

### **Frontend Environment Variables**
```bash
# Required for PostHog integration
VITE_POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Environment detection
VITE_ENV=production
VITE_DEBUG=false
```

### **Backend Environment Variables**
```bash
# Server-side PostHog integration
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://us.i.posthog.com

# Environment configuration
NODE_ENV=production
```

## 📈 Performance Considerations

### **Frontend Performance**
- **Async Events**: Non-blocking event submission
- **Bundle Size**: PostHog JS adds ~30KB
- **Network Impact**: ~1KB per event
- **Timing**: <200ms event firing requirement

### **Backend Performance**
- **Immediate Flushing**: `captureImmediate()` for serverless
- **Minimal Overhead**: Events don't affect API response time
- **Resource Management**: Proper PostHog shutdown
- **Error Isolation**: Analytics failures don't affect core functionality

## 🔄 API Versioning

### **Current Version**: v1
- **Stable**: No breaking changes planned
- **Backward Compatible**: Existing API endpoints unchanged
- **Event Integration**: Non-intrusive addition to existing flows

### **Future Considerations**
- **API v2**: Potential for enhanced event tracking
- **Real-time Events**: WebSocket integration for live analytics
- **Batch Processing**: Optimized event batching for high volume

## 🧪 Testing

### **API Testing**
```bash
# Test user creation with event tracking
curl -X POST /api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","nickname":"TestUser"}'

# Test check-in submission with event tracking
curl -X POST /api/checkins \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mood_today":"hopeful","confidence_today":8}'
```

### **Event Validation**
```javascript
// Test event payload validation
const testEvent = {
  user_id: "rec1234567890",
  signup_method: "email",
  environment: "production",
  timestamp: new Date().toISOString()
};

const validated = validateEventPayload(testEvent);
console.log('Event validated:', validated);
```

## 📊 Monitoring & Alerts

### **API Monitoring**
- **Response Times**: Monitor API endpoint performance
- **Error Rates**: Track API error rates
- **Event Delivery**: Monitor PostHog event delivery success
- **Authentication**: Monitor JWT token validation

### **Alerting**
- **High Error Rates**: Alert on >5% API errors
- **Event Loss**: Alert on significant event loss
- **Performance**: Alert on >200ms event firing
- **Service Outages**: Alert on PostHog service issues

---

**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01  
**Owner**: Engineering Team 