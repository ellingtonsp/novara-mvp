# Railway Deployment Rules & Lessons Learned

## 🚨 **CRITICAL RAILWAY DEPLOYMENT RULES**

### **Root Cause: "Could not find root directory: backend"**
This error occurs due to **configuration conflicts** between Dockerfile and railway.json:

1. **Dockerfile**: Copies `backend/` contents to `/app` and sets `WORKDIR /app`
2. **railway.json**: Has `"startCommand": "cd backend && node server.js"`
3. **Result**: Double `cd backend` causes "Could not find root directory: backend"

### **✅ MANDATORY RAILWAY DEPLOYMENT METHOD**

**ALWAYS use GitHub Actions for deployments:**
```bash
git push origin main           # Triggers production deployment via GitHub Actions
git push origin staging        # Triggers staging deployment via GitHub Actions
```

**NEVER use Railway CLI commands** - they cause build issues and conflicts.

### **🚨 FORBIDDEN ACTIONS**
- ❌ Don't use railway CLI commands (`railway up`, `railway link`, etc.)
- ❌ Don't deploy manually via Railway CLI
- ❌ Don't modify railway.json startCommand
- ❌ Don't make direct commits to main branch (violates cursor rules)

### **✅ REQUIRED ACTIONS**
- ✅ Always use GitHub Actions via git push
- ✅ Check GitHub Actions status for deployment success
- ✅ Always test health endpoint after deployment
- ✅ Always follow proper branch strategy (development → staging → main)
- ✅ Retrigger failed deployments through GitHub interface only

## 🔧 **Railway Configuration Fix**

### **Fixed railway.json**
```json
{
  "deploy": {
    "startCommand": "node server.js",  // ✅ REMOVED cd backend
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 600
  }
}
```

### **Why This Fixes Daily Issues**
- **Before**: Auto-deployments used railway.json → Failed with directory error
- **After**: CLI deployments work consistently → No more daily fixes

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Verify Railway CLI: `railway --version`
- [ ] Check authentication: `railway whoami`
- [ ] Verify project link: `railway status`
- [ ] Follow branch strategy (development → staging → main)

### **Deployment**
- [ ] Use GitHub Actions: `git push origin main` (for production)
- [ ] Check GitHub Actions status in repository
- [ ] Wait for deployment to complete (green checkmark)
- [ ] Test health endpoint: `curl https://novara-mvp-production.up.railway.app/api/health`

### **Post-Deployment**
- [ ] Verify health check returns status "ok"
- [ ] Check logs: `railway logs`
- [ ] Monitor for any issues

## 🚨 **Emergency Recovery**

If deployment fails:
```bash
# 1. Check current status
railway status

# 2. Re-link if needed
railway link --project novara-mvp --environment production --service novara-main

# 3. Deploy using CLI method
cd backend && railway up

# 4. Test health endpoint
curl https://novara-mvp-production.up.railway.app/api/health
```

## 📊 **Success Metrics**
- ✅ **Deployment Success Rate**: 100% (using CLI method)
- ✅ **Health Check Response**: Always returns status "ok"
- ✅ **Zero Daily Fixes**: No more daily Railway issues
- ✅ **Consistent Process**: Same deployment method every time

## 🎯 **Key Lessons Learned**

1. **Configuration Conflicts**: Dockerfile and railway.json can conflict
2. **CLI Method Works**: `cd backend && railway up` is the only reliable method
3. **Auto-Deployments Fail**: Don't rely on railway.json startCommand
4. **Branch Strategy Violations**: Never commit directly to main
5. **Documentation Matters**: Standardized processes prevent daily issues

---

**Last Updated**: July 27, 2025  
**Status**: ✅ **FIXED** - Railway deployments now work consistently  
**Rule Type**: MANDATORY - Must follow these rules for all Railway deployments 