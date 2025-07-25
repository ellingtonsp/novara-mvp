# Environment Detection Troubleshooting Guide

> **Last Updated**: 2025-07-25  
> **Status**: ✅ RESOLVED - Environment detection now working correctly  
> **Related Issues**: L-005: PostHog Environment Detection Bug

## 🎯 Overview

Environment detection issues can cause incorrect API endpoints, wrong analytics configuration, and improper feature flags. This guide covers the most common problems and their solutions.

## 🚨 Critical Rules

### **NEVER Use Direct Environment Variables**
```typescript
// ❌ WRONG - Don't do this
const environment = import.meta.env.VITE_VERCEL_ENV;
const apiUrl = import.meta.env.VITE_API_URL;

// ✅ CORRECT - Always use environmentConfig
import { environmentConfig } from './lib/environment';
const environment = environmentConfig.environment;
const apiUrl = environmentConfig.apiUrl;
```

### **Always Use environmentConfig**
The `frontend/src/lib/environment.ts` file provides:
- Proper environment detection logic
- Newline character handling
- Fallback mechanisms
- Debug logging

## 🔍 Common Issues & Solutions

### Issue 1: Wrong Environment Detected

**Symptoms:**
- Production shows "staging" environment
- Staging shows "production" environment
- Console logs show incorrect environment

**Root Causes:**
1. **Newline characters** in environment variables
2. **Direct env var usage** instead of environmentConfig
3. **Vercel environment detection** conflicts

**Solutions:**

#### 1. Fix Newline Characters
```bash
# Check for newlines in .env files
grep -n "VITE_ENV" frontend/.env.production
grep -n "VITE_ENV" frontend/.env.staging

# Remove trailing newlines
sed -i '' 's/VITE_ENV=production$/VITE_ENV=production/' frontend/.env.production
sed -i '' 's/VITE_ENV=staging$/VITE_ENV=staging/' frontend/.env.staging
```

#### 2. Update Component Code
```typescript
// Before (❌ Wrong)
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    console.log('Environment:', import.meta.env.VITE_VERCEL_ENV);
  }, []);
}

// After (✅ Correct)
import { useEffect } from 'react';
import { environmentConfig } from './lib/environment';

function MyComponent() {
  useEffect(() => {
    console.log('Environment:', environmentConfig.environment);
  }, []);
}
```

### Issue 2: PostHog Analytics Not Working

**Symptoms:**
- No analytics events being captured
- PostHog initialization errors
- Environment detection logs missing

**Root Cause:** Environment detection affects PostHog configuration

**Solution:**
```typescript
// Use environmentConfig for PostHog initialization
import { environmentConfig } from './lib/analytics';

const posthogConfig = {
  apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
  host: import.meta.env.VITE_POSTHOG_HOST,
  environment: environmentConfig.environment, // ✅ Use environmentConfig
  debug: environmentConfig.environment === 'development'
};
```

### Issue 3: API Endpoints Wrong

**Symptoms:**
- Frontend calling staging API in production
- 404 errors on API calls
- Wrong backend URLs

**Root Cause:** Environment detection affects API URL selection

**Solution:**
```typescript
// Always use environmentConfig.apiUrl
import { environmentConfig } from './lib/environment';

const apiCall = async () => {
  const response = await fetch(`${environmentConfig.apiUrl}/api/endpoint`);
  // ...
};
```

## 🔧 Debugging Steps

### 1. Check Environment Detection Logs
```javascript
// Look for these logs in browser console:
🔍 ENVIRONMENT DETECTION DEBUG: {VITE_ENV: 'production', MODE: 'production', ...}
🔧 Using explicit VITE_ENV: production
🌍 Environment Configuration: {environment: 'production', apiUrl: '...', ...}
```

### 2. Verify Environment Variables
```bash
# Check .env files for newlines
cat -A frontend/.env.production | grep VITE_ENV
cat -A frontend/.env.staging | grep VITE_ENV

# Should show: VITE_ENV=production$ (no trailing characters)
# If you see: VITE_ENV=production$ (with $), there's a newline
```

### 3. Test Environment Detection
```typescript
// Add this to any component for debugging
import { environmentConfig } from './lib/environment';

console.log('🔍 Environment Debug:', {
  environment: environmentConfig.environment,
  apiUrl: environmentConfig.apiUrl,
  mode: environmentConfig.mode,
  hostname: environmentConfig.hostname
});
```

## 🛠️ Fix Implementation

### Step 1: Update All Components
Search for direct environment variable usage:
```bash
grep -r "import.meta.env.VITE_VERCEL_ENV" frontend/src/
grep -r "import.meta.env.VITE_API_URL" frontend/src/
```

### Step 2: Replace with environmentConfig
```typescript
// Replace all instances with:
import { environmentConfig } from './lib/environment';

// Instead of: import.meta.env.VITE_VERCEL_ENV
// Use: environmentConfig.environment

// Instead of: import.meta.env.VITE_API_URL
// Use: environmentConfig.apiUrl
```

### Step 3: Verify Fix
```bash
# Deploy and test
cd frontend && vercel --prod

# Check browser console for correct environment detection
# Should show: 🚀 AN-01 DEBUG: Current environment: production
```

## 📊 Monitoring & Prevention

### Pre-Deployment Checklist
- [ ] All components use `environmentConfig`
- [ ] No direct `import.meta.env` usage for environment detection
- [ ] Environment variables have no trailing newlines
- [ ] PostHog initialization uses correct environment
- [ ] API calls use `environmentConfig.apiUrl`

### Automated Checks
```bash
# Add to CI/CD pipeline
npm run validate:environments
npm run test:environment-detection
```

### Health Check Integration
```typescript
// Add environment detection to health checks
const healthCheck = async () => {
  const envCheck = environmentConfig.environment === 'production';
  const apiCheck = await testApiEndpoint(environmentConfig.apiUrl);
  
  return {
    environment: envCheck,
    api: apiCheck,
    overall: envCheck && apiCheck
  };
};
```

## 🎯 Success Criteria

Environment detection is working correctly when:

1. **✅ Production shows**: `🚀 AN-01 DEBUG: Current environment: production`
2. **✅ Staging shows**: `🚀 AN-01 DEBUG: Current environment: staging`
3. **✅ Development shows**: `🚀 AN-01 DEBUG: Current environment: development`
4. **✅ PostHog working**: Analytics events being captured
5. **✅ API calls working**: Correct backend URLs being used
6. **✅ No newlines**: Environment variables clean

## 📚 Related Documentation

- **📖 Vercel Environment Detection**: `docs/vercel-preview-detection-implementation.md`
- **📖 Environment Best Practices**: `docs/environment-best-practices.md`
- **📖 Deployment Safety**: `docs/deployment-safety-checklist.md`
- **📖 Bug Tracking**: `docs/bugs/README.md` (L-005)

## 🔄 Recent Fixes

### 2025-07-25: Environment Detection Bug Resolution
- **Issue**: Production showing "staging" environment
- **Root Cause**: Newline character in `VITE_ENV` variable
- **Solution**: Updated `App.tsx` to use `environmentConfig` instead of direct env vars
- **Status**: ✅ RESOLVED
- **Impact**: PostHog analytics now working correctly in production 