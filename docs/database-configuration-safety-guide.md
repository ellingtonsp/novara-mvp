# Database Configuration Safety Guide

**CRITICAL**: This guide prevents database misconfiguration that can cause data corruption, security breaches, and compliance violations.

## 🚨 CRITICAL DATABASE ISOLATION RULES

### Never Share Database IDs Between Environments
- **Production must NEVER use staging database**
- **Staging must NEVER use production database**
- **Development must use local SQLite only**

### Environment-Specific Database Configuration
| Environment | Base ID | Purpose | Validation Required |
|-------------|---------|---------|-------------------|
| **Staging** | `appEOWvLjCn5c7Ght` | Testing and validation | ✅ Before staging deployment |
| **Production** | `app5QWCcVbCnVg2Gg` | Live user data | ✅ Before production deployment |
| **Development** | SQLite (local) | Local development | ✅ Before local testing |

## 🔍 DATABASE CONFIGURATION VALIDATION

### Pre-Deployment Validation (MANDATORY)
```bash
# 1. Check Railway context
railway status
# Expected output:
# Project: novara-mvp
# Environment: [staging|production]
# Service: [novara-staging|novara-main]

# 2. Verify database configuration
railway variables | grep AIRTABLE_BASE_ID
# Expected output:
# For staging: AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
# For production: AIRTABLE_BASE_ID=app5QWCcVbCnVg2Gg

# 3. Validate environment isolation
echo "✅ Database validation: Environment $(railway status | grep Environment) using Base ID $(railway variables | grep AIRTABLE_BASE_ID)"
```

### Database Configuration Checklist
Before ANY deployment, verify:
- [ ] Railway environment is correct (staging/production)
- [ ] Railway service is correct (novara-staging/novara-main)
- [ ] AIRTABLE_BASE_ID matches the environment
- [ ] Database isolation is maintained
- [ ] No cross-environment database sharing

## 🚨 EMERGENCY STOP CONDITIONS

**STOP DEPLOYMENT IMMEDIATELY if:**

1. **Database Misconfiguration Detected**
   - Wrong AIRTABLE_BASE_ID for environment
   - Production pointing to staging database
   - Staging pointing to production database
   - Cross-environment database sharing

2. **Environment Mismatch**
   - Wrong Railway environment selected
   - Wrong service selected
   - Wrong branch deployed

3. **Data Corruption Risk**
   - User data at risk of corruption
   - Security breach potential
   - Compliance violation risk

## 🔧 DATABASE CONFIGURATION FIXES

### Fix Database Misconfiguration
```bash
# 1. Stop deployment immediately
# 2. Verify current configuration
railway variables | grep AIRTABLE_BASE_ID

# 3. Fix configuration
# For staging:
railway variables --set "AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght"

# For production:
railway variables --set "AIRTABLE_BASE_ID=app5QWCcVbCnVg2Gg"

# 4. Verify fix
railway variables | grep AIRTABLE_BASE_ID

# 5. Redeploy
railway up
```

### Fix Environment Mismatch
```bash
# 1. Switch to correct environment
# For staging:
railway environment staging
railway service novara-staging

# For production:
railway environment production
railway service novara-main

# 2. Verify context
railway status

# 3. Redeploy
railway up
```

## 📋 DEPLOYMENT SAFETY PROTOCOLS

### Staging Deployment Protocol
```bash
# 1. Verify context
git branch  # Should be 'staging'
railway status  # Environment=staging, Service=novara-staging
railway variables | grep AIRTABLE_BASE_ID  # Should be appEOWvLjCn5c7Ght

# 2. Deploy frontend
cd frontend && vercel --target staging

# 3. Deploy backend
railway environment staging
railway service novara-staging
railway up
```

### Production Deployment Protocol
```bash
# 1. Verify context
git branch  # Should be 'main'
railway status  # Environment=production, Service=novara-main
railway variables | grep AIRTABLE_BASE_ID  # Should be app5QWCcVbCnVg2Gg

# 2. Deploy frontend
cd frontend && vercel --prod

# 3. Deploy backend
railway environment production
railway service novara-main
railway up
```

## 🔍 TROUBLESHOOTING DATABASE ISSUES

### Common Database Configuration Errors

#### 1. Wrong Database ID
**Symptoms:**
- Database connection errors
- "Invalid permissions" errors
- Data not found errors

**Diagnosis:**
```bash
railway variables | grep AIRTABLE_BASE_ID
```

**Fix:**
```bash
railway variables --set "AIRTABLE_BASE_ID=[correct-base-id]"
railway up
```

#### 2. Environment Mismatch
**Symptoms:**
- Wrong environment detected
- Incorrect service selected
- Deployment to wrong environment

**Diagnosis:**
```bash
railway status
```

**Fix:**
```bash
railway environment [correct-environment]
railway service [correct-service]
railway up
```

#### 3. Cross-Environment Data Access
**Symptoms:**
- Production users seeing staging data
- Staging users seeing production data
- Data corruption

**Diagnosis:**
```bash
railway variables | grep AIRTABLE_BASE_ID
# Check if production is using staging database or vice versa
```

**Fix:**
```bash
# Stop deployment immediately
# Fix database configuration
railway variables --set "AIRTABLE_BASE_ID=[correct-base-id]"
# Redeploy
railway up
```

## 📊 DATABASE HEALTH MONITORING

### Health Check Commands
```bash
# Check database connectivity
curl https://[environment-url]/api/health

# Check database configuration
railway variables | grep AIRTABLE_BASE_ID

# Check environment status
railway status
```

### Expected Health Check Results
```json
{
  "status": "ok",
  "environment": "[staging|production]",
  "database": "[staging|production]_airtable",
  "version": "1.0.3"
}
```

## 🛡️ SECURITY CONSIDERATIONS

### Data Protection
- **HIPAA Compliance**: Patient data must be properly isolated
- **Environment Separation**: No cross-environment data access
- **Access Control**: Proper permissions for each environment
- **Audit Trail**: Track all database configuration changes

### Compliance Requirements
- **Data Isolation**: Production and staging data must be completely separate
- **Access Logging**: All database access must be logged
- **Configuration Management**: All changes must be documented
- **Emergency Procedures**: Clear rollback procedures for misconfigurations

## 📝 DOCUMENTATION REQUIREMENTS

### Database Configuration Changes
All database configuration changes must be documented:
- Date and time of change
- Environment affected
- Previous configuration
- New configuration
- Reason for change
- Validation results

### Incident Documentation
If database misconfiguration occurs:
- Incident description
- Root cause analysis
- Impact assessment
- Resolution steps
- Prevention measures
- Lessons learned

## 🔄 CONTINUOUS IMPROVEMENT

### Regular Reviews
- Weekly database configuration validation
- Monthly environment isolation checks
- Quarterly security audits
- Annual compliance reviews

### Process Improvements
- Automated validation scripts
- Configuration drift detection
- Real-time monitoring alerts
- Automated rollback procedures

## 📞 EMERGENCY CONTACTS

### Critical Issues
- **Database Misconfiguration**: Stop deployment immediately
- **Data Corruption**: Emergency rollback required
- **Security Breach**: Immediate incident response
- **Compliance Violation**: Legal review required

### Response Procedures
1. **Stop all deployments**
2. **Assess impact**
3. **Implement fixes**
4. **Validate resolution**
5. **Document incident**
6. **Update procedures**

---

**Remember**: Database configuration errors can cause catastrophic data loss, security breaches, and compliance violations. Always verify before deployment and stop immediately if issues are detected. 