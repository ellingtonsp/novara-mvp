# Novara MVP - Environment Staging & Testing Guide

## 🏗️ **Proper Environment Architecture**

### **Environment Tiers:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Development │ →  │   Staging   │ →  │ Production  │
│   (Local)   │    │  (Testing)  │    │   (Live)    │
│             │    │             │    │             │
│ • Test data │    │ • Real APIs │    │ • Real users│
│ • Fast iter │    │ • Full test │    │ • Monitored │
│ • Debug on  │    │ • Pre-deploy│    │ • Stable    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Current Issues with Our Testing:**
❌ Testing directly in production  
❌ Creating test data in live database  
❌ Risk of exhausting API rate limits  
❌ No staging environment for integration testing  

## 🎯 **Recommended Setup**

### **1. Staging Environment (Immediate Need)**

#### **Frontend Staging (Vercel)**
- **Create staging deployment:** `staging.novara-mvp.vercel.app`
- **Environment variables:**
  ```env
  VITE_GA_MEASUREMENT_ID=G-STAGING-TEST-ID  # Separate GA4 property
  VITE_API_URL=https://novara-staging.up.railway.app
  VITE_NODE_ENV=staging
  ```

#### **Backend Staging (Railway)**
- **Create staging service:** `novara-staging.up.railway.app`
- **Environment variables:**
  ```env
  AIRTABLE_API_KEY=same_as_prod  # Can share key
  AIRTABLE_BASE_ID=staging_base_id  # Separate Airtable base
  JWT_SECRET=staging_secret
  NODE_ENV=staging
  ```

#### **Database Staging (Airtable)**
- **Create duplicate Airtable base** for staging
- **Same schema as production** but separate data
- **Safe for testing without affecting production**

### **2. Testing Strategy by Environment**

#### **Development (Local)**
```bash
# Local testing with mock data
npm run dev
npm run test:unit
npm run test:integration:local
```

**Purpose:**
- Fast development iteration
- Unit and integration tests
- Mock data and services
- Debug-friendly environment

#### **Staging (Pre-Production)**
```bash
# Staging tests with real APIs
npm run test:staging
npm run test:e2e:staging
npm run test:performance:staging
```

**Purpose:**
- Full integration testing
- Real API testing (non-production data)
- Performance testing
- User acceptance testing

#### **Production (Live)**
```bash
# Only monitoring and health checks
npm run test:health:production
npm run monitor:production
```

**Purpose:**
- Health checks only
- Monitoring and alerting
- No data creation
- Real user traffic only

### **3. Safe Production Monitoring**

Instead of creating test data, use these approaches:

#### **Health Checks (Safe)**
```javascript
// Safe production health check
async function healthCheck() {
  // ✅ Check service availability
  const response = await fetch('/api/health');
  
  // ✅ Check database connectivity (read-only)
  const dbStatus = response.airtable === 'connected';
  
  // ✅ Check authentication (no data creation)
  const authStatus = response.jwt === 'configured';
  
  return { service: response.ok, database: dbStatus, auth: authStatus };
}
```

#### **Synthetic Monitoring (Recommended)**
```javascript
// Production monitoring without data pollution
async function syntheticTest() {
  // ✅ Test API endpoints with GET requests only
  // ✅ Check response times and availability
  // ✅ Monitor error rates
  // ❌ Don't create any test data
}
```

#### **Real User Monitoring (Best)**
```javascript
// Track real user interactions
// ✅ Analytics on actual user behavior
// ✅ Error tracking on real usage
// ✅ Performance monitoring
// ❌ No synthetic test data
```

## 🔧 **Implementation Plan**

### **Phase 1: Immediate (Today)**
1. **Stop production testing** - Don't run scripts that create data
2. **Create staging Airtable base** - Duplicate production schema
3. **Set up basic health monitoring** - Read-only checks only

### **Phase 2: Short Term (This Week)**
1. **Deploy staging environment** - Separate Railway/Vercel deployments
2. **Configure staging variables** - Point to staging database
3. **Create staging test suite** - Full integration tests

### **Phase 3: Long Term (Next Week)**
1. **Set up CI/CD pipeline** - Automated testing in staging
2. **Implement monitoring** - Real user monitoring in production
3. **Create deployment checklist** - Staging approval before production

## 📋 **Safe Testing Checklist**

### **✅ Safe Production Practices:**
- Health checks (GET requests only)
- Monitoring real user behavior
- Performance tracking
- Error rate monitoring
- Uptime checks

### **❌ Avoid in Production:**
- Creating test users
- Submitting test check-ins
- Generating test insights
- Load testing with synthetic data
- API stress testing

## 🚨 **Current Production Test Issues**

Our current `fix-and-test-production.js` script is problematic because it:
1. Creates test users in production Airtable
2. Submits test check-ins
3. Triggers API rate limits
4. Pollutes production data

## 🎯 **Immediate Action Items**

1. **Stop running test scripts in production**
2. **Create staging environment setup**
3. **Use health checks only for production monitoring**
4. **Test integrations in staging first**

Would you like me to help set up a proper staging environment? 