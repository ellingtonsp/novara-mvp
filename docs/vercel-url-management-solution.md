# Vercel Preview URL Management Solution

## 🎯 Problem Solved

**Issue**: Vercel preview URLs change dynamically with each deployment, causing CORS errors when the backend doesn't include the new URL in its allowed origins.

**Root Cause**: Vercel generates unique preview URLs like `https://novara-[hash]-novara-fertility.vercel.app` for each deployment, but the backend CORS configuration was manually maintained.

## ✅ Solution Implemented

### 1. **Automated CORS Configuration Script**
- **Script**: `scripts/auto-update-cors.js`
- **Purpose**: Automatically detects current Vercel staging URLs and updates CORS configuration
- **Usage**: `node scripts/auto-update-cors.js`

### 2. **Updated .cursorrules Documentation**
- Added Vercel URL management section
- Documented the staging deployment workflow
- Added troubleshooting steps for CORS issues

### 3. **Testing Scripts**
- `scripts/test-new-staging-url.js` - Validates CORS configuration
- `scripts/test-staging-comprehensive.js` - Full staging environment testing

## 🔧 How It Works

### Automated CORS Update Process
1. **Detect Current URLs**: Script parses `vercel ls` output to find active staging URLs
2. **Filter Relevant URLs**: Only includes "Ready" and "Preview" deployments
3. **Update Configuration**: Automatically updates `backend/server.js` CORS configuration
4. **Create Backup**: Creates timestamped backup before making changes
5. **Deploy**: Deploy updated backend to staging

### Staging Deployment Workflow
```bash
# 1. Deploy to staging
git push origin staging

# 2. Check new Vercel URL
vercel ls

# 3. Update CORS if needed
node scripts/auto-update-cors.js

# 4. Deploy backend
railway up

# 5. Test staging
node scripts/test-new-staging-url.js

# 6. Verify on mobile
# Test actual mobile device
```

## 📋 Usage Instructions

### For New Staging Deployments
1. After deploying to staging, run: `node scripts/auto-update-cors.js`
2. Review the changes in `backend/server.js`
3. Deploy the backend: `railway up`
4. Test the configuration: `node scripts/test-new-staging-url.js`

### Manual URL Detection
If the automated script fails:
```bash
# Check current Vercel URLs
vercel ls

# Look for lines with "Preview" and "● Ready" status
# Copy the URL and manually add to CORS configuration
```

### Testing Configuration
```bash
# Test CORS configuration
node scripts/test-new-staging-url.js

# Full staging environment test
node scripts/test-staging-comprehensive.js
```

## 🚨 Troubleshooting

### Common Issues

#### Script Fails to Find URLs
- **Cause**: Vercel CLI not authenticated or no active deployments
- **Solution**: Run `vercel login` and check `vercel ls` manually

#### CORS Still Failing After Update
- **Cause**: Backend not deployed or cache issues
- **Solution**: 
  1. Deploy backend: `railway up`
  2. Clear browser cache
  3. Test with incognito mode

#### Multiple Staging URLs Found
- **Cause**: Multiple active preview deployments
- **Solution**: Script automatically selects the most recent one

### Recovery Steps
If the automated update causes issues:
1. **Restore from backup**: Use the timestamped backup file created by the script
2. **Manual fix**: Manually edit `backend/server.js` CORS configuration
3. **Redeploy**: `railway up`

## 🔮 Future Improvements

### Potential Enhancements
1. **Wildcard CORS**: Use `https://novara-*-novara-fertility.vercel.app` pattern
2. **Environment Variables**: Store staging URLs in environment variables
3. **CI/CD Integration**: Automate CORS updates in deployment pipeline
4. **Health Checks**: Add automatic health checks after CORS updates

### Wildcard CORS Implementation
```javascript
// Future implementation - more permissive for staging
const allowedOrigins = process.env.NODE_ENV === 'staging' 
  ? ['https://novara-*-novara-fertility.vercel.app'] // Wildcard for staging
  : ['https://novara-mvp.vercel.app']; // Specific for production
```

## 📊 Success Metrics

- **Before**: Manual CORS updates required for each staging deployment
- **After**: Automated CORS updates with single command
- **Time Saved**: ~5-10 minutes per staging deployment
- **Error Reduction**: Eliminates CORS-related deployment failures

## 🎯 Best Practices

1. **Always run the script** after staging deployments
2. **Test immediately** after CORS updates
3. **Keep backups** of working configurations
4. **Monitor Vercel dashboard** for deployment status
5. **Use mobile testing** to verify end-to-end functionality

---

**Last Updated**: July 25, 2025  
**Status**: ✅ Implemented and Tested  
**Next Review**: After next staging deployment 