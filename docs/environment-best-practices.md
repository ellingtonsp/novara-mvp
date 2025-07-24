# 🌍 Environment Best Practices

This document outlines the best practices for environment-aware development in the Novara MVP project.

## 🎯 **Core Principles**

### 1. **Single Source of Truth**
- All environment configuration should be centralized in `frontend/src/lib/environment.ts`
- Never hardcode environment-specific values in components
- Use the environment configuration for all API calls, feature flags, and settings

### 2. **Environment Detection**
- Automatically detect environment based on hostname and environment variables
- Support explicit environment variables for override
- Provide clear fallbacks for each environment

### 3. **Consistent API URLs**
- All API calls should use the centralized `API_BASE_URL`
- Never hardcode backend URLs in components
- Support environment-specific API endpoints

## 📁 **File Structure**

```
frontend/src/
├── lib/
│   ├── environment.ts          # 🌍 Centralized environment config
│   └── api.ts                  # 🔗 API client using environment config
├── components/
│   ├── DailyCheckinForm.tsx    # ✅ Uses environment config
│   ├── DailyInsightsDisplay.tsx # ✅ Uses environment config
│   └── WelcomeInsight.tsx      # ✅ Uses environment config
└── contexts/
    └── AuthContext.tsx         # ✅ Uses environment config
```

## 🔧 **Environment Configuration**

### **Frontend Environment Setup**

```typescript
// ✅ CORRECT: Use centralized environment config
import { API_BASE_URL, environmentConfig } from '../lib/environment';

const response = await fetch(`${API_BASE_URL}/api/endpoint`);
```

```typescript
// ❌ WRONG: Hardcode environment-specific URLs
const API_BASE_URL = 'https://novara-mvp-production.up.railway.app';
```

### **Environment Variables**

#### **Development**
```bash
# .env.development
VITE_API_URL=http://localhost:9002
VITE_ENV=development
VITE_DEBUG=true
```

#### **Staging**
```bash
# .env.staging
VITE_API_URL=https://novara-staging-staging.up.railway.app
VITE_ENV=staging
VITE_DEBUG=true
```

#### **Production**
```bash
# .env.production
VITE_API_URL=https://novara-mvp-production.up.railway.app
VITE_ENV=production
VITE_DEBUG=false
```

## 🚀 **Development Workflow**

### **1. Adding New API Endpoints**

```typescript
// ✅ CORRECT: Use environment config
import { API_BASE_URL } from '../lib/environment';

export const apiClient = {
  async newEndpoint() {
    const response = await fetch(`${API_BASE_URL}/api/new-endpoint`);
    return response.json();
  }
};
```

### **2. Adding Environment-Specific Features**

```typescript
// ✅ CORRECT: Use environment flags
import { IS_DEVELOPMENT, IS_STAGING, IS_PRODUCTION } from '../lib/environment';

if (IS_DEVELOPMENT) {
  console.log('Debug info only in development');
}

if (IS_STAGING) {
  // Staging-specific logic
}
```

### **3. Adding New Components**

```typescript
// ✅ CORRECT: Import environment config
import { API_BASE_URL } from '../lib/environment';

const MyComponent = () => {
  const fetchData = async () => {
    const response = await fetch(`${API_BASE_URL}/api/data`);
    // ...
  };
};
```

## 🧪 **Testing Environments**

### **Health Check Script**

Run comprehensive environment testing:

```bash
# Test all environments
node scripts/environment-health-check.js

# Test specific environment
node scripts/environment-health-check.js staging
```

### **Manual Testing Checklist**

- [ ] **Development**: `http://localhost:4200` → `http://localhost:9002`
- [ ] **Staging**: `https://novara-mvp-git-staging-novara-fertility.vercel.app` → `https://novara-staging-staging.up.railway.app`
- [ ] **Production**: `https://novara-mvp.vercel.app` → `https://novara-mvp-production.up.railway.app`

### **Environment Verification**

1. **Check Environment Detection**
   ```javascript
   // In browser console
   console.log('Environment:', window.location.hostname);
   ```

2. **Verify API URLs**
   ```javascript
   // Should show correct backend URL for current environment
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```

3. **Test CORS**
   ```bash
   curl -H "Origin: https://novara-mvp-git-staging-novara-fertility.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS https://novara-staging-staging.up.railway.app/api/health
   ```

## 🔒 **Security Considerations**

### **Environment Variables**
- Never commit sensitive data to version control
- Use environment-specific `.env` files
- Validate environment variables at startup

### **CORS Configuration**
- Configure CORS for each environment
- Test CORS with actual frontend URLs
- Use specific origins, not wildcards in production

### **API Security**
- Use environment-specific JWT secrets
- Validate environment in backend responses
- Log environment information for debugging

## 🐛 **Common Issues & Solutions**

### **Issue: Wrong Backend URL**
**Symptoms**: API calls failing, CORS errors
**Solution**: Check `frontend/src/lib/environment.ts` configuration

### **Issue: Environment Not Detected**
**Symptoms**: Using production URLs in staging
**Solution**: Verify hostname detection logic in environment config

### **Issue: CORS Errors**
**Symptoms**: Browser blocking requests
**Solution**: Update CORS configuration in backend for new frontend URLs

### **Issue: Hardcoded URLs**
**Symptoms**: Components not adapting to environment
**Solution**: Replace hardcoded URLs with environment config imports

## 📋 **Code Review Checklist**

When reviewing code, ensure:

- [ ] No hardcoded environment-specific URLs
- [ ] All API calls use `API_BASE_URL` from environment config
- [ ] Environment variables are properly documented
- [ ] CORS configuration includes all frontend URLs
- [ ] Environment detection works correctly
- [ ] Health check script passes for affected environments

## 🚨 **Breaking Changes**

When making changes that affect environments:

1. **Update environment configuration** in `frontend/src/lib/environment.ts`
2. **Update health check script** in `scripts/environment-health-check.js`
3. **Test all environments** using the health check script
4. **Update documentation** in this file
5. **Notify team** of environment changes

## 📚 **Additional Resources**

- [Environment Configuration](./environment.ts)
- [Health Check Script](../scripts/environment-health-check.js)
- [API Client](./api.ts)
- [Railway Environment Setup](./railway-staging-setup.md)
- [Vercel Environment Setup](./vercel-staging-setup.md)

---

**Remember**: Always use the centralized environment configuration. It's the single source of truth for all environment-specific settings! 🌍 