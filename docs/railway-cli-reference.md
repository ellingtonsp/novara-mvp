# 🚂 Railway CLI Reference Guide

## **Overview**
This guide documents the CORRECT Railway CLI commands and procedures to avoid manual environment selection.

---

## **✅ CORRECT Commands (No Manual Selection)**

### **Linking to Environments**
```bash
# Link to staging with full parameters
railway link --project novara-mvp --environment staging

# Link to production with full parameters  
railway link --project novara-mvp --environment production

# Link to specific service in staging
railway link --project novara-mvp --environment staging --service novara-staging
```

### **Deployment**
```bash
# Deploy after linking
railway up

# Deploy to specific service (if multiple services)
railway up --service novara-staging
```

### **Status & Information**
```bash
# Check current connection
railway status

# List available projects
railway list

# Show current user
railway whoami

# Get domain URL
railway domain

# View logs
railway logs

# Show environment variables
railway variables
```

---

## **❌ FORBIDDEN Commands (Require Manual Selection)**

```bash
# NEVER use these commands - they require manual selection:
railway environment        # Lists environments but requires selection
railway service           # Lists services but requires selection
railway link             # Without parameters, requires manual selection
```

---

## **🚀 Standard Deployment Workflow**

### **1. Staging Deployment**
```bash
# Option A: Use automated script (RECOMMENDED)
./scripts/deploy-staging-automated.sh

# Option B: Manual commands (EMERGENCY ONLY)
cd backend
railway link --project novara-mvp --environment staging --service novara-staging
railway up
```

### **2. Production Deployment**
```bash
# Option A: Use automated script (RECOMMENDED)
./scripts/deploy-production-automated.sh

# Option B: Manual commands (REQUIRES EXPLICIT APPROVAL)
cd backend
railway link --project novara-mvp --environment production --service novara-backend
railway up
```

---

## **🔧 Common Tasks**

### **Switch Between Environments**
```bash
# Switch to staging
railway link --project novara-mvp --environment staging

# Switch to production (REQUIRES APPROVAL)
railway link --project novara-mvp --environment production

# Always verify after switching
railway status
```

### **View Deployment Logs**
```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs -f
```

### **Check Environment Variables**
```bash
# List all variables
railway variables

# Check specific variable
railway variables | grep AIRTABLE_BASE_ID
```

---

## **⚠️ Important Notes**

1. **ALWAYS specify full parameters** when using `railway link`
2. **NEVER use interactive commands** that require manual selection
3. **ALWAYS verify environment** with `railway status` before deploying
4. **USE automated scripts** whenever possible
5. **GET explicit approval** before production deployments

---

## **🚨 Troubleshooting**

### **"Project not found" Error**
```bash
# List available projects
railway list

# Link with correct project name
railway link --project novara-mvp --environment staging
```

### **"Service not found" Error**
```bash
# Check service name in Railway dashboard
# Common service names:
# - Staging: novara-staging
# - Production: novara-backend
```

### **Authentication Issues**
```bash
# Check login status
railway whoami

# Re-login if needed
railway login
```

---

## **📝 Quick Reference**

| Task | Command |
|------|---------|
| Deploy to staging | `./scripts/deploy-staging-automated.sh` |
| Deploy to production | `./scripts/deploy-production-automated.sh` |
| Check status | `railway status` |
| View logs | `railway logs` |
| Switch to staging | `railway link --project novara-mvp --environment staging` |
| Deploy after linking | `railway up` |

---

**Last Updated**: July 26, 2025
**Railway CLI Version**: Latest 