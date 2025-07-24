# Cache Clearing Fix Deployment Guide

## Problem
iPhone users are experiencing cache issues where they see outdated content even after app updates. This is a common PWA issue where the service worker cache doesn't automatically update.

## Solution Implemented
1. **Version-based cache management** - Updated service worker to use versioned cache names
2. **Manual cache clearing** - Added "Clear Cache" button in mobile menu
3. **Automatic cache detection** - App checks for outdated caches on load
4. **Console cache clearing script** - Standalone script for manual cache clearing

## Files Modified
- `frontend/public/sw.js` - Updated cache version and improved cache management
- `frontend/src/utils/pwa.ts` - Added cache clearing functions
- `frontend/src/components/NovaraLanding.tsx` - Added cache clearing UI
- `frontend/src/App.tsx` - Added automatic cache checking
- `frontend/public/cache-clear.js` - Standalone cache clearing script

## Deployment Steps

### 1. Deploy to Staging First
```bash
# Follow the established DevOps plan
git checkout development
git add .
git commit -m "Add cache clearing functionality for iPhone PWA issues"
git push origin development

# Create PR to staging
./scripts/create-pr.sh development staging

# Deploy to staging
./scripts/deploy-staging.sh
```

### 2. Test on Staging
- [ ] Test cache clearing button on iPhone
- [ ] Verify automatic cache detection works
- [ ] Check console cache clearing script
- [ ] Test service worker updates

### 3. Deploy to Production
```bash
# After staging validation
git checkout staging
git merge development
git push origin staging

# Create PR to main
./scripts/create-pr.sh staging main

# Deploy to production
./scripts/deploy-production.sh
```

## User Instructions for Cache Issues

### For iPhone Users Experiencing Issues:

#### Option 1: Use the Clear Cache Button
1. Open the Novara app
2. Log in to your account
3. Tap the menu button (☰) in the top right
4. Tap "Clear Cache"
5. Wait for the app to reload

#### Option 2: Manual Browser Cache Clear
1. Open Safari on iPhone
2. Go to Settings > Safari > Advanced > Website Data
3. Find "novara" and tap "Remove All Website Data"
4. Reload the app

#### Option 3: Reinstall PWA
1. Remove the Novara app from your home screen
2. Go to the website in Safari
3. Tap the share button (square with arrow)
4. Tap "Add to Home Screen"
5. Open the newly installed app

### For Technical Users:
Run this in the browser console:
```javascript
// Load the cache clearing script
fetch('/cache-clear.js').then(r => r.text()).then(eval);
```

## Monitoring

### Success Indicators
- Reduced support tickets about outdated content
- Users successfully using the Clear Cache button
- No cache-related errors in console logs
- Consistent content across devices

### Failure Indicators
- Users still reporting outdated content
- Cache clearing button not working
- Service worker update failures
- Performance degradation

## Rollback Plan
If issues occur:
1. Revert to previous cache version in `sw.js`
2. Remove cache clearing UI from `NovaraLanding.tsx`
3. Deploy hotfix to production
4. Investigate root cause

## Future Improvements
- Add cache version to app manifest
- Implement background cache updates
- Add cache status indicator in UI
- Create automated cache health monitoring 