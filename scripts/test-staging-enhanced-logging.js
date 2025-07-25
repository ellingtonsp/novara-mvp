#!/usr/bin/env node

/**
 * 🔍 QUICK TEST - Enhanced Logging in Staging
 * Verifies that enhanced logging is working in staging environment
 */

const https = require('https');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: data
          });
        }
      });
    });
    
    request.on('error', reject);
    
    if (options.body) {
      request.write(JSON.stringify(options.body));
    }
    
    request.end();
  });
}

async function testStagingEnhancedLogging() {
  console.log('🔍 Testing Enhanced Logging in Staging...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await makeRequest(`${STAGING_BACKEND}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Version: ${healthResponse.data.version}`);
    
    if (healthResponse.status === 200) {
      console.log('   ✅ Staging backend is accessible\n');
    } else {
      console.log('   ❌ Staging backend is not accessible\n');
      return;
    }
    
    // Test 2: Try to trigger enhanced logging with a check-in request
    console.log('2️⃣ Testing enhanced logging with check-in request...');
    const testCheckinData = {
      user_id: 'test-user-enhanced-logging',
      mood_today: 'test-enhanced-logging',
      confidence_today: 7,
      primary_concern_today: 'Testing enhanced logging in staging',
      date_submitted: '2025-07-24'
    };
    
    const checkinResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: testCheckinData
    });
    
    console.log(`   Status: ${checkinResponse.status}`);
    console.log(`   Response: ${JSON.stringify(checkinResponse.data)}`);
    
    if (checkinResponse.status === 401 || checkinResponse.status === 403) {
      console.log('   ✅ Request reached backend (authentication expected to fail)');
      console.log('   📊 Check Railway logs for enhanced logging output');
      console.log('   🔍 Look for these log entries:');
      console.log('      🌩️ Production: Making POST request to Airtable');
      console.log('      🌩️ Base ID: appEOWvLjCn5c7Ght');
      console.log('      🌩️ Has API Key: true');
      console.log('      🌩️ Request Data: {...}');
    } else {
      console.log('   ❌ Unexpected response - check staging deployment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open Railway Dashboard → Staging Backend → Logs');
  console.log('2. Look for enhanced logging entries with 🌩️ emojis');
  console.log('3. If enhanced logging appears, proceed with full test');
  console.log('4. If not, staging deployment may need time to update');
}

// Run test
testStagingEnhancedLogging(); 