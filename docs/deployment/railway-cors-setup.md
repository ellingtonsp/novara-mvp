# Railway CORS Configuration Guide

## Quick Setup for novarafertility.com

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in and navigate to your Novara project

### Step 2: Configure Production Service

1. **Click on your production service** (novara-mvp-production)

2. **Go to Variables tab**

3. **Add this environment variable**:
   ```
   ALLOWED_ORIGINS=https://novarafertility.com,https://www.novarafertility.com,https://novara-mvp.vercel.app
   ```

4. **Railway will automatically redeploy** ✨

### Step 3: Configure Staging Service (Optional)

1. **Click on your staging service** (novara-staging-staging)

2. **Go to Variables tab**

3. **Add this environment variable**:
   ```
   ALLOWED_ORIGINS=https://staging.novarafertility.com,https://novara-mvp-staging.vercel.app
   ```

### Step 4: Verify in Vercel

Make sure your Vercel project has the correct backend URL:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **For Production**, ensure you have:
   ```
   VITE_API_URL=https://novara-mvp-production.up.railway.app
   ```

3. **For Preview/Development**, you might want:
   ```
   VITE_API_URL=https://novara-staging-staging.up.railway.app
   ```

## Testing Your Setup

After Railway redeploys (usually takes 1-2 minutes):

1. **Open your browser's Developer Console** (F12)
2. **Go to** https://www.novarafertility.com
3. **Try logging in or signing up**
4. **Check the Network tab** - API calls should succeed without CORS errors

## Troubleshooting

### Still getting CORS errors?

1. **Check the exact error message** in browser console
   - It will show the origin that's being rejected

2. **Add debug logging** by adding this env var in Railway:
   ```
   DEBUG_CORS=true
   ```

3. **Check Railway logs**:
   - Click on your service
   - Go to "Deployments" tab
   - Click on the latest deployment
   - View logs to see rejected origins

### Common Issues:

**Issue**: "CORS error from https://www.novarafertility.com"
**Fix**: Make sure you included both www and non-www versions

**Issue**: API calls failing silently
**Fix**: Check if VITE_API_URL is set correctly in Vercel

**Issue**: Works locally but not in production
**Fix**: Ensure Railway service is actually running and healthy

## Managing Multiple Domains

If you need to add more domains later, just update the ALLOWED_ORIGINS:

```
ALLOWED_ORIGINS=https://novarafertility.com,https://www.novarafertility.com,https://app.novarafertility.com,https://beta.novarafertility.com
```

## Security Note

Only add origins you trust! Each origin in this list can make API calls to your backend.

## Pro Tips

1. **Use Environment-Specific Origins**:
   - Production: Only production domains
   - Staging: Include test domains
   
2. **Monitor CORS Rejections**:
   - Set up alerts in Railway logs for "CORS: Rejected origin"
   
3. **Consider Using a Wildcard** (if appropriate):
   - Modify the backend code to allow `*.novarafertility.com`
   - Only do this if you control all subdomains

## Quick Command to Test

Run this in your terminal to test the API directly:

```bash
curl -H "Origin: https://www.novarafertility.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://novara-mvp-production.up.railway.app/api/health \
     -v
```

You should see `Access-Control-Allow-Origin: https://www.novarafertility.com` in the response headers.