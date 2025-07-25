#!/usr/bin/env node

/**
 * PostHog Debug Script for Staging Environment
 * This script helps debug AN-01 event tracking issues
 */

console.log('🔍 PostHog AN-01 Event Tracking Debug');
console.log('=====================================');

console.log('\n📋 Instructions:');
console.log('1. Open staging site: https://novara-ny598g1wo-novara-fertility.vercel.app');
console.log('2. Open browser console (F12)');
console.log('3. Run these commands one by one:');
console.log('');

console.log('🔧 Debug Commands to Run in Browser Console:');
console.log('============================================');

console.log('\n1. Check PostHog initialization:');
console.log('console.log("PostHog loaded:", window.posthog);');
console.log('console.log("PostHog API key:", window.posthog?.__loaded);');
console.log('console.log("PostHog distinct ID:", window.posthog?.get_distinct_id());');

console.log('\n2. Check environment variables:');
console.log('console.log("VITE_POSTHOG_API_KEY:", import.meta.env.VITE_POSTHOG_API_KEY);');
console.log('console.log("VITE_ENABLE_ANALYTICS:", import.meta.env.VITE_ENABLE_ANALYTICS);');
console.log('console.log("VITE_ENV:", import.meta.env.VITE_ENV);');

console.log('\n3. Test manual event tracking:');
console.log('window.posthog?.capture("test_event", { test: true, environment: "staging" });');

console.log('\n4. Check network requests:');
console.log('- Go to Network tab in DevTools');
console.log('- Filter by "posthog" or "app.posthog.com"');
console.log('- Look for POST requests to PostHog API');
console.log('- Check if requests have 200 status');

console.log('\n5. Check for errors:');
console.log('- Look for any 401/403 errors in console');
console.log('- Look for any PostHog-related errors');

console.log('\n🎯 Expected Results:');
console.log('===================');
console.log('✅ PostHog should be loaded and initialized');
console.log('✅ API key should be present (not undefined)');
console.log('✅ Distinct ID should be generated');
console.log('✅ Environment should be "staging"');
console.log('✅ Network requests to PostHog should succeed (200)');
console.log('✅ No 401/403 authentication errors');

console.log('\n🚨 Common Issues:');
console.log('================');
console.log('❌ "PostHog loaded: undefined" - PostHog not initialized');
console.log('❌ "API key: undefined" - Missing or invalid API key');
console.log('❌ 401/403 errors - Authentication issues');
console.log('❌ No network requests - Events not being sent');
console.log('❌ Wrong environment - Events tagged incorrectly');

console.log('\n📊 PostHog Dashboard Check:');
console.log('==========================');
console.log('1. Go to https://app.posthog.com');
console.log('2. Navigate to Activity (left sidebar menu)');
console.log('3. Filter by: environment = "staging"');
console.log('4. Look for specific event names:');
console.log('   - signup');
console.log('   - checkin_submitted');
console.log('   - insight_viewed');
console.log('   - share_action');
console.log('5. Check event properties for correct user_id and environment');

console.log('\n🔧 If Events Still Not Appearing:');
console.log('==================================');
console.log('1. Check PostHog project settings');
console.log('2. Verify API key is correct');
console.log('3. Check if events are being filtered out');
console.log('4. Try creating a new test event manually');
console.log('5. Check PostHog project permissions');

console.log('\n📝 Next Steps:');
console.log('==============');
console.log('1. Run the debug commands above');
console.log('2. Share the console output');
console.log('3. Check PostHog Activity');
console.log('4. Report any errors found'); 