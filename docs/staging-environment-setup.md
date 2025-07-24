# Staging Environment Setup Guide

## 🚀 Complete Staging Environment Configuration

### **Overview**
This guide sets up a complete staging environment with:
- **Railway Backend**: Staging API server (environment within same project)
- **Vercel Frontend**: Staging web application
- **Airtable**: Staging database
- **Environment Variables**: Proper configuration for staging

---

## **🔧 Railway Staging Backend Setup**

### **Step 1: Create Railway Staging Environment**

```bash
# From project root directory
# Create staging environment within existing project
railway environment new staging

# Or use the setup script
./scripts/setup-railway-staging.sh
```

### **Step 2: Configure Environment Variables**

Go to Railway Dashboard → novara-mvp Project → Switch to "staging" environment → Variables tab

**Required Variables:**
```bash
NODE_ENV=staging
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
AIRTABLE_API_KEY=your_staging_airtable_api_key
AIRTABLE_BASE_ID=your_staging_airtable_base_id
JWT_SECRET=your_staging_jwt_secret_64_chars_min
CORS_ORIGIN=https://novara-mvp-staging.vercel.app
```

**Optional Variables:**
```bash
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

### **Step 3: Deploy Staging Backend**

```bash
# Switch to staging environment and deploy
railway environment staging
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### **Step 4: Test Staging Backend**

```bash
# Get your staging domain from Railway dashboard
# Example: https://novara-staging-production.up.railway.app

# Test health endpoint
curl https://your-staging-domain.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-07-24T...",
  "service": "Novara API",
  "environment": "staging",
  "airtable": "connected",
  "jwt": "configured",
  "version": "1.0.1"
}
```

---

## **🎨 Vercel Staging Frontend Setup**

### **Step 1: Create Vercel Staging Project**

```bash
# Navigate to frontend directory
cd frontend

# Deploy to Vercel staging
vercel --name novara-mvp-staging
```

### **Step 2: Configure Environment Variables**

Go to Vercel Dashboard → Your Staging Project → Settings → Environment Variables

**Required Variables:**
```bash
VITE_ENV=staging
VITE_API_URL=https://your-staging-domain.up.railway.app
```

### **Step 3: Deploy Staging Frontend**

```bash
# Deploy to staging
vercel --prod

# Or use the staging configuration
vercel --prod --config vercel-staging.json
```

---

## **🗄️ Airtable Staging Database Setup**

### **Step 1: Create Staging Base**

1. Go to [Airtable](https://airtable.com)
2. Create a new base called "Novara Staging"
3. Copy the production schema to staging

### **Step 2: Get Staging Credentials**

1. Go to [Airtable API](https://airtable.com/api)
2. Select your staging base
3. Copy the Base ID and API Key

### **Step 3: Update Railway Variables**

Update your Railway staging environment variables with the staging Airtable credentials:

```bash
AIRTABLE_API_KEY=your_staging_airtable_api_key
AIRTABLE_BASE_ID=your_staging_airtable_base_id
```

---

## **🔗 Environment Comparison**

| Environment | Backend URL | Frontend URL | Database | Purpose |
|-------------|-------------|--------------|----------|---------|
| **Local** | `http://localhost:9002` | `http://localhost:4200` | SQLite | Development |
| **Staging** | `https://novara-staging.up.railway.app` | `https://novara-mvp-staging.vercel.app` | Airtable Staging | Pre-production testing |
| **Production** | `https://novara-backend.up.railway.app` | `https://novara-mvp.vercel.app` | Airtable Production | Live application |

---

## **🧪 Testing Staging Environment**

### **Automated Testing**

```bash
# Test staging API endpoints
./scripts/api-endpoint-test.sh staging

# Test full integration
./scripts/test-staging.sh
```

### **Manual Testing Checklist**

- [ ] **Backend Health**: Staging API responds correctly
- [ ] **Frontend Load**: Staging frontend loads without errors
- [ ] **API Integration**: Frontend can connect to staging backend
- [ ] **Authentication**: Login/logout works in staging
- [ ] **Database Operations**: CRUD operations work with staging Airtable
- [ ] **Daily Check-in**: Form submission works in staging
- [ ] **Insights**: AI insights generation works in staging

---

## **🚨 Troubleshooting Staging Issues**

### **Common Issues & Solutions**

#### **1. CORS Errors**
**Symptoms**: Frontend can't connect to backend
**Solution**: Verify `CORS_ORIGIN` in Railway staging variables

#### **2. Database Connection Errors**
**Symptoms**: API returns database errors
**Solution**: Check Airtable staging credentials in Railway variables

#### **3. Authentication Failures**
**Symptoms**: Login doesn't work
**Solution**: Verify `JWT_SECRET` is set in Railway staging

#### **4. Build Failures**
**Symptoms**: Deployment fails
**Solution**: Check Railway and Vercel build logs for specific errors

### **Debugging Commands**

```bash
# Check Railway staging status
railway status

# View Railway staging logs
railway logs

# Check Vercel staging status
vercel ls

# View Vercel staging logs
vercel logs

# Test staging API directly
curl https://your-staging-domain.up.railway.app/api/health
```

---

## **📋 Deployment Workflow**

### **Staging Deployment Process**

1. **Develop locally** with stable port strategy (4200/9002)
2. **Test locally** to ensure everything works
3. **Push to staging branch** to trigger staging deployment
4. **Verify staging environment** is working correctly
5. **Test staging thoroughly** before production deployment
6. **Merge to main** for production deployment

### **Environment Promotion**

```bash
# Local → Staging
git push origin staging

# Staging → Production
git checkout main
git merge staging
git push origin main
```

---

## **🔐 Security Considerations**

### **Staging Security**

- **Separate Airtable bases** for staging and production
- **Different JWT secrets** for each environment
- **Staging-specific API keys** and credentials
- **Limited access** to staging environment
- **Regular cleanup** of staging data

### **Environment Isolation**

- **No shared databases** between environments
- **Separate API keys** for each environment
- **Different domains** for each environment
- **Isolated user data** per environment

---

## **📚 Additional Resources**

- **Railway Documentation**: https://docs.railway.app
- **Vercel Documentation**: https://vercel.com/docs
- **Airtable API Documentation**: https://airtable.com/api
- **Project Troubleshooting**: `docs/deployment-troubleshooting.md`
- **Local Development**: `docs/local-development-guide.md`

---

## **✅ Success Criteria**

Your staging environment is properly configured when:

- [ ] Staging backend responds to health checks
- [ ] Staging frontend loads without errors
- [ ] API integration works between staging frontend and backend
- [ ] Authentication flows work in staging
- [ ] Database operations work with staging Airtable
- [ ] All features work as expected in staging
- [ ] Staging environment is isolated from production

**🎉 Congratulations! Your staging environment is ready for testing!** 