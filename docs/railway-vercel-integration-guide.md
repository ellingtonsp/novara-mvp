# Railway-Vercel Integration Guide

## Overview

This guide documents two approaches for connecting your Vercel frontend with your Railway backend, based on industry best practices and your current project architecture.

## Current Setup Analysis

**Status:** ✅ **Option 2 (Direct Railway Calls) - Currently Implemented**
**Update:** ✅ **Automatic Vercel Preview URL Detection - Now Implemented**

Your project successfully uses direct API calls to Railway with:
- Environment-specific URL management in `frontend/src/lib/environment.ts`
- Automatic Vercel preview deployment detection using `VITE_VERCEL_ENV`
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
const getEnvironment = (): string => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_ENV) {
    return import.meta.env.VITE_ENV;
  }
  
  // Use Vercel's automatic environment detection if available
  if (import.meta.env.VITE_VERCEL_ENV) {
    // VITE_VERCEL_ENV can be 'production', 'preview', or 'development'
    return import.meta.env.VITE_VERCEL_ENV;
  }
  
  // Fall back to NODE_ENV
  if (import.meta.env.MODE === 'development') {
    return 'development';
  }
  
  // Check for staging indicators (for manual staging deployments)
  if (window.location.hostname.includes('staging') || 
      window.location.hostname.includes('git-staging')) {
    return 'staging';
  }
  
  // Check if we're on a vercel.app domain (likely a preview)
  if (typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app')) {
    return 'preview';
  }
  
  // Default to production
  return 'production';
};

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
    case 'preview':
      // For Vercel preview deployments, use staging backend
      // You can enhance this to use dynamic Railway preview URLs if needed
      return 'https://novara-staging-staging.up.railway.app';
    case 'production':
    default:
      return 'https://novara-mvp-production.up.railway.app';
  }
};
```

**Pros:**
- ✅ Already working in production
- ✅ Clean environment detection logic with automatic Vercel preview detection
- ✅ Direct connection (no proxy latency)
- ✅ CORS properly configured
- ✅ Automatic preview URL detection using Vercel's built-in environment variables

**Cons:**
- Railway URL exposed to browser
- Environment-specific URL management needed

## ✅ Automatic Vercel Preview URL Detection (Implemented)

Your project now automatically detects Vercel preview deployments using Vercel's built-in environment variables. This solves the "preview URL detection" challenge mentioned in the ChatGPT advice.

### How It Works

1. **Vercel Environment Variables**: Vercel automatically provides `VITE_VERCEL_ENV` which can be:
   - `production` - Production deployments
   - `preview` - Preview deployments (branch pushes, PRs)
   - `development` - Local development

2. **Fallback Detection**: If Vercel variables aren't available, the system falls back to:
   - Hostname checking for `.vercel.app` domains
   - Manual staging indicators
   - Development mode detection

### Configuration Required

To enable this feature, you need to enable system environment variables in your Vercel project:

1. Go to your Vercel Dashboard → Project Settings
2. Navigate to Environment Variables
3. Check **"Automatically expose System Environment Variables"**

This automatically provides variables like:
- `VITE_VERCEL_ENV` - Environment type
- `VITE_VERCEL_URL` - Current deployment URL
- `VITE_VERCEL_BRANCH_URL` - Branch-specific URL
- `VITE_VERCEL_GIT_COMMIT_REF` - Current branch name

### Implementation Details

```typescript
// Environment detection priority:
// 1. Explicit VITE_ENV override
// 2. Vercel's VITE_VERCEL_ENV (automatic)
// 3. Development mode detection
// 4. Manual staging hostname detection
// 5. Vercel.app domain detection
// 6. Default to production

// API URL mapping:
// - development → http://localhost:9002
// - staging → https://novara-staging-staging.up.railway.app
// - preview → https://novara-staging-staging.up.railway.app (uses staging backend)
// - production → https://novara-mvp-production.up.railway.app
```

### Benefits

- ✅ **Automatic Detection**: No manual URL configuration for previews
- ✅ **Branch-Specific**: Each PR gets proper environment detection
- ✅ **Debugging Support**: Enhanced logging for preview deployments
- ✅ **Fallback Safety**: Works even without Vercel environment variables

### Debugging

Preview deployments now include enhanced logging. Check browser console for:

```javascript
🌍 Environment Configuration: {
  environment: "preview",
  apiUrl: "https://novara-staging-staging.up.railway.app",
  hostname: "novara-mvp-git-feature-branch.vercel.app",
  viteVercelEnv: "preview",
  viteVercelUrl: "novara-mvp-git-feature-branch.vercel.app",
  viteVercelBranchUrl: "novara-mvp-git-feature-branch.vercel.app",
  viteVercelGitCommitRef: "feature-branch"
}
```

## Automation Enhancements (Additional Options)

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

**✅ Keep Enhanced Option 2 (Current Setup + Auto Preview Detection)** because:

1. ✅ **Production Ready:** Already working reliably in production
2. ✅ **Clean Architecture:** Your environment.ts provides excellent abstraction
3. ✅ **Team Familiarity:** Established patterns and debugging processes
4. ✅ **Performance:** Direct connection without proxy overhead
5. ✅ **NEW: Auto Preview Detection:** Automatically handles Vercel preview URLs
6. ✅ **NEW: Enhanced Debugging:** Better visibility into environment detection

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

Your implementation now combines the best of both worlds: the production-ready direct Railway approach with automatic Vercel preview URL detection. This addresses the core challenge from the ChatGPT advice while maintaining your established architecture.

**Key Achievements:**
- ✅ Automatic preview URL detection implemented
- ✅ Enhanced debugging for all environments
- ✅ Backward compatibility maintained
- ✅ Production stability preserved

The advice you shared from ChatGPT is excellent for teams setting up new projects or those experiencing CORS issues. For Novara MVP, you now have an enhanced version that automatically handles preview URLs while maintaining the performance and reliability of direct API calls.

**Next Steps:**
1. Enable "Automatically expose System Environment Variables" in Vercel
2. Test the new preview detection on your next PR
3. Monitor the enhanced debugging logs for any issues

---

**Last Updated:** January 2025
**Status:** Enhanced Production Implementation
**Related Files:** 
- `frontend/src/lib/environment.ts` (✅ Updated with auto-detection)
- `frontend/src/lib/api.ts`
- `vercel.json`
- `docs/railway-vercel-integration-guide.md` (This file)