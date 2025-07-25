# Railway-Vercel Integration Guide

## Overview

This guide documents two approaches for connecting your Vercel frontend with your Railway backend, based on industry best practices and your current project architecture.

## Current Setup Analysis

**Status:** ✅ **Option 2 (Direct Railway Calls) - Currently Implemented**

Your project successfully uses direct API calls to Railway with:
- Environment-specific URL management in `frontend/src/lib/environment.ts`
- Consistent API client pattern in `frontend/src/lib/api.ts`
- Proper CORS configuration on Railway backend
- JWT authentication working across origins

## Integration Options

### Option 1: Reverse-Proxy Through Vercel (Recommended for New Projects)

**When to choose:** Single origin preference, edge caching needs, zero CORS complexity

**Implementation:**
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://${RAILWAY_API_HOST}/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Environment Variables Needed:**
```bash
# Vercel Environment Variables
RAILWAY_API_HOST=novara-mvp-production.up.railway.app  # Production
RAILWAY_API_HOST=novara-staging-production.up.railway.app  # Preview
```

**Frontend Code Changes:**
```typescript
// Simplified API calls - no environment detection needed
const response = await fetch('/api/users', options);
```

**Pros:**
- Single origin (no CORS issues)
- Edge caching through Vercel
- Railway URL hidden from browser
- Simpler frontend code

**Cons:**
- Additional Vercel configuration complexity
- Extra network hop through Vercel
- Environment variable management across platforms

### Option 2: Direct Railway Calls (Current Implementation)

**When to choose:** Current setup working well, team comfortable with CORS, environment management already established

**Current Implementation:**
```typescript
// frontend/src/lib/environment.ts
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const env = getEnvironment();
  switch (env) {
    case 'development':
      return 'http://localhost:9002';
    case 'staging':
      return 'https://novara-staging-staging.up.railway.app';
    case 'production':
    default:
      return 'https://novara-mvp-production.up.railway.app';
  }
};
```

**Pros:**
- ✅ Already working in production
- ✅ Clean environment detection logic
- ✅ Direct connection (no proxy latency)
- ✅ CORS properly configured

**Cons:**
- Railway URL exposed to browser
- Environment-specific URL management needed

## Automation Enhancements (Recommended)

### GitHub Actions Integration

For automated environment variable management:

```yaml
# .github/workflows/deploy.yml
- name: Deploy backend to Railway
  uses: railwayapp/cli@v2
  id: backend
  with:
    command: up

- name: Get Railway URL
  run: |
    RAILWAY_URL=$(railway status --json | jq -r '.services[0].publicDomain')
    echo "RAILWAY_URL=https://$RAILWAY_URL" >> $GITHUB_ENV

- name: Deploy frontend to Vercel
  run: |
    npx vercel --token $VERCEL_TOKEN \
      --build-env VITE_API_URL=$RAILWAY_URL
```

### Environment Variable Templates

Update your environment examples to support both approaches:

```bash
# frontend/env.production.example
# Option 1: Reverse Proxy (use relative URLs)
VITE_API_URL=/api

# Option 2: Direct Calls (use full Railway URL)
VITE_API_URL=https://novara-mvp-production.up.railway.app
```

## Recommendation for Your Project

**Keep Option 2 (Current Setup)** because:

1. ✅ **Production Ready:** Already working reliably in production
2. ✅ **Clean Architecture:** Your environment.ts provides excellent abstraction
3. ✅ **Team Familiarity:** Established patterns and debugging processes
4. ✅ **Performance:** Direct connection without proxy overhead

**Consider Option 1 for future projects** or if you encounter:
- CORS complexities with new features
- Need for edge caching
- Security requirements to hide backend URL

## Implementation Steps (If Switching to Option 1)

If you decide to implement Option 1 in the future:

1. **Update vercel.json:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://${RAILWAY_API_HOST}/:path*"
       }
     ]
   }
   ```

2. **Set Vercel Environment Variables:**
   - Production: `RAILWAY_API_HOST=novara-mvp-production.up.railway.app`
   - Preview: `RAILWAY_API_HOST=novara-staging-production.up.railway.app`

3. **Update environment.ts:**
   ```typescript
   const getApiUrl = (): string => {
     // Always use relative URLs when using Vercel proxy
     return '';  // This makes all calls relative to current origin
   };
   ```

4. **Test thoroughly:**
   - Verify auth flows still work
   - Check all API endpoints
   - Test in preview environments

## Monitoring & Debugging

### Current Setup (Option 2)
```bash
# Test direct Railway connection
curl https://novara-mvp-production.up.railway.app/api/health

# Test frontend
curl https://novara-mvp.vercel.app
```

### With Proxy (Option 1)
```bash
# Test proxied API calls
curl https://novara-mvp.vercel.app/api/health

# Check Vercel function logs for proxy issues
```

## Conclusion

Your current implementation follows industry best practices and is production-ready. The advice you shared from ChatGPT is excellent for teams setting up new projects or those experiencing CORS issues. 

For Novara MVP, maintain the current approach and consider the automation enhancements for improved CI/CD workflows.

---

**Last Updated:** January 2025
**Status:** Production Guidance
**Related Files:** 
- `frontend/src/lib/environment.ts`
- `frontend/src/lib/api.ts`
- `vercel.json`