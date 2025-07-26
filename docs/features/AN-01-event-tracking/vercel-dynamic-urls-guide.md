# Vercel Dynamic Preview URLs with PostHog - AN-01 Event Tracking

## Overview

This guide explains how to properly configure PostHog to work with Vercel's dynamic preview URLs and provides best practices for the AN-01 Event Tracking Instrumentation on Vercel.

**Reference**: [PostHog Vercel Documentation](https://posthog.com/docs/libraries/vercel)

## Vercel Dynamic Preview URL Challenge

Vercel generates unique preview URLs for each deployment:
- **Production**: `https://novara-mvp.vercel.app`
- **Staging**: `https://novara-bd6xsx1ru-novara-fertility.vercel.app`
- **Preview**: `https://novara-abc123-novara-fertility.vercel.app` (dynamic)

These dynamic URLs can cause issues with PostHog's "Toolbar Authorized URLs" and "Web Analytics Domains" settings.

## Solution: Wildcard Domain Configuration

### 1. PostHog Project Settings

In your PostHog project settings, add these patterns to **both** "Toolbar Authorized URLs" and "Web Analytics Domains":

```
https://novara-mvp.vercel.app
https://*.vercel.app
https://localhost:4200
```

**Explanation**:
- `https://novara-mvp.vercel.app` - Production URL
- `https://*.vercel.app` - Wildcard for all Vercel preview URLs
- `https://localhost:4200` - Local development

### 2. Environment Variable Configuration

Our refactored implementation automatically detects Vercel environments using these environment variables:

```bash
# Vercel automatically injects these
VITE_VERCEL_ENV=preview|production|development
VITE_VERCEL_URL=https://novara-abc123-novara-fertility.vercel.app
VITE_VERCEL_BRANCH_URL=https://novara-abc123-novara-fertility.vercel.app
VITE_VERCEL_GIT_COMMIT_REF=feature-branch-name
```

## Refactored Implementation Features

### 1. Vercel Environment Detection

```typescript
const isVercelEnvironment = (): boolean => {
  return !!(
    import.meta.env.VITE_VERCEL_ENV ||
    import.meta.env.VITE_VERCEL_URL ||
    import.meta.env.VITE_VERCEL_BRANCH_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app'))
  );
};
```

### 2. Vercel-Optimized Configuration

```typescript
// Vercel-specific optimizations
if (isVercelEnvironment()) {
  return {
    ...baseConfig,
    // Optimize for Vercel's edge network
    disable_compression: false, // Enable compression for better performance
    xhr_headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Vercel-Environment': import.meta.env.VITE_VERCEL_ENV || 'unknown'
    },
    // Better error handling for Vercel's serverless environment
    loaded: (posthog: any) => {
      // Set user properties for Vercel environment
      posthog.people.set({
        vercel_environment: import.meta.env.VITE_VERCEL_ENV || 'unknown',
        vercel_url: import.meta.env.VITE_VERCEL_URL || 'unknown',
        deployment_type: 'vercel'
      });
    }
  };
}
```

### 3. Enhanced Event Tracking

All events now include Vercel-specific properties:

```typescript
const enrichedPayload = {
  ...payload,
  environment: environmentConfig.environment,
  timestamp: new Date().toISOString(),
  // Vercel-specific properties
  ...(isVercelEnvironment() && {
    vercel_environment: import.meta.env.VITE_VERCEL_ENV || 'unknown',
    vercel_url: import.meta.env.VITE_VERCEL_URL || 'unknown',
    vercel_branch_url: import.meta.env.VITE_VERCEL_BRANCH_URL || 'unknown',
    vercel_git_commit_ref: import.meta.env.VITE_VERCEL_GIT_COMMIT_REF || 'unknown'
  })
};
```

## Testing Vercel Integration

### 1. Local Development Testing

```bash
# Start local development
./scripts/start-dev-stable.sh

# Check PostHog initialization logs
# Should see: "PostHog enabled in development mode for testing"
```

### 2. Staging Environment Testing

```bash
# Deploy to staging
cd frontend && vercel --target staging

# Test the staging URL
# Should see: "PostHog initialized successfully on Vercel"
```

### 3. Preview Deployment Testing

```bash
# Create a feature branch and push
git checkout -b feature/test-posthog
git push origin feature/test-preview

# Vercel will create a preview deployment
# Test the preview URL with PostHog Activity
```

## Troubleshooting Vercel + PostHog Issues

### Issue: Events Not Appearing in PostHog Activity

**Symptoms**: Only "web activity" appears, no specific AN-01 events

**Solutions**:
1. **Check PostHog Settings**:
   - Verify `https://*.vercel.app` is in "Toolbar Authorized URLs"
   - Verify `https://*.vercel.app` is in "Web Analytics Domains"
   - Ensure "Enable autocapture for web" is checked

2. **Check Environment Variables**:
   ```bash
   # Verify Vercel environment variables are set
   echo $VITE_VERCEL_ENV
   echo $VITE_VERCEL_URL
   ```

3. **Check Browser Console**:
   - Look for PostHog initialization logs
   - Check for any 401/403 errors
   - Verify events are being sent

### Issue: Wrong Environment Detection

**Symptoms**: Events tagged with wrong environment

**Solutions**:
1. **Check Vercel Environment Variables**:
   ```bash
   vercel env ls
   ```

2. **Verify Environment Detection**:
   ```javascript
   // In browser console
   console.log('Vercel Environment:', import.meta.env.VITE_VERCEL_ENV);
   console.log('Vercel URL:', import.meta.env.VITE_VERCEL_URL);
   ```

### Issue: Performance Problems

**Symptoms**: Slow event tracking or timeouts

**Solutions**:
1. **Enable Compression**: Our implementation enables compression for Vercel
2. **Check Network**: Verify Vercel's edge network is working
3. **Monitor Bundle Size**: Ensure PostHog isn't bloating the bundle

## Best Practices for Vercel + PostHog

### 1. Environment-Specific Configuration

```typescript
// Use different configurations for different environments
if (isVercelEnvironment()) {
  // Production-optimized settings
  disable_compression: false,
  xhr_headers: { /* Vercel-specific headers */ }
} else if (environmentConfig.isDevelopment) {
  // Development-friendly settings
  disable_compression: true,
  xhr_headers: { /* Debug headers */ }
}
```

### 2. Error Handling

```typescript
// Robust error handling for Vercel's serverless environment
try {
  posthog.capture(event, enrichedPayload);
} catch (error) {
  console.error('Failed to track event:', event, error);
  // Don't let PostHog errors break the app
}
```

### 3. Performance Optimization

```typescript
// Use appropriate compression settings
disable_compression: isVercelEnvironment() ? false : true,
```

### 4. Privacy Compliance

```typescript
// Respect user privacy settings
respect_dnt: true,
disable_session_recording: true,
autocapture: false,
```

## Monitoring and Debugging

### 1. Environment Logging

Our implementation provides detailed environment logging:

```typescript
console.log('🌍 Initializing PostHog with environment:', {
  environment: environmentConfig.environment,
  isVercel: isVercelEnvironment(),
  vercelEnv: import.meta.env.VITE_VERCEL_ENV,
  vercelUrl: import.meta.env.VITE_VERCEL_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
});
```

### 2. Event Debugging

```typescript
// Development mode provides detailed event logging
console.debug('📊 PH-DEV Event:', event, enrichedPayload);
```

### 3. PostHog Activity Monitoring

- Check PostHog Activity view for real-time events
- Monitor event properties for Vercel-specific data
- Verify user identification is working correctly

## Deployment Checklist

### Before Deploying to Vercel

- [ ] PostHog wildcard domains configured (`https://*.vercel.app`)
- [ ] Environment variables set in Vercel dashboard
- [ ] Local testing completed
- [ ] Staging testing completed

### After Deploying to Vercel

- [ ] Verify PostHog initialization logs
- [ ] Test AN-01 events in PostHog Activity
- [ ] Check event properties for Vercel data
- [ ] Monitor for any errors in browser console

## Related Documentation

- [AN-01 Event Tracking Implementation](./README.md)
- [PostHog Dashboard Setup](./posthog-dashboard-setup.md)
- [Testing Guide](../test/integration/test-AN-01-comprehensive.md)
- [Vercel Environment Setup](../../vercel-git-branch-setup.md)

## Support

If you encounter issues with Vercel + PostHog integration:

1. Check this troubleshooting guide
2. Review PostHog Vercel documentation
3. Check browser console for detailed error messages
4. Verify environment variable configuration
5. Test with different Vercel environments (preview, production) 