# 🚀 Staging Environment Setup Guide

## Overview

This guide walks you through setting up staging environments for both Railway (backend) and Vercel (frontend) to create a complete staging environment for testing before production deployment.

## 📋 **Prerequisites**

- Railway CLI installed and logged in
- Vercel CLI installed and logged in
- GitHub repository with your code
- Airtable account with staging base

## 🔧 **Step 1: Railway Staging Backend Setup**

### **1.1 Create Railway Staging Project**

```bash
# Navigate to backend directory
cd backend

# Login to Railway (if not already logged in)
railway login

# Create new staging project
railway init --name "novara-staging"
```

### **1.2 Configure Environment Variables**

In the Railway dashboard (https://railway.app):

**Required Variables:**
```env
NODE_ENV=staging
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
PORT=3000
AIRTABLE_API_KEY=your_staging_airtable_api_key
AIRTABLE_BASE_ID=your_staging_airtable_base_id
JWT_SECRET=your_staging_jwt_secret_64_chars_min
```

**Optional Variables:**
```env
LOG_LEVEL=info
CORS_ORIGIN=https://novara-mvp-staging.vercel.app
```

### **1.3 Deploy Backend**

```bash
# Deploy to Railway
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### **1.4 Get Railway Domain**

After deployment, Railway will provide a domain like:
`https://novara-staging.up.railway.app`

## 🎨 **Step 2: Vercel Staging Frontend Setup**

### **2.1 Create Vercel Staging Project**

```bash
# Navigate to frontend directory
cd frontend

# Login to Vercel (if not already logged in)
vercel login

# Create staging project
vercel --name novara-mvp-staging
```

### **2.2 Configure Environment Variables**

In the Vercel dashboard (https://vercel.com):

**Required Variables:**
```env
VITE_ENV=staging
VITE_API_URL=https://novara-staging.up.railway.app
```

### **2.3 Deploy Frontend**

```bash
# Deploy to Vercel staging
vercel --prod

# Or deploy to preview
vercel
```

### **2.4 Get Vercel Domain**

After deployment, Vercel will provide a domain like:
`https://novara-mvp-staging.vercel.app`

## 🔗 **Step 3: Connect Frontend to Backend**

### **3.1 Update CORS Configuration**

In your Railway staging backend, ensure CORS allows the Vercel staging domain:

```javascript
// In backend/server.js
const allowedOrigins = [
  'http://localhost:4200',  // Development
  'https://novara-mvp.vercel.app', // Production
  'https://novara-mvp-staging.vercel.app', // Staging
];
```

### **3.2 Test Connection**

```bash
# Test backend health
curl https://novara-staging.up.railway.app/api/health

# Test frontend
curl https://novara-mvp-staging.vercel.app
```

## 🧪 **Step 4: Staging Environment Testing**

### **4.1 Run API Endpoint Tests**

```bash
# Test staging environment
./scripts/api-endpoint-test.sh staging

# Test both environments
./scripts/api-endpoint-test.sh both
```

### **4.2 Manual Testing Checklist**

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] Daily check-in flow works
- [ ] Insights generation works
- [ ] CORS configuration allows frontend-backend communication

## 🔄 **Step 5: Automated Deployment Setup**

### **5.1 Railway Auto-Deploy**

Connect your GitHub repository to Railway:
1. Go to Railway project settings
2. Connect GitHub repository
3. Enable auto-deploy on push to `staging` branch

### **5.2 Vercel Auto-Deploy**

Connect your GitHub repository to Vercel:
1. Go to Vercel project settings
2. Connect GitHub repository
3. Set up deployment for `staging` branch

### **5.3 GitHub Branch Strategy**

```bash
# Create staging branch
git checkout -b staging

# Push staging branch
git push origin staging

# Set up staging branch protection rules
# - Require pull request reviews
# - Require status checks to pass
# - Restrict pushes to staging branch
```

## 📊 **Step 6: Monitoring & Health Checks**

### **6.1 Railway Monitoring**

- **Health Checks**: `/api/health` endpoint
- **Logs**: Available in Railway dashboard
- **Metrics**: CPU, memory, network usage

### **6.2 Vercel Monitoring**

- **Analytics**: Built-in performance monitoring
- **Logs**: Function logs and build logs
- **Status**: Deployment status and uptime

### **6.3 Automated Testing**

```bash
# Add to CI/CD pipeline
./scripts/api-endpoint-test.sh staging

# Expected results:
# - All health checks pass
# - Response times under 2 seconds
# - No critical errors
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. CORS Errors**
```bash
# Check CORS configuration in backend
curl -H "Origin: https://novara-mvp-staging.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://novara-staging.up.railway.app/api/health
```

#### **2. Environment Variables**
```bash
# Check Railway variables
railway variables

# Check Vercel variables
vercel env ls
```

#### **3. Deployment Failures**
```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs
```

### **Debug Commands**

```bash
# Test staging backend
curl https://novara-staging.up.railway.app/api/health

# Test staging frontend
curl https://novara-mvp-staging.vercel.app

# Run full staging test suite
./scripts/api-endpoint-test.sh staging
```

## 🎯 **Best Practices**

### **Environment Isolation**
- ✅ Separate Airtable bases for staging and production
- ✅ Different JWT secrets for each environment
- ✅ Environment-specific API URLs
- ✅ Isolated user data

### **Security**
- ✅ Environment variables for all secrets
- ✅ CORS properly configured
- ✅ JWT secrets are 64+ characters
- ✅ No hardcoded credentials

### **Testing**
- ✅ Automated API endpoint testing
- ✅ Manual user flow testing
- ✅ Performance monitoring
- ✅ Error tracking

## 📈 **Next Steps**

1. **Set up monitoring alerts** for staging environment
2. **Configure automated testing** in CI/CD pipeline
3. **Set up staging data seeding** for testing
4. **Create staging user accounts** for testing
5. **Document staging-specific features** and configurations

## 🔗 **Useful Links**

- **Railway Dashboard**: https://railway.app
- **Vercel Dashboard**: https://vercel.com
- **Staging Backend**: https://novara-staging.up.railway.app
- **Staging Frontend**: https://novara-mvp-staging.vercel.app
- **API Testing**: `./scripts/api-endpoint-test.sh staging`

---

**Last Updated**: July 2025  
**Version**: 1.0  
**Maintainer**: Novara Development Team 