# Troubleshooting Guide

This guide covers common issues and their solutions for the Novara MVP deployment.

## Table of Contents
1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Deployment Issues](#deployment-issues)
4. [CORS Issues](#cors-issues)
5. [Database Issues](#database-issues)
6. [CI/CD Issues](#cicd-issues)
7. [Domain and DNS Issues](#domain-and-dns-issues)

## Backend Issues

### 502 Bad Gateway on Railway

**Symptoms:**
- API returns 502 error
- Health check fails
- "Application failed to respond" message

**Common Causes & Solutions:**

1. **Missing API_BASE_URL**
   ```env
   API_BASE_URL=https://novara-mvp-production.up.railway.app
   ```

2. **PORT manually set**
   - Remove PORT from Railway variables
   - Railway provides it automatically

3. **Wrong server mode**
   ```env
   USE_REFACTORED_SERVER=true  # Should be true for production
   ```

4. **Database configuration issue**
   ```env
   DATABASE_TYPE=postgresql     # Not 'postgres' or 'airtable'
   USE_LOCAL_DATABASE=false    # Must be false for Railway
   ```

**Debugging Steps:**
```bash
# Check Railway logs
# Railway Dashboard → Service → Logs

# Test health endpoint
curl https://your-app.up.railway.app/api/health

# Check specific error
# Look for "TypeError: Cannot read properties of undefined"
```

### OAuth Configuration Errors

**Error:** `TypeError: Cannot read properties of undefined (reading 'baseUrl')`

**Solution:**
```javascript
// Ensure config/index.js has:
server: {
  baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 9002}`
}
```

### Authentication Issues

**JWT Token Errors:**
- Ensure JWT_SECRET is set and consistent
- Check token expiration (default: 30d)
- Verify Authorization header format: `Bearer <token>`

## Frontend Issues

### Build Failures

**TypeScript Errors:**
```bash
# Common error
Module '"@/lib/api"' has no default export

# Solution - use named exports:
import { apiClient } from '@/lib/api';  // ✓
import api from '@/lib/api';           // ✗
```

**Missing Dependencies:**
```bash
# Error: Cannot find module 'react-router-dom'
npm install react-router-dom @types/react-router-dom
```

### Environment Variables Not Working

**Issue:** `import.meta.env.VITE_API_URL` is undefined

**Solutions:**
1. Ensure variable starts with `VITE_`
2. Restart dev server after adding variables
3. Check `.env` file is in frontend root
4. Verify Vercel has the variables set

### PWA Cache Issues

**Symptoms:** Old version persists after deployment

**Solution:**
```javascript
// Force cache clear
if (appVersion !== cacheVersion) {
  await clearAllCaches();
}
```

## Deployment Issues

### Vercel Deployment Failures

**Build Command Issues:**
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist"
}
```

**Memory Issues:**
- Upgrade to Pro if hitting limits
- Optimize build process
- Check for memory leaks

### Railway Deployment Failures

**Build Failures:**
- Check package.json scripts
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Verify Node.js version compatibility

**Start Command:**
```json
{
  "scripts": {
    "start": "node server-switcher.js"
  }
}
```

## CORS Issues

### "Access to fetch... blocked by CORS policy"

**Quick Fix in Railway:**
```env
CORS_ORIGIN=https://novara-mvp.vercel.app,https://novarafertility.com,https://www.novarafertility.com
```

**Code Fix in backend/server.js:**
```javascript
const allowedOrigins = [
  'https://novarafertility.com',
  'https://www.novarafertility.com',
  'https://novara-mvp.vercel.app'
];
```

**Testing CORS:**
```bash
curl -I https://api-url/api/health \
  -H "Origin: https://novarafertility.com"

# Look for:
# access-control-allow-origin: https://novarafertility.com
```

### Preflight Request Issues

**Ensure OPTIONS requests are handled:**
```javascript
app.options('*', cors()); // Enable preflight for all routes
```

## Database Issues

### Connection Errors

**PostgreSQL Connection Failed:**
```env
# Check DATABASE_URL format:
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**Connection Pool Exhausted:**
- Increase pool size in database config
- Check for connection leaks
- Implement connection retry logic

### Migration Issues

**Schema Mismatch:**
```bash
# Run migrations
node backend/scripts/migrate-to-schema-v2.js

# Validate migration
node backend/scripts/validate-postgres-migration.js
```

## CI/CD Issues

### GitHub Actions Failures

**Node.js Version Mismatch:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'  # Match Railway/Vercel
```

**Cache Issues:**
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Test Failures

**Environment-Specific Tests:**
```javascript
if (process.env.CI) {
  // Skip tests that require local resources
}
```

**Timeout Issues:**
```javascript
jest.setTimeout(30000); // Increase for CI environment
```

## Domain and DNS Issues

### Custom Domain Not Working

**Frontend (Vercel):**
1. Add domain in Vercel dashboard
2. Update DNS:
   ```
   A     novarafertility.com      76.76.21.21
   CNAME www.novarafertility.com  cname.vercel-dns.com
   ```
3. Wait for propagation (5-30 minutes)

**Backend API Subdomain:**
1. Add custom domain in Railway
2. Get CNAME target from Railway
3. Update DNS:
   ```
   CNAME api.novarafertility.com  your-app.up.railway.app
   ```

### SSL Certificate Issues

**Vercel:** Automatic SSL provisioning
**Railway:** Automatic via Let's Encrypt

**If SSL fails:**
- Check DNS is properly configured
- Wait for propagation
- Remove and re-add domain

## Quick Diagnostic Commands

### Health Checks
```bash
# Frontend
curl https://novarafertility.com

# Backend
curl https://novara-mvp-production.up.railway.app/api/health

# With timing
curl -w "@curl-format.txt" -o /dev/null -s https://your-api/health
```

### DNS Verification
```bash
# Check A records
dig novarafertility.com

# Check CNAME
dig www.novarafertility.com

# Trace DNS resolution
dig +trace novarafertility.com
```

### Log Analysis
```bash
# Railway logs (from dashboard)
# Filter for errors
grep -i error

# Vercel logs (from dashboard)
# Function logs → Filter by level
```

## Emergency Procedures

### Rollback Deployment

**Frontend (Vercel):**
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

**Backend (Railway):**
1. Railway Dashboard → Deployments
2. Find previous deployment
3. Rollback or redeploy

**Via Git:**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main  # Use with caution
```

### Emergency Environment Variables

**Quick CORS Fix:**
```env
CORS_ORIGIN=*  # TEMPORARY ONLY - Security risk!
```

**Debug Mode:**
```env
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true
DEBUG_CORS=true
```

## Performance Issues

### Slow API Response

1. Check Railway metrics
2. Enable query logging
3. Add indexes to database
4. Implement caching

### High Memory Usage

1. Check for memory leaks
2. Implement connection pooling
3. Optimize queries
4. Scale Railway service

## Monitoring

### Setup Alerts

**Railway:**
- Set up health check monitors
- Configure deployment notifications

**Vercel:**
- Enable email notifications
- Set up webhook integrations

### Key Metrics to Monitor
- Response time (< 200ms ideal)
- Error rate (< 1%)
- Memory usage (< 80%)
- Database connections

---

Last Updated: July 31, 2025