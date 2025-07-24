# 🔗 Vercel Git Branch Deployment Setup Guide

## 🎯 **Objective**
Configure automatic deployments from Git branches in Vercel Dashboard for seamless staging and production workflows.

## 📋 **Current Status**
- ✅ Production deployment working
- ✅ Staging deployment working  
- ✅ Environment variables configured
- ⏳ Git branch deployment setup needed

## 🚀 **Step-by-Step Setup**

### **Step 1: Access Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Login to your account
3. Find and click on your `novara-mvp` project

### **Step 2: Navigate to Git Settings**
1. Click on the **Settings** tab
2. In the left sidebar, click **Git**
3. You should see your connected Git repository

### **Step 3: Configure Branch Deployments**
1. **Production Branch**: 
   - Set to `main` (default)
   - This deploys to production when you push to main

2. **Preview Branches**:
   - Click **Add Branch**
   - Enter `staging` as the branch name
   - This will create preview deployments for staging

### **Step 4: Configure Build Settings**
1. **Root Directory**: Set to `frontend`
2. **Build Command**: Set to `npm run build`
3. **Output Directory**: Set to `dist`
4. **Install Command**: Set to `npm install`

### **Step 5: Environment Variables (Verify)**
Ensure these are set correctly:
- **Production**: `VITE_API_URL` = `https://novara-backend.up.railway.app`
- **Preview**: `VITE_API_URL` = `https://novara-backend-staging.up.railway.app`

## 🔄 **Deployment Workflow**

### **For Production:**
```bash
git checkout main
git add .
git commit -m "feat: new feature"
git push origin main
# Vercel auto-deploys to production
```

### **For Staging:**
```bash
git checkout staging
git add .
git commit -m "feat: new feature"
git push origin staging
# Vercel auto-deploys to staging preview
```

## 📊 **Expected Results**

After setup, you should have:
- **Production URL**: `https://novara-mvp-novara-fertility.vercel.app`
- **Staging URL**: `https://novara-mvp-git-staging-novara-fertility.vercel.app`
- **Auto-deployment**: Enabled for both branches

## 🧪 **Testing the Setup**

### **Test Staging Deployment:**
```bash
# Make a small change
git checkout staging
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: staging deployment"
git push origin staging

# Check Vercel dashboard for new deployment
```

### **Test Production Deployment:**
```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main

# Check Vercel dashboard for production deployment
```

## 🔧 **Troubleshooting**

### **If Staging Branch Doesn't Deploy:**
1. Check if `staging` branch exists: `git branch -r`
2. Verify branch is added in Vercel Dashboard
3. Check build logs in Vercel Dashboard

### **If Build Fails:**
1. Check build logs in Vercel Dashboard
2. Verify `frontend` directory contains `package.json`
3. Ensure all dependencies are in `package.json`

### **If Environment Variables Don't Work:**
1. Check environment variable scope (Production vs Preview)
2. Redeploy after changing environment variables
3. Verify variable names match your code

## 📈 **Benefits of Git Branch Deployment**

- ✅ **Automatic Deployments**: No manual deployment needed
- ✅ **Preview URLs**: Test changes before production
- ✅ **Rollback Capability**: Easy to revert to previous versions
- ✅ **Team Collaboration**: Multiple developers can deploy safely
- ✅ **CI/CD Pipeline**: Integrated with Git workflow

## 🎯 **Next Steps After Setup**

1. **Test the workflow** with a small change
2. **Set up monitoring** for deployment status
3. **Configure notifications** for deployment success/failure
4. **Document the process** for team members

---

**Last Updated**: July 24, 2025  
**Status**: ⏳ Ready for manual setup in Vercel Dashboard 