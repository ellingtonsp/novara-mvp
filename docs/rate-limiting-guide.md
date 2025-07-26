# 🚦 Rate Limiting Guide

## **Overview**

Novara MVP now uses **environment-aware rate limiting** that automatically adjusts based on the deployment environment. This ensures appropriate security while allowing rapid development and testing.

---

## **Environment-Specific Limits**

### **Development Environment**
```javascript
// Local development - nearly unlimited
max: 10000, // 10,000 requests per 15 minutes
```
- **Purpose**: Unrestricted development and testing
- **Skip Rules**: Health checks, curl, Postman
- **Use Case**: Local development, debugging, rapid iteration

### **Staging Environment**
```javascript
// Staging - high limit for testing
max: 2000, // 2,000 requests per 15 minutes
```
- **Purpose**: Rapid testing and validation
- **Skip Rules**: Health checks, curl
- **Use Case**: Integration testing, user acceptance testing

### **Production Environment**
```javascript
// Production - moderate security
max: 500, // 500 requests per 15 minutes
```
- **Purpose**: Protect against abuse while allowing normal usage
- **Skip Rules**: Health checks only
- **Use Case**: Live application with real users

---

## **Authentication Rate Limiting**

### **Development**
```javascript
max: 1000, // 1,000 auth attempts per 15 minutes
```
- Allows extensive authentication testing
- Skips curl and Postman requests

### **Staging**
```javascript
max: 100, // 100 auth attempts per 15 minutes
```
- Allows moderate authentication testing
- Skips curl requests

### **Production**
```javascript
max: 10, // 10 auth attempts per 15 minutes
```
- Conservative limit for security
- No skips for security reasons

---

## **Configuration Details**

### **Main Rate Limiter**
```javascript
const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10000, // Nearly unlimited
        skip: (req) => {
          return req.path === '/api/health' || 
                 req.get('User-Agent')?.includes('curl') ||
                 req.get('User-Agent')?.includes('Postman');
        }
      };
    // ... other environments
  }
};
```

### **Auth Rate Limiter**
```javascript
const getAuthRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return {
        windowMs: 15 * 60 * 1000,
        max: 1000, // High limit for testing
        skip: (req) => {
          return req.get('User-Agent')?.includes('curl') ||
                 req.get('User-Agent')?.includes('Postman');
        }
      };
    // ... other environments
  }
};
```

---

## **Testing Rate Limits**

### **Check Current Limits**
```bash
# Development (local)
curl -s http://localhost:3002/api/health | jq '.environment'

# Staging
curl -s https://novara-staging-staging.up.railway.app/api/health | jq '.environment'

# Production
curl -s https://novara-mvp-production.up.railway.app/api/health | jq '.environment'
```

### **Test Rate Limiting**
```bash
# Test multiple requests (should work in all environments)
for i in {1..20}; do
  echo "Request $i:"
  curl -s https://novara-staging-staging.up.railway.app/api/health | jq -r '.environment'
done
```

### **Test Auth Rate Limiting**
```bash
# Test auth endpoints (will hit limits in production)
for i in {1..15}; do
  echo "Auth Request $i:"
  curl -s -X POST https://novara-staging-staging.up.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' | jq -r '.error // "success"'
done
```

---

## **Troubleshooting**

### **Rate Limit Errors**
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

### **Common Issues**

#### **Development Too Restrictive**
- ✅ **FIXED**: Development now allows 10,000 requests per 15 minutes
- Development tools (curl, Postman) are whitelisted
- Health checks bypass rate limiting

#### **Staging Too Restrictive**
- ✅ **FIXED**: Staging now allows 2,000 requests per 15 minutes
- Testing tools (curl) are whitelisted
- Health checks bypass rate limiting

#### **Production Too Restrictive**
- Production allows 500 requests per 15 minutes
- This is appropriate for normal user traffic
- Health checks bypass rate limiting

### **Bypass Rules**
```javascript
// Health checks always bypass rate limiting
req.path === '/api/health'

// Development tools bypass in development/staging
req.get('User-Agent')?.includes('curl')
req.get('User-Agent')?.includes('Postman')

// Railway health checks bypass
req.get('User-Agent')?.includes('RailwayHealthCheck')
```

---

## **Monitoring**

### **Rate Limit Logs**
```javascript
// Rate limiting configuration is logged on startup
logger.info(`Rate limiting configured for ${env} environment: ${config.max} requests per 15 minutes`);
```

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1995
X-RateLimit-Reset: 1732560000
Retry-After: 900
```

---

## **Best Practices**

### **For Development**
- Use the high limits for rapid iteration
- Test with curl and Postman (whitelisted)
- Monitor logs for rate limit configuration

### **For Staging**
- Use staging for integration testing
- Test with realistic user scenarios
- Verify rate limits don't block testing

### **For Production**
- Monitor rate limit usage
- Adjust limits if needed for user patterns
- Keep security-focused limits

---

**Last Updated**: July 26, 2025
**Status**: ✅ Environment-aware rate limiting implemented 