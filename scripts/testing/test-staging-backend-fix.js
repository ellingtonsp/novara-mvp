#!/usr/bin/env node

/**
 * 🧪 TEST STAGING BACKEND FIX
 * Tests the actual staging backend to verify check-in counting works
 */

const https = require('https');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', 
    yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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

async function testStagingBackendFix() {
  log('\n🧪 TESTING STAGING BACKEND FIX', 'magenta');
  log('='.repeat(50), 'blue');
  log(`🎯 Testing: ${STAGING_BACKEND}`, 'yellow');
  
  try {
    // Step 1: Health check
    log('\n1️⃣ Checking staging backend health...', 'yellow');
    const healthResponse = await makeRequest(`${STAGING_BACKEND}/api/health`);
    
    if (healthResponse.status !== 200) {
      log(`❌ Staging backend not healthy: ${healthResponse.status}`, 'red');
      return;
    }
    
    log(`✅ Staging backend healthy`, 'green');
    log(`   Environment: ${healthResponse.data.environment}`, 'blue');
    log(`   Version: ${healthResponse.data.version}`, 'blue');
    
    // Step 2: Create test user
    log('\n2️⃣ Creating test user...', 'yellow');
    const userData = {
      email: `staging-fix-test-${Date.now()}@example.com`,
      nickname: 'StagingFixTest',
      confidence_meds: 6,
      confidence_costs: 7,
      confidence_overall: 7,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    };

    const userResponse = await makeRequest(`${STAGING_BACKEND}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: userData
    });

    if (userResponse.status !== 201) {
      log(`❌ User creation failed: ${userResponse.status}`, 'red');
      console.log(userResponse.data);
      return;
    }

    const { token, user } = userResponse.data;
    log(`✅ Test user created: ${user.nickname} (ID: ${user.id})`, 'green');

    // Step 3: Check initial check-ins (should be 0)
    log('\n3️⃣ Checking initial check-ins count...', 'yellow');
    const initialCheckinsResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (initialCheckinsResponse.status !== 200) {
      log(`❌ Initial check-ins fetch failed: ${initialCheckinsResponse.status}`, 'red');
      return;
    }

    const initialCheckins = initialCheckinsResponse.data.checkins || [];
    log(`📊 Initial check-ins count: ${initialCheckins.length}`, 'blue');

    // Step 4: Submit check-in
    log('\n4️⃣ Submitting check-in...', 'yellow');
    const checkinData = {
      mood_today: 'staging-backend-test',
      confidence_today: 8,
      primary_concern_today: 'Testing staging backend fix'
    };

    const checkinResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: checkinData
    });

    if (checkinResponse.status !== 201) {
      log(`❌ Check-in submission failed: ${checkinResponse.status}`, 'red');
      console.log(checkinResponse.data);
      return;
    }

    const submittedCheckin = checkinResponse.data.checkin;
    log(`✅ Check-in submitted with ID: ${submittedCheckin.id}`, 'green');

    // Step 5: Wait and then check if check-in appears
    log('\n5️⃣ Waiting 3 seconds then checking if check-in appears...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const postCheckinResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (postCheckinResponse.status !== 200) {
      log(`❌ Post-checkin fetch failed: ${postCheckinResponse.status}`, 'red');
      return;
    }

    const postCheckins = postCheckinResponse.data.checkins || [];
    log(`📊 Check-ins count after submission: ${postCheckins.length}`, 'blue');

    // Step 6: Test daily insights
    log('\n6️⃣ Testing daily insights...', 'yellow');
    const insightsResponse = await makeRequest(`${STAGING_BACKEND}/api/insights/daily`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (insightsResponse.status !== 200) {
      log(`❌ Daily insights failed: ${insightsResponse.status}`, 'red');
      return;
    }

    const insightData = insightsResponse.data;
    const analyzedCount = insightData.analysis_data?.checkins_analyzed || 0;
    
    // Step 7: Analysis
    log('\n🎯 STAGING BACKEND ANALYSIS:', 'magenta');
    log('='.repeat(30), 'blue');
    
    const checkinsStored = postCheckins.length;
    log(`📊 Check-ins stored: ${checkinsStored}`, checkinsStored > 0 ? 'green' : 'red');
    log(`📈 Check-ins analyzed by insights: ${analyzedCount}`, analyzedCount > 0 ? 'green' : 'red');
    
    if (checkinsStored > 0 && analyzedCount > 0) {
      log('\n✅ SUCCESS! Staging backend is working correctly!', 'green');
      log('   → Check-ins are being stored properly', 'green');
      log('   → Check-ins are being retrieved correctly', 'green');
      log('   → Insights are analyzing the correct count', 'green');
      
      log('\n🎉 The fix is working! Ready for production deployment.', 'green');
    } else if (checkinsStored > 0 && analyzedCount === 0) {
      log('\n🔍 PARTIAL SUCCESS: Storage works, retrieval needs fix', 'yellow');
      log('   → Check-ins are stored in database', 'green');
      log('   → Insights not reading stored check-ins', 'red');
      log('   → Likely Airtable query formula issue', 'yellow');
    } else {
      log('\n❌ ISSUE PERSISTS: Storage or retrieval problem', 'red');
      log('   → Check environment variables in staging', 'yellow');
      log('   → Verify database adapter configuration', 'yellow');
    }

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the test
testStagingBackendFix(); 