# 🧪 API Endpoint Testing Guide

## Overview

This guide covers **DevOps best practices** for ensuring all API endpoints are functioning correctly in staging and production environments. Our testing strategy follows industry standards for comprehensive endpoint validation without compromising production data integrity.

## 🎯 **Testing Philosophy**

### **Production-Safe Testing**
- ✅ **Read-only operations** for production environments
- ✅ **No test data creation** in production
- ✅ **Existing user authentication** only
- ✅ **Performance monitoring** without data pollution
- ✅ **Health checks** and connectivity validation

### **Comprehensive Coverage**
- ✅ **All API endpoints** tested systematically
- ✅ **Authentication flows** validated
- ✅ **CORS configuration** verified
- ✅ **Response times** monitored
- ✅ **Error handling** tested
- ✅ **Frontend-backend connectivity** validated

## 🚀 **Quick Start**

### **Install Dependencies**
```bash
# macOS
brew install jq bc

# Ubuntu/Debian
sudo apt-get install jq bc

# Verify installation
jq --version
bc --version
```

### **Run Tests**
```bash
# Test staging environment
./scripts/api-endpoint-test.sh staging

# Test production environment
./scripts/api-endpoint-test.sh production

# Test both environments
./scripts/api-endpoint-test.sh both
```

## 📋 **Test Categories**

### **1. Environment Health Checks**
- **Backend Health**: `/api/health` endpoint validation
- **Service Status**: Service name, environment, version
- **Database Connection**: Airtable connectivity status
- **JWT Configuration**: Authentication setup validation
- **API Endpoints Overview**: `/api/checkins-test` accessibility

### **2. Authentication Endpoints**
- **User Login**: Existing user authentication (safe)
- **Protected Endpoints**: JWT token validation
- **Unauthorized Access**: Proper 401 responses
- **Token Management**: JWT token generation and validation

### **3. Check-in Endpoints**
- **Personalized Questions**: `/api/checkins/questions` (GET)
- **Last Check-in Values**: `/api/checkins/last-values` (GET)
- **Protected Access**: Authentication required
- **Data Retrieval**: Safe read-only operations

### **4. Insights Endpoints**
- **Daily Insights**: `/api/insights/daily` (GET)
- **Engagement Tracking**: `/api/insights/engagement` (POST)
- **Insight Generation**: Personalized content delivery
- **Analytics Integration**: Safe engagement tracking

### **5. Frontend Connectivity**
- **Frontend Accessibility**: Vercel deployment status
- **Content Loading**: Novara application content verification
- **Response Validation**: Expected HTML content

### **6. CORS Configuration**
- **Preflight Requests**: OPTIONS method handling
- **Cross-Origin Access**: Frontend-backend communication
- **Header Validation**: Proper CORS headers

### **7. Performance Monitoring**
- **Response Times**: Sub-2-second threshold validation
- **Endpoint Performance**: Individual endpoint timing
- **Performance Alerts**: Slow response detection

## 🔧 **Environment-Specific Testing**

### **Staging Environment**
```bash
# Test staging only
./scripts/api-endpoint-test.sh staging

# Expected URLs:
# Backend: https://novara-staging.up.railway.app
# Frontend: https://novara-mvp-staging.vercel.app
```

**Staging Testing Strategy:**
- ✅ **Full integration testing**
- ✅ **Real API testing** (non-production data)
- ✅ **Performance testing**
- ✅ **User acceptance testing**
- ✅ **Safe data creation** (staging database)

### **Production Environment**
```bash
# Test production only
./scripts/api-endpoint-test.sh production

# Expected URLs:
# Backend: https://novara-mvp-production.up.railway.app
# Frontend: https://novara-mvp.vercel.app
```

**Production Testing Strategy:**
- ✅ **Health checks only**
- ✅ **Read-only operations**
- ✅ **No data creation**
- ✅ **Performance monitoring**
- ✅ **Real user traffic preservation**

## 📊 **Test Results Interpretation**

### **Success Indicators**
```
✅ Health Check
   Service: Novara API | Environment: production | Response Time: 0.45s

✅ Airtable Connection
   Status: connected

✅ User Login
   Successfully authenticated test user

✅ Get Personalized Questions
   Retrieved 4 personalized questions
```

### **Failure Indicators**
```
❌ Health Check
   HTTP 500
   Details: Backend not responding

❌ Airtable Connection
   Status: not configured
   Details: Missing API key or base ID

❌ User Login
   Login failed
   Details: User may not exist in production
```

### **Performance Alerts**
```
❌ Response Time - /api/health
   Response time: 3.2s (over 2s threshold)
   Details: Consider performance optimization
```

## 🔄 **Integration with CI/CD**

### **Pre-Deployment Testing**
```bash
# Add to deployment scripts
echo "Testing staging before production deployment..."
./scripts/api-endpoint-test.sh staging

if [ $? -eq 0 ]; then
    echo "Staging tests passed, proceeding to production deployment"
    ./scripts/deploy-production.sh
else
    echo "Staging tests failed, aborting production deployment"
    exit 1
fi
```

### **Post-Deployment Validation**
```bash
# Add to production deployment script
echo "Validating production deployment..."
./scripts/api-endpoint-test.sh production

if [ $? -eq 0 ]; then
    echo "Production validation successful"
else
    echo "Production validation failed - consider rollback"
    exit 1
fi
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Authentication Failures**
```bash
# Problem: Test user doesn't exist in environment
# Solution: Use existing test user or create one in staging
TEST_EMAIL="monkey@gmail.com"  # Update in script
```

#### **2. CORS Errors**
```bash
# Problem: Frontend can't connect to backend
# Solution: Check CORS configuration in backend
# Verify allowed origins include frontend URL
```

#### **3. Slow Response Times**
```bash
# Problem: Endpoints taking >2 seconds
# Solution: 
# - Check database connection
# - Monitor Railway/Vercel performance
# - Review query optimization
```

#### **4. Missing Dependencies**
```bash
# Problem: jq or bc not installed
# Solution: Install required tools
brew install jq bc  # macOS
sudo apt-get install jq bc  # Ubuntu
```

### **Debug Mode**
```bash
# Enable verbose output for debugging
export DEBUG=true
./scripts/api-endpoint-test.sh staging
```

## 📈 **Monitoring & Alerting**

### **Automated Testing Schedule**
```bash
# Cron job for regular testing (every 6 hours)
0 */6 * * * cd /path/to/novara-mvp && ./scripts/api-endpoint-test.sh production >> /var/log/novara-api-tests.log 2>&1
```

### **Alert Integration**
```bash
# Send alerts on test failures
if [ $FAILED_TESTS -gt 0 ]; then
    curl -X POST $SLACK_WEBHOOK \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"⚠️ API tests failed: $FAILED_TESTS/$TOTAL_TESTS\"}"
fi
```

## 🎯 **Best Practices Summary**

### **✅ Do's**
- **Test staging before production**
- **Use read-only operations in production**
- **Monitor response times consistently**
- **Validate CORS configuration**
- **Test authentication flows**
- **Check frontend-backend connectivity**
- **Automate testing in CI/CD pipeline**

### **❌ Don'ts**
- **Create test data in production**
- **Skip staging testing**
- **Ignore performance warnings**
- **Test without authentication**
- **Forget CORS validation**
- **Skip post-deployment validation**

## 🔗 **Related Documentation**

- [Environment Configuration](./environment-configuration.md)
- [Deployment Guide](./railway-deployment.md)
- [Local Development Guide](./local-development-guide.md)
- [Troubleshooting Guide](./troubleshooting/local-development-issues.md)

## 📞 **Support**

For issues with API endpoint testing:
1. Check this guide for troubleshooting steps
2. Review test output for specific error messages
3. Verify environment variables and configuration
4. Check Railway/Vercel deployment status
5. Contact the development team with detailed error logs

---

**Last Updated**: July 2025  
**Version**: 1.0  
**Maintainer**: Novara Development Team 