#!/usr/bin/env node

/**
 * PostHog Staging Debug Script - Vercel Optimized
 * 
 * This script provides browser console commands to debug PostHog integration
 * on the staging deployment with the new Vercel-optimized implementation.
 * 
 * Usage: Run these commands in the browser console on:
 * https://novara-n7lbdrvea-novara-fertility.vercel.app
 */

console.log('🔍 PostHog Vercel Debug Commands');
console.log('================================');
console.log('');
console.log('📋 Copy and paste these commands into your browser console:');
console.log('');

console.log('1️⃣ Check PostHog API Key:');
console.log('console.log("PostHog API Key:", import.meta.env.VITE_POSTHOG_API_KEY ? "✅ Set" : "❌ Missing");');
console.log('');

console.log('2️⃣ Check Vercel Environment Variables:');
console.log('console.log("Vercel Environment:", import.meta.env.VITE_VERCEL_ENV || "unknown");');
console.log('console.log("Vercel URL:", import.meta.env.VITE_VERCEL_URL || "unknown");');
console.log('console.log("Vercel Branch URL:", import.meta.env.VITE_VERCEL_BRANCH_URL || "unknown");');
console.log('console.log("Vercel Git Commit Ref:", import.meta.env.VITE_VERCEL_GIT_COMMIT_REF || "unknown");');
console.log('');

console.log('3️⃣ Check PostHog Initialization:');
console.log('console.log("PostHog Object:", window.posthog);');
console.log('console.log("PostHog Distinct ID:", window.posthog?.get_distinct_id());');
console.log('console.log("PostHog Config:", window.posthog?.config);');
console.log('');

console.log('4️⃣ Test PostHog Event Tracking:');
console.log('window.posthog?.capture("test_vercel_integration", {');
console.log('  test_property: "vercel_staging_test",');
console.log('  timestamp: new Date().toISOString(),');
console.log('  environment: "staging",');
console.log('  vercel_environment: import.meta.env.VITE_VERCEL_ENV || "unknown"');
console.log('});');
console.log('');

console.log('5️⃣ Check AN-01 Event Tracking:');
console.log('// Test signup event');
console.log('window.posthog?.capture("signup", {');
console.log('  user_id: "test_user_vercel",');
console.log('  signup_method: "email",');
console.log('  vercel_environment: import.meta.env.VITE_VERCEL_ENV || "unknown",');
console.log('  vercel_url: import.meta.env.VITE_VERCEL_URL || "unknown"');
console.log('});');
console.log('');

console.log('6️⃣ Check Network Requests:');
console.log('// Open Network tab and filter by "posthog" or "us.i.posthog.com"');
console.log('// Look for requests to: https://us.i.posthog.com/capture/');
console.log('');

console.log('7️⃣ Test User Identification:');
console.log('window.posthog?.identify("test_user_vercel", {');
console.log('  email: "test@vercel.com",');
console.log('  vercel_environment: import.meta.env.VITE_VERCEL_ENV || "unknown",');
console.log('  deployment_type: "vercel"');
console.log('});');
console.log('');

console.log('8️⃣ Check for Errors:');
console.log('// Look in Console tab for any PostHog-related errors');
console.log('// Common issues:');
console.log('// - "PostHog API key not found"');
console.log('// - "Failed to initialize PostHog"');
console.log('// - Network errors to us.i.posthog.com');
console.log('');

console.log('9️⃣ Verify PostHog Activity:');
console.log('// 1. Go to your PostHog project');
console.log('// 2. Navigate to Activity view');
console.log('// 3. Look for events from the staging URL');
console.log('// 4. Check event properties for Vercel data');
console.log('');

console.log('🔧 Troubleshooting Steps:');
console.log('========================');
console.log('');

console.log('If PostHog is not working:');
console.log('1. Check if VITE_POSTHOG_API_KEY is set correctly');
console.log('2. Verify PostHog project settings include:');
console.log('   - Toolbar Authorized URLs: https://*.vercel.app');
console.log('   - Web Analytics Domains: https://*.vercel.app');
console.log('3. Check browser console for initialization errors');
console.log('4. Verify network requests to us.i.posthog.com');
console.log('5. Test with a simple event in PostHog Activity');
console.log('');

console.log('📊 Expected Behavior:');
console.log('====================');
console.log('');

console.log('✅ Success Indicators:');
console.log('- Console shows "PostHog initialized successfully on Vercel"');
console.log('- Network tab shows requests to us.i.posthog.com/capture/');
console.log('- PostHog Activity shows events with Vercel properties');
console.log('- Events include vercel_environment, vercel_url properties');
console.log('');

console.log('❌ Failure Indicators:');
console.log('- No PostHog initialization logs');
console.log('- Console errors about PostHog API key');
console.log('- Network errors to us.i.posthog.com');
console.log('- Events not appearing in PostHog Activity');
console.log('');

console.log('🚀 Next Steps:');
console.log('==============');
console.log('');

console.log('1. Run the debug commands above');
console.log('2. Check PostHog Activity for events');
console.log('3. Verify PostHog project settings');
console.log('4. Test AN-01 events (signup, checkin_submitted, etc.)');
console.log('5. Monitor for any errors in browser console');
console.log('');

console.log('📞 If issues persist:');
console.log('- Check PostHog project settings');
console.log('- Verify environment variables');
console.log('- Test with different browsers');
console.log('- Check PostHog documentation for troubleshooting');
console.log('');

console.log('🔗 Useful Links:');
console.log('================');
console.log('- PostHog Activity: https://us.posthog.com/activity');
console.log('- PostHog Vercel Docs: https://posthog.com/docs/libraries/vercel');
console.log('- Staging URL: https://novara-n7lbdrvea-novara-fertility.vercel.app');
console.log(''); 