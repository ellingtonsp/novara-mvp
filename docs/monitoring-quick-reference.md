# Monitoring Quick Reference

## 🎯 **New Monitoring Strategy**

### **Automatic Monitoring (No Alerts)**
- **Essential Monitoring**: Every 2 hours - basic health checks
- **Deployment Monitor**: Every 30 minutes - logging only
- **CI/CD Pipeline**: On push/PR - build validation only

### **Manual Monitoring (When Needed)**
- **Detailed Health Check**: `npm run monitor:detailed`
- **Railway Monitoring**: `npm run monitor:railway`
- **Comprehensive Check**: `npm run monitor:all`

## 🚀 **Quick Commands**

### **Essential Health Checks**
```bash
# Quick production check
curl -f https://novara-mvp-production.up.railway.app/api/health

# Quick staging check  
curl -f https://novara-staging-staging.up.railway.app/api/health

# Quick frontend check
curl -f https://novara-mvp.vercel.app
```

### **Manual Monitoring**
```bash
# Essential monitoring (once)
npm run monitor:essential

# Detailed monitoring (continuous)
npm run monitor:detailed

# Railway-specific monitoring
npm run monitor:railway

# All monitoring
npm run monitor:all
```

### **GitHub Actions Manual Triggers**
```bash
# Essential monitoring workflow
gh workflow run essential-monitoring.yml

# Deployment monitoring workflow
gh workflow run deployment-monitor.yml

# Railway monitoring workflow
gh workflow run railway-monitor.yml
```

## 📊 **Monitoring Frequency**

| Workflow | Frequency | Alerts | Purpose |
|----------|-----------|--------|---------|
| Essential Monitoring | Every 2 hours | None | Basic health |
| Deployment Monitor | Every 30 minutes | None | Detailed logging |
| Railway Monitor | Disabled | None | Manual only |
| CI/CD Pipeline | On push/PR | Build failures only | Deployment safety |

## 🚨 **When to Use Manual Monitoring**

### **Use Detailed Monitoring When:**
- Investigating specific issues
- After major deployments
- During troubleshooting sessions
- Before important releases

### **Use Railway Monitoring When:**
- Backend issues suspected
- Database connectivity problems
- Railway-specific errors
- Performance degradation

### **Use All Monitoring When:**
- Comprehensive system check needed
- Post-incident validation
- Pre-release verification
- Monthly health audits

## 📋 **Alert Reduction Summary**

- **Before**: 5-minute intervals, automatic GitHub issues
- **After**: 2-hour intervals, no automatic alerts
- **Reduction**: ~95% fewer alerts
- **Safety**: All essential checks maintained

## 🔧 **Emergency Procedures**

### **If Critical Issues Are Missed:**
1. Run manual health checks immediately
2. Re-enable specific monitoring workflows if needed
3. Adjust alert thresholds for future

### **Quick Diagnostic Commands:**
```bash
# Check all environments quickly
npm run health-check:production
npm run health-check:staging

# Check deployment status
npm run track:deployments:stats

# Validate environment config
npm run validate:environments
```

## 🎉 **Benefits**

- **95% fewer alerts** - less noise
- **Maintained safety** - all checks still performed
- **Better focus** - alerts only for critical issues
- **Flexible monitoring** - manual when needed
- **Cleaner GitHub** - no automated issue spam

---

*This approach balances monitoring needs with alert fatigue.* 