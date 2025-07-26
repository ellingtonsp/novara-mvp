# 🚀 Staging Deployment Checklist

## **🚨 CRITICAL: NO MANUAL ENVIRONMENT SELECTION**

### **FORBIDDEN COMMANDS**
```bash
# ❌ NEVER run these - they require manual interaction
railway environment    # Requires user to select environment
railway link          # May require user to select project/environment
railway up            # May require user to select service
```

### **REQUIRED: AUTOMATED DEPLOYMENT**
```bash
# ✅ ALWAYS use automated script - no interaction required
./scripts/deploy-staging-automated.sh
```

---

## **AUTOMATED DEPLOYMENT PROCEDURE**

### **One-Command Staging Deployment**
```bash
# From project root - NO manual environment selection required
./scripts/deploy-staging-automated.sh
```

This script automatically:
- ✅ Links to staging environment with full parameters
- ✅ Deploys backend and frontend
- ✅ Runs health checks
- ✅ Provides staging URLs
- ✅ **ZERO USER INTERACTION REQUIRED**

---

## **MANUAL DEPLOYMENT (EMERGENCY FALLBACK ONLY)**

### **Prerequisites**
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Logged into Railway: `railway login`
- [ ] Staging environment configured in Railway

### **Backend Deployment (Emergency Only)**
```bash
# Navigate to backend directory
cd backend

# Link with FULL parameters (no interaction)
railway link --project novara-mvp --environment staging --service novara-backend-staging --yes

# Deploy (no interaction)
railway up --service novara-backend-staging
```

### **Frontend Deployment (Emergency Only)**
```bash
# Navigate to frontend directory
cd frontend

# Link with FULL parameters (no interaction)
railway link --project novara-mvp --environment staging --service novara-frontend-staging --yes

# Deploy (no interaction)
railway up --service novara-frontend-staging
```

---

## **VERIFICATION STEPS**

### **Health Check**
```bash
# Test staging backend
curl -s https://novara-backend-staging.up.railway.app/api/health | jq .

# Expected response:
{
  "status": "healthy",
  "environment": "staging",
  "timestamp": "2025-07-26T...",
  "version": "1.0.0"
}
```

### **Rate Limiting Test**
```bash
# Test new environment-aware rate limiting
for i in {1..15}; do
  echo "Request $i:"
  curl -s https://novara-backend-staging.up.railway.app/api/health | jq -r '.environment'
done
```

### **Environment Validation**
- [ ] Environment shows "staging"
- [ ] Rate limiting allows 2,000 requests per 15 minutes
- [ ] Database operations working
- [ ] No critical errors in logs

---

## **TROUBLESHOOTING**

### **Common Issues**
1. **Manual Environment Selection Required**
   - **Cause**: Used forbidden commands like `railway environment`
   - **Solution**: Use automated deployment script instead

2. **Deployment Fails**
   - **Cause**: Server crashes due to code errors
   - **Solution**: Fix local issues first, then redeploy

3. **Environment Mismatch**
   - **Cause**: Wrong environment variables or database
   - **Solution**: Verify `NODE_ENV=staging` and correct database ID

### **Emergency Rollback**
```bash
# Use Railway dashboard to revert to previous deployment
# Or use automated rollback script if available
./scripts/rollback-staging.sh
```

---

## **SECURITY CONSIDERATIONS**

### **Environment Isolation**
- [ ] Staging uses separate database (`appEOWvLjCn5c7Ght`)
- [ ] Production uses separate database (`app5QWCcVbCnVg2Gg`)
- [ ] Local development uses SQLite only

### **Rate Limiting**
- [ ] Staging: 2,000 requests per 15 minutes
- [ ] Production: 500 requests per 15 minutes
- [ ] Development: 10,000 requests per 15 minutes

---

## **DOCUMENTATION**

### **Related Files**
- `scripts/deploy-staging-automated.sh` - Automated deployment script
- `docs/rate-limiting-guide.md` - Rate limiting configuration
- `.cursor/rules/deployment.mdc` - Deployment rules and procedures

### **Update Log**
- **2025-07-26**: Added NO-INTERACTION requirements
- **2025-07-26**: Updated Railway CLI procedures
- **2025-07-26**: Added automated deployment emphasis 