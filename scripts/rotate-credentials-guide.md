# 🚨 URGENT: Database Credential Rotation Guide

## Step 1: Access Railway Dashboard
1. Go to https://railway.app/dashboard
2. Navigate to your project
3. Select the PostgreSQL service

## Step 2: Generate New Password
1. In the PostgreSQL service, go to "Variables" tab
2. Find `PGPASSWORD` 
3. Click the regenerate/refresh icon next to it
4. Railway will generate a new secure password

## Step 3: Get New Connection String
1. After regenerating, find the `DATABASE_URL` variable
2. Copy the new complete connection string
3. It should look like: `postgresql://postgres:NEW_PASSWORD@switchyard.proxy.rlwy.net:58017/railway`

## Step 4: Update Local Environment
```bash
# Update your local .env file
DATABASE_URL="postgresql://postgres:NEW_PASSWORD@switchyard.proxy.rlwy.net:58017/railway"
```

## Step 5: Update Railway Environment Variables
1. In Railway, go to your Backend service
2. Update the `DATABASE_URL` environment variable with the new connection string
3. The service will automatically redeploy

## Step 6: Verify Deployment
After Railway redeploys:
```bash
# Test the staging API
curl https://your-backend-url.railway.app/api/health

# Run smoke tests
npm run test:smoke -- --env=staging
```

## Step 7: Monitor for Issues
- Check Railway logs for connection errors
- Monitor your application for any database connectivity issues
- Check GitGuardian to ensure the alert is resolved

## Important Notes
- The old password is now invalid and cannot be used
- All active connections will be terminated
- Your app will reconnect with the new credentials automatically
- No data is lost during this process

## If Something Goes Wrong
Railway keeps the old password for a short time. If needed:
1. Go back to Variables
2. You can temporarily revert while troubleshooting
3. But complete the rotation ASAP