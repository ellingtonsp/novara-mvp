#!/usr/bin/env node

/**
 * PostHog Connection Test Script
 * Tests if PostHog is receiving events from staging
 */

const https = require('https');

const POSTHOG_API_KEY = 'phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt';
const POSTHOG_HOST = 'us.i.posthog.com';

console.log('🔍 PostHog Connection Test');
console.log('==========================');
console.log(`API Key: ${POSTHOG_API_KEY}`);
console.log(`Host: ${POSTHOG_HOST}`);
console.log('');

// Test event data
const testEvent = {
  api_key: POSTHOG_API_KEY,
  event: 'test_connection',
  distinct_id: 'test-user-' + Date.now(),
  properties: {
    environment: 'staging',
    test: true,
    timestamp: new Date().toISOString(),
    source: 'node-test-script'
  }
};

console.log('📤 Sending test event...');
console.log('Event data:', JSON.stringify(testEvent, null, 2));
console.log('');

// Send test event
const postData = JSON.stringify(testEvent);

const options = {
  hostname: POSTHOG_HOST,
  port: 443,
  path: '/capture/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📡 Response Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📡 Response Body: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('✅ Test event sent successfully!');
      console.log('🎯 Check PostHog Activity for "test_connection" event');
    } else {
      console.log('❌ Failed to send test event');
      console.log('🔧 Check your PostHog API key and project settings');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();

console.log('⏳ Waiting for response...');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Check if test event appears in PostHog Activity');
console.log('2. If it appears, the issue is with your frontend code');
console.log('3. If it doesn\'t appear, check PostHog project settings');
console.log('4. Add authorized URLs to your PostHog project'); 