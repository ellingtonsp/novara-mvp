# Deployment Safety Quick Reference

**CRITICAL**: This reference must be checked before ANY deployment to prevent data corruption and security breaches.

## 🚨 CRITICAL DATABASE CONFIGURATION

### Environment-Specific Database IDs
| Environment | Base ID | Railway Service |
|-------------|---------|----------------|
| **Staging** | `appEOWvLjCn5c7Ght` | novara-staging |
| **Production** | `app5QWCcVbCnVg2Gg` | novara-main |
| **Development** | SQLite (local) | N/A |

### Database Validation Commands
```bash
# ALWAYS run before deployment:
railway status  # Verify environment and service
railway variables | grep AIRTABLE_BASE_ID  # Verify correct database ID
```

## 🔧 DEPLOYMENT COMMANDS

### Staging Deployment
```bash
# 1. Verify context
git branch  # Should be 'staging'
railway status  # Environment=staging, Service=novara-staging
railway variables | grep AIRTABLE_BASE_ID  # Should be appEOWvLjCn5c7Ght

# 2. Deploy
cd frontend && vercel --target staging
railway environment staging && railway service novara-staging && railway up
```

### Production Deployment
```bash
# 1. Verify context
git branch  # Should be 'main'
railway status  # Environment=production, Service=novara-main
railway variables | grep AIRTABLE_BASE_ID  # Should be app5QWCcVbCnVg2Gg

# 2. Deploy
cd frontend && vercel --prod
railway environment production && railway service novara-main && railway up
```

## ✅ PRE-DEPLOYMENT CHECKLIST

### Environment Verification
- [ ] Correct branch checked out
- [ ] Railway environment matches target
- [ ] Railway service matches target
- [ ] Database ID matches environment

### Database Isolation
- [ ] Staging uses staging database only
- [ ] Production uses production database only
- [ ] No cross-environment database sharing
- [ ] Database ID verified with `railway variables`

### User Approval
- [ ] User approved production deployment
- [ ] Staging validation completed
- [ ] All critical issues resolved

## 🚨 EMERGENCY STOP CONDITIONS

**STOP IMMEDIATELY if:**
- Wrong AIRTABLE_BASE_ID for environment
- Production pointing to staging database
- Staging pointing to production database
- Environment mismatch detected
- Database connection errors

## 📋 ROLLBACK PROCEDURES

### Database Misconfiguration
```bash
# 1. Stop deployment
# 2. Fix database configuration
railway variables --set "AIRTABLE_BASE_ID=[correct-base-id]"
# 3. Redeploy
railway up
```

### Environment Mismatch
```bash
# 1. Switch to correct environment
railway environment [correct-environment]
railway service [correct-service]
# 2. Redeploy
railway up
```

## 🔍 TROUBLESHOOTING

### Common Issues
1. **Wrong database ID**: Check `railway variables | grep AIRTABLE_BASE_ID`
2. **Environment mismatch**: Check `railway status`
3. **Deployment failures**: Check `railway logs`

### Emergency Contacts
- **Database Issues**: Stop deployment immediately
- **Environment Issues**: Revert and redeploy
- **Data Corruption**: Emergency rollback required

---

**Remember**: Database configuration errors can cause data corruption and security breaches. Always verify before deployment. 