# Frontend Environment Testing Guide

## 🎯 **Overview**

This guide covers comprehensive frontend testing across all environments (development, staging, production) for Novara MVP. The testing system follows established DevOps patterns and provides both automated and manual testing capabilities.

## 🚀 **Quick Start**

### **Test All Environments**
```bash
# Test all environments
npm run test:frontend:environments

# Or use the script directly
./scripts/testing/test-frontend-environments.sh
```

### **Test Specific Environment**
```bash
# Development environment
npm run test:frontend:development

# Staging environment
npm run test:frontend:staging

# Production environment
npm run test:frontend:production
```

### **Bash Script Alternative**
```bash
# Test all environments
./scripts/testing/test-frontend-environments.sh

# Test specific environment
./scripts/testing/test-frontend-environments.sh development
./scripts/testing/test-frontend-environments.sh staging
./scripts/testing/test-frontend-environments.sh production
```

## 📋 **Test Coverage**

### **Environment-Specific Tests**

| Test Category | Development | Staging | Production | Description |
|---------------|-------------|---------|------------|-------------|
| **API Connectivity** | ✅ | ✅ | ✅ | Backend health check |
| **Frontend Accessibility** | ✅ | ✅ | ✅ | Vercel deployment status |
| **Frontend Content** | ✅ | ✅ | ✅ | React app content validation |
| **User Authentication** | ✅ | ✅ | ✅ | Login flow testing |
| **Protected Endpoints** | ✅ | ✅ | ✅ | JWT token validation |
| **Frontend Build** | ✅ | ✅ | ❌ | Build and test execution |

### **Test Details**

#### **1. API Connectivity Test**
- **Endpoint**: `/api/health`
- **Method**: GET
- **Validation**: HTTP 200, JSON response with status
- **Timeout**: 5s (dev), 10s (staging), 15s (production)

#### **2. Frontend Accessibility Test**
- **Method**: GET
- **Validation**: HTTP 200 response
- **Content Check**: Basic HTML structure
- **Timeout**: Environment-specific

#### **3. Frontend Content Test**
- **Validation**: React app content detection
- **Required Content**: "You don't have to navigate"
- **HTML Structure**: `<!DOCTYPE html>` present
- **Error Handling**: Detailed failure reporting

#### **4. User Authentication Test**
- **Endpoint**: `/api/auth/login`
- **Method**: POST
- **Test User**: `test@novara.test`
- **Validation**: JWT token in response
- **Error Handling**: HTTP status and response validation

#### **5. Protected Endpoints Test**
- **Endpoint**: `/api/users/me`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`
- **Validation**: User data in response
- **Dependencies**: Successful authentication

#### **6. Frontend Build Test**
- **Scope**: Development and staging only
- **Actions**: Run tests + build process
- **Environment**: Environment-specific variables
- **Validation**: Test pass + build success

## 🔧 **Configuration**

### **Environment Configurations**

#### **Development Environment**
```typescript
{
  name: 'Development',
  apiUrl: 'http://localhost:9002',
  frontendUrl: 'http://localhost:4200',
  environment: 'development',
  debug: true,
  timeout: 5000,
}
```

#### **Staging Environment**
```typescript
{
  name: 'Staging',
  apiUrl: 'https://novara-staging-staging.up.railway.app',
  frontendUrl: 'https://novara-bd6xsx1ru-novara-fertility.vercel.app',
  environment: 'staging',
  debug: true,
  timeout: 10000,
}
```

#### **Production Environment**
```typescript
{
  name: 'Production',
  apiUrl: 'https://novara-mvp-production.up.railway.app',
  frontendUrl: 'https://novara-mvp.vercel.app',
  environment: 'production',
  debug: false,
  timeout: 15000,
}
```

### **Environment Variables**

#### **Frontend Environment Variables**
```bash
# Development
VITE_API_URL=http://localhost:9002
VITE_ENV=development
VITE_DEBUG=true

# Staging
VITE_API_URL=https://novara-staging-staging.up.railway.app
VITE_ENV=staging
VITE_DEBUG=true

# Production
VITE_API_URL=https://novara-mvp-production.up.railway.app
VITE_ENV=production
VITE_DEBUG=false
```

## 🧪 **Test Files Structure**

```
frontend/src/test/
├── setup.ts                           # Test setup and mocks
├── environment-configs.ts             # Environment configurations
├── environment-tests.test.ts          # Environment-specific tests
└── NovaraLanding.test.tsx            # Component tests

scripts/testing/
├── test-frontend-environments.sh      # Bash test script
└── test-frontend-environments.js      # Node.js test runner
```

## 📊 **Test Results**

### **Output Format**
```
🧪 Novara MVP - Frontend Environment Testing
============================================
Target environment: all

🔧 Testing Development Environment
==================================================
📋 Testing Development API connectivity...
✅ Development API Connectivity
📋 Testing Development frontend accessibility...
✅ Development Frontend Accessibility
📋 Testing Development frontend content...
✅ Development Frontend Content
📋 Testing Development user authentication...
✅ Development User Authentication
📋 Testing Development protected endpoints...
✅ Development Protected Endpoints
📋 Testing Development frontend build...
✅ Development Frontend Build

🧪 Testing Staging Environment
==================================================
📋 Testing Staging API connectivity...
✅ Staging API Connectivity
...

📊 Frontend Environment Test Results
==================================
Duration: 45.23 seconds
Total Tests: 18
Passed: 18
Failed: 0

🎉 All frontend environment tests passed!
```

### **Results File**
Test results are saved to `logs/frontend-test-results.json`:
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "duration": "45.23s",
  "summary": {
    "total": 18,
    "passed": 18,
    "failed": 0
  },
  "details": [
    {
      "name": "Development API Connectivity",
      "success": true,
      "details": "Status: ok",
      "timestamp": "2025-01-27T10:29:15.000Z"
    }
  ]
}
```

## 🔄 **Integration with CI/CD**

### **GitHub Actions Integration**
```yaml
# .github/workflows/ci.yml
- name: Test frontend environments
  run: npm run test:frontend:environments
  env:
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
    VITE_ENV: ${{ secrets.VITE_ENV }}
```

### **Pre-Deployment Testing**
```bash
# Before staging deployment
npm run test:frontend:staging

# Before production deployment
npm run test:frontend:production
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Development Environment Issues**
```bash
# Problem: Development servers not running
# Solution: Start development environment
./scripts/start-local.sh

# Problem: Port conflicts
# Solution: Kill existing processes
./scripts/kill-local-servers.sh
```

#### **Staging Environment Issues**
```bash
# Problem: Staging backend not accessible
# Solution: Check Railway deployment status
railway status

# Problem: Staging frontend not accessible
# Solution: Check Vercel deployment status
vercel ls
```

#### **Production Environment Issues**
```bash
# Problem: Production API failures
# Solution: Check Railway production service
railway environment production
railway service novara-main

# Problem: Production frontend failures
# Solution: Check Vercel production deployment
vercel --prod
```

### **Debug Mode**
```bash
# Enable debug output
DEBUG=true npm run test:frontend:environments

# Verbose logging
VERBOSE=true node scripts/testing/test-frontend-environments.js
```

## 📈 **Performance Monitoring**

### **Test Performance Metrics**
- **Development**: ~5-10 seconds
- **Staging**: ~10-20 seconds
- **Production**: ~15-30 seconds
- **All Environments**: ~30-60 seconds

### **Timeout Configuration**
```typescript
// Environment-specific timeouts
development: 5000ms   // Fast local testing
staging: 10000ms      // Network latency allowance
production: 15000ms   // Conservative production testing
```

## 🎯 **Best Practices**

### **Testing Strategy**
1. **Run development tests frequently** during development
2. **Test staging before merging** to main branch
3. **Test production after deployment** for validation
4. **Monitor test performance** and adjust timeouts as needed

### **Environment Management**
1. **Keep environment URLs updated** in configurations
2. **Use environment variables** for sensitive data
3. **Test all environments** before major releases
4. **Document environment-specific issues** and solutions

### **Test Maintenance**
1. **Update test content checks** when UI changes
2. **Review timeout values** based on network performance
3. **Add new test categories** as features are added
4. **Monitor test reliability** and fix flaky tests

## 🔗 **Related Documentation**

- [API Endpoint Testing Guide](docs/api-endpoint-testing-guide.md)
- [Local Development Guide](docs/local-development-guide.md)
- [Staging Environment Setup](docs/staging-environment-setup.md)
- [Production Deployment Guide](docs/production-deployment-guide.md)
- [CI/CD Cleanup Strategy](docs/cicd-cleanup-strategy.md)

---

*This testing system ensures frontend functionality across all environments while following established DevOps patterns.* 