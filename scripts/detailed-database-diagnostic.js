#!/usr/bin/env node

/**
 * 🔍 DETAILED DATABASE DIAGNOSTIC
 * Step-by-step debugging of check-in storage and retrieval
 */

const https = require('https');

const STAGING_BASE = 'https://novara-staging-staging.up.railway.app';

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

async function detailedDiagnostic() {
  log('\n🔍 DETAILED DATABASE DIAGNOSTIC', 'magenta');
  log('='.repeat(50), 'blue');
  
  try {
    // Step 1: Create user and get token
    log('\n1️⃣ Creating Test User...', 'yellow');
    const testUser = {
      email: `detailed-test-${Date.now()}@local.test`,
      nickname: 'DetailedTestUser',
      confidence_meds: 5,
      confidence_costs: 7,
      confidence_overall: 6,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    };

    const userResponse = await makeRequest(`${STAGING_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: testUser
    });

    if (userResponse.status !== 201) {
      log(`❌ User creation failed: ${userResponse.status}`, 'red');
      console.log(userResponse.data);
      return;
    }

    const { token, user } = userResponse.data;
    log(`✅ Created user: ${user.nickname} (ID: ${user.id})`, 'green');

    // Step 2: Check initial check-ins (should be 0)
    log('\n2️⃣ Checking Initial Check-ins Count...', 'yellow');
    const initialCheckinsResponse = await makeRequest(`${STAGING_BASE}/api/checkins`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (initialCheckinsResponse.status !== 200) {
      log(`❌ Initial check-ins fetch failed: ${initialCheckinsResponse.status}`, 'red');
      console.log(initialCheckinsResponse.data);
      return;
    }

    const initialCheckins = initialCheckinsResponse.data.checkins || [];
    log(`📊 Initial check-ins count: ${initialCheckins.length}`, 'blue');

    // Step 3: Submit a check-in with detailed logging
    log('\n3️⃣ Submitting Check-in...', 'yellow');
    const checkinData = {
      mood_today: 'diagnostic-testing',
      confidence_today: 7,
      primary_concern_today: 'Database diagnostic test'
    };

    log(`📝 Submitting: ${JSON.stringify(checkinData)}`, 'blue');
    
    const checkinResponse = await makeRequest(`${STAGING_BASE}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: checkinData
    });

    log(`📤 Check-in response status: ${checkinResponse.status}`, 'blue');
    log(`📤 Check-in response:`, 'blue');
    console.log(JSON.stringify(checkinResponse.data, null, 2));

    if (checkinResponse.status !== 201) {
      log(`❌ Check-in submission failed: ${checkinResponse.status}`, 'red');
      return;
    }

    const submittedCheckin = checkinResponse.data.checkin;
    log(`✅ Check-in submitted with ID: ${submittedCheckin.id}`, 'green');

    // Step 4: Wait and then check if the check-in appears
    log('\n4️⃣ Waiting 5 seconds then checking if check-in appears...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const postCheckinResponse = await makeRequest(`${STAGING_BASE}/api/checkins`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (postCheckinResponse.status !== 200) {
      log(`❌ Post-checkin fetch failed: ${postCheckinResponse.status}`, 'red');
      return;
    }

    const postCheckins = postCheckinResponse.data.checkins || [];
    log(`📊 Check-ins count after submission: ${postCheckins.length}`, 'blue');
    
    if (postCheckins.length > 0) {
      log(`📝 Latest check-in:`, 'blue');
      console.log(JSON.stringify(postCheckins[0], null, 2));
    }

    // Step 5: Test daily insights
    log('\n5️⃣ Testing Daily Insights...', 'yellow');
    const insightsResponse = await makeRequest(`${STAGING_BASE}/api/insights/daily`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (insightsResponse.status !== 200) {
      log(`❌ Daily insights failed: ${insightsResponse.status}`, 'red');
      console.log(insightsResponse.data);
      return;
    }

    const insightData = insightsResponse.data;
    log(`📈 Insights response:`, 'blue');
    console.log(JSON.stringify(insightData, null, 2));

    // Step 6: Detailed Analysis
    log('\n🎯 DETAILED ANALYSIS:', 'magenta');
    log('='.repeat(30), 'blue');
    
    const analyzedCount = insightData.analysis_data?.checkins_analyzed || 0;
    const checkinsStored = postCheckins.length;
    
    log(`📊 Check-ins stored: ${checkinsStored}`, checkinsStored > 0 ? 'green' : 'red');
    log(`📈 Check-ins analyzed by insights: ${analyzedCount}`, analyzedCount > 0 ? 'green' : 'red');
    
    if (checkinsStored > 0 && analyzedCount === 0) {
      log('🔍 STORAGE/RETRIEVAL MISMATCH!', 'red');
      log('   → Check-ins are stored in one place but read from another', 'yellow');
      log('   → Likely using SQLite for storage but Airtable for insights', 'yellow');
    } else if (checkinsStored === 0) {
      log('🔍 STORAGE FAILURE!', 'red');
      log('   → Check-ins are not being stored despite success response', 'yellow');
    } else {
      log('🔍 EVERYTHING WORKING!', 'green');
    }

  } catch (error) {
    log(`❌ Diagnostic failed: ${error.message}`, 'red');
    console.error(error);
  }
}

detailedDiagnostic(); 