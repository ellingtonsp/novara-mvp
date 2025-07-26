#!/usr/bin/env node

/**
 * Detailed PostHog Debug Script
 * 
 * This script provides comprehensive debugging commands to identify
 * why PostHog is not initializing on the staging deployment.
 * 
 * Usage: Run these commands in the browser console on:
 * https://novara-n7lbdrvea-novara-fertility.vercel.app
 */

console.log('🔍 Detailed PostHog Debug Commands');
console.log('==================================');
console.log('');
console.log('📋 Copy and paste these commands ONE BY ONE into your browser console:');
console.log('');

console.log('🔍 STEP 1: Check Environment Variables');
console.log('=====================================');
console.log('console.log("=== ENVIRONMENT VARIABLES ===");');
console.log('console.log("VITE_POSTHOG_API_KEY:", import.meta.env.VITE_POSTHOG_API_KEY ? "✅ Set (" + import.meta.env.VITE_POSTHOG_API_KEY.substring(0, 10) + "...)" : "❌ Missing");');
console.log('console.log("VITE_VERCEL_ENV:", import.meta.env.VITE_VERCEL_ENV || "❌ Not set");');
console.log('console.log("VITE_VERCEL_URL:", import.meta.env.VITE_VERCEL_URL || "❌ Not set");');
console.log('console.log("VITE_VERCEL_BRANCH_URL:", import.meta.env.VITE_VERCEL_BRANCH_URL || "❌ Not set");');
console.log('console.log("VITE_VERCEL_GIT_COMMIT_REF:", import.meta.env.VITE_VERCEL_GIT_COMMIT_REF || "❌ Not set");');
console.log('console.log("MODE:", import.meta.env.MODE);');
console.log('console.log("NODE_ENV:", import.meta.env.NODE_ENV);');
console.log('');

console.log('🔍 STEP 2: Check Environment Detection');
console.log('=====================================');
console.log('console.log("=== ENVIRONMENT DETECTION ===");');
console.log('console.log("Hostname:", window.location.hostname);');
console.log('console.log("Is Vercel Domain:", window.location.hostname.includes(".vercel.app"));');
console.log('console.log("Is Localhost:", window.location.hostname.includes("localhost"));');
console.log('console.log("Protocol:", window.location.protocol);');
console.log('console.log("Full URL:", window.location.href);');
console.log('');

console.log('🔍 STEP 3: Check PostHog Object');
console.log('===============================');
console.log('console.log("=== POSTHOG OBJECT ===");');
console.log('console.log("window.posthog:", window.posthog);');
console.log('console.log("typeof window.posthog:", typeof window.posthog);');
console.log('console.log("posthog.get_distinct_id:", window.posthog?.get_distinct_id());');
console.log('console.log("posthog.config:", window.posthog?.config);');
console.log('');

console.log('🔍 STEP 4: Check for PostHog Errors');
console.log('===================================');
console.log('console.log("=== ERROR CHECK ===");');
console.log('// Look in the console for any of these error messages:');
console.log('// - "PostHog API key not found. Analytics will be disabled."');
console.log('// - "Failed to initialize PostHog:"');
console.log('// - "PostHog enabled in development mode for testing"');
console.log('// - "PostHog initialized successfully on Vercel"');
console.log('');

console.log('🔍 STEP 5: Test Manual PostHog Initialization');
console.log('=============================================');
console.log('console.log("=== MANUAL INITIALIZATION TEST ===");');
console.log('const testApiKey = import.meta.env.VITE_POSTHOG_API_KEY;');
console.log('console.log("Test API Key available:", !!testApiKey);');
console.log('if (testApiKey) {');
console.log('  console.log("Attempting manual PostHog init...");');
console.log('  try {');
console.log('    window.posthog.init(testApiKey, {');
console.log('      api_host: "https://us.i.posthog.com",');
console.log('      capture_pageview: false,');
console.log('      loaded: () => console.log("✅ Manual PostHog init successful")');
console.log('    });');
console.log('  } catch (error) {');
console.log('    console.error("❌ Manual PostHog init failed:", error);');
console.log('  }');
console.log('} else {');
console.log('  console.log("❌ No API key available for manual test");');
console.log('}');
console.log('');

console.log('🔍 STEP 6: Check Network Requests');
console.log('=================================');
console.log('console.log("=== NETWORK CHECK ===");');
console.log('// 1. Open Network tab in DevTools');
console.log('// 2. Filter by "posthog" or "us.i.posthog.com"');
console.log('// 3. Look for requests to: https://us.i.posthog.com/capture/');
console.log('// 4. Check if any requests are being made');
console.log('');

console.log('🔍 STEP 7: Test Event Tracking');
console.log('==============================');
console.log('console.log("=== EVENT TRACKING TEST ===");');
console.log('if (window.posthog) {');
console.log('  console.log("✅ PostHog available, testing event...");');
console.log('  try {');
console.log('    window.posthog.capture("debug_test", {');
console.log('      test: true,');
console.log('      timestamp: new Date().toISOString(),');
console.log('      url: window.location.href')
console.log('    });');
console.log('    console.log("✅ Event sent successfully");');
console.log('  } catch (error) {');
console.log('    console.error("❌ Event failed:", error);');
console.log('  }');
console.log('} else {');
console.log('  console.log("❌ PostHog not available for event test");');
console.log('}');
console.log('');

console.log('🔍 STEP 8: Check Import.meta.env');
console.log('================================');
console.log('console.log("=== IMPORT.META.ENV ===");');
console.log('console.log("All env vars:", Object.keys(import.meta.env));');
console.log('console.log("VITE_ vars:", Object.keys(import.meta.env).filter(key => key.startsWith("VITE_")));');
console.log('');

console.log('🔍 STEP 9: Check for Console Errors');
console.log('==================================');
console.log('console.log("=== CONSOLE ERROR CHECK ===");');
console.log('// Look for any of these in the console:');
console.log('// - "Failed to initialize PostHog:"');
console.log('// - "PostHog API key not found"');
console.log('// - Network errors to us.i.posthog.com');
console.log('// - JavaScript errors related to posthog');
console.log('');

console.log('🔍 STEP 10: Verify PostHog Project Settings');
console.log('==========================================');
console.log('console.log("=== POSTHOG SETTINGS CHECK ===");');
console.log('// 1. Go to your PostHog project settings');
console.log('// 2. Check "Toolbar Authorized URLs" includes:');
console.log('//    - https://*.vercel.app');
console.log('//    - https://novara-mvp.vercel.app');
console.log('// 3. Check "Web Analytics Domains" includes:');
console.log('//    - https://*.vercel.app');
console.log('//    - https://novara-mvp.vercel.app');
console.log('// 4. Ensure "Enable autocapture for web" is checked');
console.log('');

console.log('📊 Expected Results:');
console.log('===================');
console.log('');
console.log('✅ SUCCESS:');
console.log('- VITE_POSTHOG_API_KEY shows "✅ Set (phc_xxxxx...)"');
console.log('- VITE_VERCEL_ENV shows "preview" or "production"');
console.log('- window.posthog is an object (not null/undefined)');
console.log('- Manual PostHog init succeeds');
console.log('- Network tab shows requests to us.i.posthog.com');
console.log('');
console.log('❌ FAILURE:');
console.log('- VITE_POSTHOG_API_KEY shows "❌ Missing"');
console.log('- window.posthog is null/undefined');
console.log('- Manual PostHog init fails');
console.log('- No network requests to us.i.posthog.com');
console.log('');

console.log('🚨 Most Likely Issues:');
console.log('======================');
console.log('');
console.log('1. API Key Not Exposed: VITE_POSTHOG_API_KEY not available in browser');
console.log('2. PostHog Init Failing: Silent failure during initialization');
console.log('3. Environment Detection: Wrong environment detected');
console.log('4. Network Issues: CORS or network problems');
console.log('5. PostHog Settings: Wrong authorized URLs configured');
console.log('');

console.log('🔧 Quick Fixes to Try:');
console.log('=====================');
console.log('');
console.log('1. If API key is missing: Check Vercel environment variables');
console.log('2. If PostHog object is null: Check for initialization errors');
console.log('3. If network fails: Check PostHog project settings');
console.log('4. If environment wrong: Check Vercel environment detection');
console.log('');

console.log('📞 Next Steps:');
console.log('==============');
console.log('');
console.log('1. Run all debug commands above');
console.log('2. Share the results with me');
console.log('3. Check PostHog Activity for any events');
console.log('4. Verify PostHog project settings');
console.log('');

console.log('🔗 Useful Links:');
console.log('================');
console.log('- PostHog Activity: https://us.posthog.com/activity');
console.log('- PostHog Project Settings: https://us.posthog.com/project/settings');
console.log('- Staging URL: https://novara-n7lbdrvea-novara-fertility.vercel.app');
console.log(''); 