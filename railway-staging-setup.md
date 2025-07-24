# 🚂 Railway Staging Setup Guide

## 🎯 **Objective**
Connect your `staging` git branch to auto-deploy to Railway staging environment.

## 📋 **Prerequisites**
- ✅ Railway account with existing staging project
- ✅ GitHub repository with `staging` branch
- ✅ Staging Airtable base: `appEOWvLjCn5c7Ght`

## 🔧 **Step-by-Step Setup**

### **1. Access Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Login to your account
3. Find your staging project: **"Novara Staging"** or similar

### **2. Configure Git Branch Connection**
```
Railway Dashboard → Your Staging Project → Settings → Source
```

**Current Issue**: Probably connected to `main` branch
**Fix**: Change to `staging` branch

#### **Settings to Update:**
- **Repository**: `ellingtonsp/novara-mvp`
- **Branch**: `staging` ⚠️ **Change from main**
- **Root Directory**: `backend`
- **Build Command**: `npm install --omit=dev`
- **Start Command**: `npm start`

### **3. Environment Variables** 
Set these in Railway → Project → Variables:

```env
# Database Configuration
AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7
AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght

# Environment Setup
NODE_ENV=staging
PORT=$PORT

# Security
JWT_SECRET=staging_super_secret_jwt_key_different_from_prod

# Optional Monitoring
RAILWAY_ENVIRONMENT=staging
```

### **4. Build Configuration**
Create/update `backend/railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install --omit=dev"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[environment]
NODE_ENV = "staging"
PORT = "$PORT"
```

### **5. Deploy Configuration**
```
Railway Dashboard → Deploy → Manual Deploy → Deploy Latest Commit
```

Or trigger auto-deployment:
```bash
git push origin staging
```

## 🧪 **Verification**

After setup, test the staging backend:

```bash
# Health check
curl https://novara-staging-production.up.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "environment": "staging",
  "timestamp": "2024-01-23T...",
  "database": "connected"
}
```

## 🔄 **Auto-Deployment Workflow**

Once configured:

```bash
# Any push to staging branch triggers deployment
git checkout staging
git add .
git commit -m "test: staging deployment"
git push origin staging
```

Railway will automatically:
1. ✅ Detect staging branch change
2. ✅ Build from `backend/` directory  
3. ✅ Deploy with staging environment variables
4. ✅ Run health checks

## 🚨 **Common Issues & Fixes**

### **Issue**: 502 Bad Gateway
**Cause**: App not starting properly
**Fix**: Check Railway logs → Deployments → View Logs

### **Issue**: Wrong branch deploying
**Cause**: Still connected to `main` branch
**Fix**: Settings → Source → Change branch to `staging`

### **Issue**: Environment variables missing
**Cause**: Variables not set in Railway
**Fix**: Variables tab → Add all required variables

### **Issue**: Build failures
**Cause**: Missing dependencies or wrong build path
**Fix**: Verify `backend/package.json` and build commands

## ✅ **Success Indicators**

- ✅ Railway shows "Deployed" status
- ✅ Health check returns 200 OK
- ✅ Logs show "Server running on port..."
- ✅ Auto-deploys when staging branch updates

## 🎯 **Next Step**
After Railway staging works, configure Vercel staging frontend.