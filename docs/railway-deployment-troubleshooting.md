# 🚀 Railway Deployment Troubleshooting

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

## **COMMON ISSUES & SOLUTIONS**

### **1. Manual Environment Selection Required**

**Problem**: Railway CLI asks you to select environment manually
```bash
# ❌ This should NEVER happen
? Select a project: (Use arrow keys)
❯ novara-mvp
  other-project
```

**Root Cause**: Used forbidden commands like `railway environment` or `railway link` without full parameters

**Solution**: 
1. **STOP** - do not select anything manually
2. Use automated deployment script: `./scripts/deploy-staging-automated.sh`
3. The script uses full parameters: `--project novara-mvp --environment staging --service novara-backend-staging --yes`

**Prevention**: 
- Never run `railway environment`
- Never run `railway link` without full parameters
- Always use automated deployment scripts

---

### **2. Server Crashes on Startup**

**Problem**: Server fails to start with errors like:
```
ReferenceError: generalLimiter is not defined
SyntaxError: Identifier 'config' has already been declared
```

**Root Cause**: Code errors in server.js

**Solution**:
1. Fix the code error locally first
2. Test locally: `curl -s http://localhost:3002/api/health | jq .`
3. Only deploy after local testing passes
4. Use automated deployment script

**Prevention**:
- Always test locally before deploying
- Use `./scripts/start-dev-stable.sh` for local testing
- Check for syntax errors and undefined variables

---

### **3. Environment Mismatch**

**Problem**: Staging shows wrong environment or database
```json
{
  "environment": "production",  // Should be "staging"
  "database": "app5QWCcVbCnVg2Gg"  // Should be "appEOWvLjCn5c7Ght"
}
```

**Root Cause**: Wrong environment variables or database configuration

**Solution**:
1. Verify `NODE_ENV=staging` in Railway environment variables
2. Verify `AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght` for staging
3. Redeploy using automated script

**Prevention**:
- Use environment-specific configuration
- Verify environment variables before deployment
- Test environment detection locally

---

### **4. Rate Limiting Issues**

**Problem**: Requests getting rate limited unexpectedly
```json
{
  "error": "Too many requests, please try again later."
}
```

**Root Cause**: Rate limiting configured incorrectly for environment

**Solution**:
1. Verify rate limiting configuration in `server.js`
2. Check environment-specific limits:
   - Development: 10,000 requests per 15 minutes
   - Staging: 2,000 requests per 15 minutes
   - Production: 500 requests per 15 minutes
3. Test rate limiting locally first

**Prevention**:
- Test rate limiting locally before deploying
- Use environment-aware configuration
- Monitor rate limiting in logs

---

### **5. Railway CLI Issues**

**Problem**: Railway CLI commands fail or behave unexpectedly

**Root Cause**: Outdated CLI version or incorrect usage

**Solution**:
1. Update Railway CLI: `npm install -g @railway/cli@latest`
2. Check login status: `railway whoami`
3. Use correct command syntax with full parameters

**Prevention**:
- Keep Railway CLI updated
- Use automated deployment scripts
- Never use interactive commands

---

## **EMERGENCY PROCEDURES**

### **Rollback Deployment**
```bash
# Use Railway dashboard to revert to previous deployment
# Or use automated rollback script if available
./scripts/rollback-staging.sh
```

### **Manual Emergency Deployment**
```bash
# ONLY in emergency - use full parameters to avoid interaction
cd backend
railway link --project novara-mvp --environment staging --service novara-backend-staging --yes
railway up --service novara-backend-staging
```

### **Database Issues**
```bash
# Check environment variables
railway variables --environment staging

# Verify database connectivity
curl -s https://novara-backend-staging.up.railway.app/api/health | jq .
```

---

## **DEBUGGING STEPS**

### **1. Local Testing First**
```bash
# Start local development
./scripts/start-dev-stable.sh

# Test health endpoint
curl -s http://localhost:3002/api/health | jq .

# Test rate limiting
for i in {1..15}; do
  echo "Request $i:"
  curl -s http://localhost:3002/api/health | jq -r '.environment'
done
```

### **2. Railway Status Check**
```bash
# Check current Railway context
railway status

# Check Railway login
railway whoami

# Check Railway CLI version
railway --version
```

### **3. Environment Variables**
```bash
# Check staging environment variables
railway variables --environment staging

# Verify critical variables:
# - NODE_ENV=staging
# - AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
# - USE_LOCAL_DATABASE=false
```

### **4. Logs Analysis**
```bash
# Check Railway logs
railway logs --environment staging

# Look for:
# - Environment detection
# - Rate limiting configuration
# - Database connection
# - Server startup errors
```

---

## **PREVENTION CHECKLIST**

### **Before Every Deployment**
- [ ] Code tested locally with `./scripts/start-dev-stable.sh`
- [ ] Health endpoint working locally
- [ ] Rate limiting tested locally
- [ ] No syntax errors or undefined variables
- [ ] Environment variables configured correctly
- [ ] Automated deployment script ready

### **After Every Deployment**
- [ ] Health endpoint responding
- [ ] Environment correctly identified
- [ ] Rate limiting working as expected
- [ ] Database operations successful
- [ ] No critical errors in logs
- [ ] Frontend connecting to backend

---

## **RESOURCES**

### **Documentation**
- `docs/staging-deployment-checklist.md` - Staging deployment guide
- `docs/rate-limiting-guide.md` - Rate limiting configuration
- `.cursor/rules/deployment.mdc` - Deployment rules

### **Scripts**
- `./scripts/deploy-staging-automated.sh` - Automated staging deployment
- `./scripts/start-dev-stable.sh` - Local development startup
- `./scripts/monitoring/comprehensive-health-check.js` - Health monitoring

### **Railway Dashboard**
- [Railway Dashboard](https://railway.app/dashboard) - Manual deployment management
- [Railway CLI Documentation](https://docs.railway.app/reference/cli) - CLI reference 