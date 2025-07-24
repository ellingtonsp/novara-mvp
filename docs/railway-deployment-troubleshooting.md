# 🚂 Railway Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. PORT Variable Error
**Error:** `PORT variable must be integer between 0 and 65535`

**Cause:** Railway automatically sets the `PORT` environment variable, but it's being overridden incorrectly.

**Solution:**
1. **Remove PORT from environment variables** - Railway sets this automatically
2. **Update railway.json** to use `PORT=$PORT` in startCommand
3. **Ensure server.js validates PORT** properly

**Fixed Configuration:**
```json
// railway.json
{
  "deploy": {
    "startCommand": "cd backend && PORT=$PORT npm start"
  }
}
```

```javascript
// server.js
const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3002 : 3000);

// Validate PORT is a valid integer
if (process.env.PORT) {
  const portNum = parseInt(process.env.PORT, 10);
  if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
    console.error(`Invalid PORT value: ${process.env.PORT}. Must be an integer between 0 and 65535.`);
    process.exit(1);
  }
}
```

### 2. Environment Variables Not Set
**Error:** Missing required environment variables

**Solution:**
1. Go to Railway Dashboard → Your Project → Variables
2. Add these required variables:
   ```
   AIRTABLE_API_KEY=your_api_key
   AIRTABLE_BASE_ID=your_base_id
   JWT_SECRET=your_jwt_secret
   NODE_ENV=staging
   USE_LOCAL_DATABASE=false
   DATABASE_TYPE=airtable
   ```

### 3. Build Failures
**Error:** Build process fails during deployment

**Common Causes:**
- Missing dependencies in package.json
- Syntax errors in code
- Incorrect build command

**Solution:**
1. Test build locally: `cd backend && npm install --omit=dev`
2. Check for syntax errors: `node -c server.js`
3. Verify all dependencies are in `dependencies` (not `devDependencies`)

### 4. Health Check Failures
**Error:** Health check endpoint not responding

**Solution:**
1. Ensure `/api/health` endpoint exists and returns 200
2. Check if server is binding to correct port
3. Verify CORS configuration allows Railway's health check

### 5. Database Connection Issues
**Error:** Cannot connect to Airtable

**Solution:**
1. Verify `AIRTABLE_API_KEY` is correct and active
2. Check `AIRTABLE_BASE_ID` is correct
3. Ensure `USE_LOCAL_DATABASE=false` for staging/production

## Deployment Checklist

### Before Deployment
- [ ] All environment variables are set in Railway
- [ ] Code has no syntax errors
- [ ] All dependencies are in `dependencies` section
- [ ] Health check endpoint `/api/health` is working
- [ ] CORS is configured for staging domain

### During Deployment
- [ ] Monitor Railway logs for errors
- [ ] Check build process completes successfully
- [ ] Verify health check passes
- [ ] Test API endpoints after deployment

### After Deployment
- [ ] Test staging URL: `https://novara-staging-production.up.railway.app`
- [ ] Verify health endpoint: `/api/health`
- [ ] Test authentication endpoints
- [ ] Check CORS with frontend

## Quick Fix Commands

### Local Testing
```bash
# Test build process
cd backend && npm install --omit=dev

# Test server startup
NODE_ENV=staging USE_LOCAL_DATABASE=false PORT=3000 node server.js

# Test health endpoint
curl http://localhost:3000/api/health
```

### Railway CLI Commands
```bash
# Check deployment status
railway status

# View logs
railway logs --service staging

# Open Railway dashboard
railway open

# Redeploy
railway up --service staging
```

## Environment-Specific Configurations

### Staging Environment
- `NODE_ENV=staging`
- `USE_LOCAL_DATABASE=false`
- `DATABASE_TYPE=airtable`
- CORS origin: `https://novara-mvp-staging.vercel.app`

### Production Environment
- `NODE_ENV=production`
- `USE_LOCAL_DATABASE=false`
- `DATABASE_TYPE=airtable`
- CORS origin: `https://novara-mvp.vercel.app`

## Support Resources

- **Railway Documentation:** https://docs.railway.app/
- **Railway Status:** https://status.railway.app/
- **Project Dashboard:** https://railway.app/dashboard
- **Deployment Script:** `./scripts/deploy-staging-railway.sh` 