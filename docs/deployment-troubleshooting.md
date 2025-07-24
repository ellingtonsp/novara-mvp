# Deployment Troubleshooting Guide

## 🚨 Common Deployment Issues & Solutions

### **Railway Backend Deployment Issues**

#### **Issue 1: Module Not Found Error**
```
Error: Cannot find module './database/database-factory'
```

**Solution:**
- ✅ **Fixed**: Updated `railway.toml` to include all dependencies
- ✅ **Fixed**: Set proper environment variables for production
- ✅ **Fixed**: Database factory now handles production vs development modes

#### **Issue 2: Environment Variables Missing**
**Required Railway Environment Variables:**
```bash
NODE_ENV=production
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
AIRTABLE_API_KEY=your_production_airtable_api_key
AIRTABLE_BASE_ID=your_production_airtable_base_id
JWT_SECRET=your_production_jwt_secret_min_64_characters
CORS_ORIGIN=https://novara-mvp.vercel.app
```

**How to Set in Railway:**
1. Go to Railway Dashboard → Your Project
2. Click "Variables" tab
3. Add each variable above
4. Redeploy the service

#### **Issue 3: Build Failures**
**Check Railway Build Logs:**
1. Go to Railway Dashboard → Your Project
2. Click "Deployments" tab
3. Click on failed deployment
4. Check build logs for specific errors

**Common Build Issues:**
- Missing dependencies in `package.json`
- Environment variables not set
- Port conflicts (should use `$PORT` in Railway)

#### **Issue 4: PORT Variable Error**
**Error Message:**
```
PORT variable must be integer between 0 and 65535
```

**Solution:**
- ✅ **Fixed**: Removed explicit PORT from railway.toml
- ✅ **Fixed**: Railway automatically provides `$PORT` environment variable
- ✅ **Fixed**: Server.js properly uses `process.env.PORT`

**Important:** Do NOT set PORT manually in Railway environment variables. Railway provides it automatically.

### **Vercel Frontend Deployment Issues**

#### **Issue 1: Build Failures**
**Check Vercel Build Logs:**
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click on failed deployment
4. Check build logs

**Common Issues:**
- TypeScript compilation errors
- Missing environment variables
- Build script failures

#### **Issue 2: Environment Variables**
**Required Vercel Environment Variables:**
```bash
VITE_ENV=production
VITE_API_URL=https://novara-backend.up.railway.app
```

**How to Set in Vercel:**
1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add each variable above
4. Redeploy

#### **Issue 3: API Connection Issues**
**Symptoms:**
- Frontend loads but API calls fail
- CORS errors in browser console
- 404 errors for API endpoints

**Solutions:**
1. Verify `VITE_API_URL` is correct
2. Check Railway backend is running
3. Verify CORS settings in backend
4. Test API endpoints directly

### **🔧 Quick Fix Commands**

#### **Railway Backend:**
```bash
# Check Railway status
railway status

# View logs
railway logs

# Redeploy
railway up

# Check environment variables
railway variables
```

#### **Vercel Frontend:**
```bash
# Check Vercel status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

### **🧪 Testing Deployments**

#### **Test Backend (Railway):**
```bash
# Health check
curl https://novara-backend.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-07-24T...",
  "service": "Novara API",
  "environment": "production",
  "airtable": "connected",
  "jwt": "configured",
  "version": "1.0.1"
}
```

#### **Test Frontend (Vercel):**
```bash
# Check if frontend loads
curl https://novara-mvp.vercel.app

# Should return HTML content
```

### **📋 Deployment Checklist**

#### **Before Deploying:**
- [ ] All tests pass locally
- [ ] Environment variables are set
- [ ] Database connections work
- [ ] API endpoints respond correctly
- [ ] Frontend builds successfully

#### **After Deploying:**
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] Authentication flows work
- [ ] Database operations work

### **🚀 Emergency Rollback**

#### **Railway Rollback:**
1. Go to Railway Dashboard → Deployments
2. Find last working deployment
3. Click "Redeploy"

#### **Vercel Rollback:**
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "Promote to Production"

### **📞 Getting Help**

#### **Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Email: support@railway.app

#### **Vercel Support:**
- Documentation: https://vercel.com/docs
- Discord: https://discord.gg/vercel
- Email: support@vercel.com

#### **Project-Specific Issues:**
- Check this troubleshooting guide
- Review recent commits for changes
- Test locally before deploying
- Check environment variable configuration 