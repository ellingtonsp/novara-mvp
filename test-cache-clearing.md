# Cache Clearing Testing Script

## Overview
This script tests the cache clearing functionality to resolve iPhone PWA issues where users see outdated content.

## Pre-Test Setup
1. Deploy the updated code with cache version `novara-v1.1.0`
2. Ensure the app is accessible on both desktop and mobile devices
3. Have access to browser developer tools

## Test Scenarios

### Test 1: Manual Cache Clearing via UI
**Steps:**
1. Open Novara app on iPhone
2. Log in to the application
3. Tap the menu button (hamburger icon) in the top right
4. Look for "Clear Cache" button in the dropdown menu
5. Tap "Clear Cache" button
6. Wait for the loading spinner to complete

**Expected Results:**
- ✅ "Clear Cache" button appears in mobile menu
- ✅ Button shows loading spinner when tapped
- ✅ Alert appears: "Cache cleared successfully! The app will reload to apply changes."
- ✅ Page automatically reloads
- ✅ App loads with fresh content (no cached data)

**Failure Results:**
- ❌ "Clear Cache" button not visible in menu
- ❌ Button doesn't respond when tapped
- ❌ Error message appears instead of success
- ❌ Page doesn't reload automatically
- ❌ App still shows cached/outdated content

### Test 2: Automatic Cache Version Detection
**Steps:**
1. Open Novara app on iPhone
2. Check browser console for cache status messages
3. Look for automatic cache clearing on app load

**Expected Results:**
- ✅ Console shows: "PWA initialized with capabilities: {...}"
- ✅ Console shows: "Cache status: [...]"
- ✅ If outdated cache detected: "Outdated cache detected, clearing..."
- ✅ Console shows: "Cache cleared due to version mismatch"

**Failure Results:**
- ❌ No PWA initialization messages in console
- ❌ No cache status check performed
- ❌ Outdated cache not detected or cleared
- ❌ Error messages in console

### Test 3: Browser Console Cache Clearing
**Steps:**
1. Open Novara app on iPhone
2. Open Safari Developer Tools (if available) or use desktop Safari with iPhone simulation
3. Navigate to Console tab
4. Run the cache clearing script manually
5. Check for console output

**Expected Results:**
- ✅ Console shows: "🔄 Novara Cache Clearing Script"
- ✅ Console shows: "📋 Found caches: [...]"
- ✅ Console shows: "🗑️ Deleting cache: [cache names]"
- ✅ Console shows: "✅ All caches cleared successfully"
- ✅ Console shows: "🔧 Found service workers: [count]"
- ✅ Console shows: "✅ All service workers unregistered"
- ✅ Console shows: "🎉 Cache clearing complete! Reloading page..."
- ✅ Page automatically reloads

**Failure Results:**
- ❌ Script doesn't run or shows errors
- ❌ No cache deletion messages
- ❌ Service workers not unregistered
- ❌ Page doesn't reload automatically

### Test 4: Service Worker Update Detection
**Steps:**
1. Deploy a new version with updated cache version (e.g., `novara-v1.1.1`)
2. Open the app on iPhone
3. Check if service worker detects the update

**Expected Results:**
- ✅ Service worker detects new version
- ✅ Console shows: "Service Worker installing... novara-v1.1.1"
- ✅ Console shows: "Service Worker activating... novara-v1.1.1"
- ✅ Old caches are automatically deleted
- ✅ New caches are created with updated version

**Failure Results:**
- ❌ Service worker doesn't detect new version
- ❌ Old caches remain active
- ❌ No cache version update occurs

### Test 5: Cross-Device Cache Consistency
**Steps:**
1. Clear cache on iPhone using the UI button
2. Open the same app on desktop browser
3. Check if both devices show the same content
4. Perform the same action on both devices

**Expected Results:**
- ✅ Both devices show identical content
- ✅ Actions performed on one device reflect on the other
- ✅ No cache-related inconsistencies between devices

**Failure Results:**
- ❌ Different content shown on different devices
- ❌ Actions don't sync between devices
- ❌ Cache clearing on one device affects the other

## Verification Checklist

### Cache Clearing Functionality
- [ ] Manual cache clearing button works
- [ ] Automatic cache version detection works
- [ ] Service worker updates properly
- [ ] All cache types are cleared (static, dynamic, IndexedDB)
- [ ] Page reloads after cache clearing

### User Experience
- [ ] Clear visual feedback during cache clearing
- [ ] No broken functionality after cache clear
- [ ] App loads faster after cache clear (fresh content)
- [ ] No error messages during normal operation

### Technical Implementation
- [ ] Cache version is properly incremented
- [ ] Service worker handles cache updates correctly
- [ ] PWA initialization includes cache checking
- [ ] Console logging provides useful debugging info

## Troubleshooting Steps

### If Cache Clearing Doesn't Work:
1. Check browser console for error messages
2. Verify service worker is registered: `navigator.serviceWorker.getRegistrations()`
3. Check cache status: `caches.keys()`
4. Try manual cache clearing script in console
5. Clear browser data manually if needed

### If App Still Shows Old Content:
1. Force refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Hard reload: Cmd+Option+R (Mac) or Ctrl+Shift+Delete (Windows)
3. Clear all browser data for the site
4. Check if service worker is controlling the page

### If iPhone-Specific Issues Persist:
1. Test in Safari private browsing mode
2. Check if PWA is installed (remove and reinstall)
3. Verify iOS version supports required PWA features
4. Test on different iPhone models/OS versions

## Success Criteria
- ✅ Cache clearing resolves iPhone display issues
- ✅ Users can manually clear cache when needed
- ✅ Automatic cache updates work seamlessly
- ✅ No performance degradation from cache management
- ✅ Cross-device consistency maintained

## Failure Criteria
- ❌ iPhone users still see outdated content
- ❌ Cache clearing causes app crashes
- ❌ Manual cache clearing doesn't work
- ❌ Automatic updates fail silently
- ❌ Performance significantly degraded 