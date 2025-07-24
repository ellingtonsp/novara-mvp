# ▲ Vercel Staging Setup Guide

## 🎯 **Objective**
Connect your `staging` git branch to auto-deploy to Vercel staging environment.

## 📋 **Prerequisites**
- ✅ Vercel account with existing staging project
- ✅ GitHub repository with `staging` branch
- ✅ Railway staging backend URL configured

## 🔧 **Step-by-Step Setup**

### **1. Access Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com/dashboard)
2. Login to your account
3. Find your staging project: **"novara-mvp-staging"** or similar

### **2. Configure Git Branch Connection**
```
Vercel Dashboard → Your Project → Settings → Git
```

**Current Issue**: Probably connected to `main` branch
**Fix**: Add `staging` branch to auto-deploy

#### **Branch Configuration:**
- **Production Branch**: `main` (leave as is)
- **Preview Branches**: Add `staging` ⚠️ **Add this**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### **3. Environment Variables**
Set these in Vercel → Project → Settings → Environment Variables:

#### **For Staging Environment:**
```env
# API Configuration
VITE_API_URL=https://novara-staging-production.up.railway.app

# Analytics (Staging)
VITE_GA_MEASUREMENT_ID=G-STAGING-TEST-ID

# Environment Identifier
VITE_APP_ENV=staging
NODE_ENV=production
```

#### **Environment Scope:**
- ✅ **Preview** (for staging branch)
- ❌ Production (keep existing)
- ❌ Development (keep existing)

### **4. Build Configuration**
Your existing `vercel.json` should work:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **5. Deploy Configuration**

#### **Manual Deploy (Initial):**
```
Vercel Dashboard → Deployments → Create Deployment
Branch: staging
```

#### **Auto-Deploy Setup:**
```
Settings → Git → Preview Deployments → Enable for staging
```

## 🧪 **Verification**

After setup, your staging should be accessible at:
```
https://novara-mvp-staging-[random].vercel.app
```

Test the staging frontend:
```bash
# Check staging frontend loads
curl -I https://novara-mvp-staging.vercel.app

# Expected: 200 OK response
```

## 🔄 **Auto-Deployment Workflow**

Once configured:

```bash
# Any push to staging branch triggers deployment
git checkout staging
git add .
git commit -m "test: staging frontend deployment"
git push origin staging
```

Vercel will automatically:
1. ✅ Detect staging branch change
2. ✅ Build from `frontend/` directory
3. ✅ Deploy with staging environment variables  
4. ✅ Provide staging-specific URL

## 📱 **Staging URL Structure**

- **Custom Domain**: `https://novara-mvp-staging.vercel.app` (if configured)
- **Auto-Generated**: `https://novara-mvp-staging-[hash].vercel.app`
- **Branch Preview**: `https://novara-mvp-[branch]-[user].vercel.app`

## 🚨 **Common Issues & Fixes**

### **Issue**: "Deployment not found"
**Cause**: No staging deployment exists
**Fix**: Manually deploy staging branch first

### **Issue**: API calls failing
**Cause**: `VITE_API_URL` pointing to wrong backend
**Fix**: Verify environment variable points to Railway staging

### **Issue**: Build failures
**Cause**: Missing dependencies or wrong build path
**Fix**: Check `frontend/package.json` and build commands

### **Issue**: Environment variables not working
**Cause**: Variables not set for Preview environment
**Fix**: Environment Variables → Set scope to "Preview"

## 🔗 **Connect Frontend to Backend**

Verify the connection works:

```bash
# Test staging API from staging frontend
curl https://novara-mvp-staging.vercel.app/api/health
# Should proxy to Railway staging backend
```

## ✅ **Success Indicators**

- ✅ Vercel shows "Ready" status for staging
- ✅ Staging URL loads the application
- ✅ API calls reach Railway staging backend
- ✅ Auto-deploys when staging branch updates
- ✅ Environment shows "staging" indicators

## 🔄 **Full Staging Environment Test**

Once both Railway and Vercel staging are working:

```bash
# Test the complete staging environment
node staging-config.js
```

Expected output:
```
✅ Staging backend is healthy!
✅ Staging frontend is accessible!
✅ Staging Airtable connection successful!
```

## 🎯 **Next Step**
Test your bug fixes in the complete staging environment!