#!/usr/bin/env node

/**
 * 🔍 PRODUCTION CHECK-IN DIAGNOSTIC
 * Investigates why daily insights show "0 check-ins analyzed"
 * despite users submitting check-ins successfully
 */

const https = require('https');

const STAGING_BASE = 'https://novara-staging-staging.up.railway.app';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Make HTTP request helper
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

async function diagnosticTest() {
  log('\n🔍 STAGING CHECK-IN DIAGNOSTIC', 'magenta');
  log('='.repeat(50), 'blue');
  
  try {
    // Step 1: Test health endpoint
    log('\n1️⃣ Testing Staging Health...', 'yellow');
         const health = await makeRequest(`${STAGING_BASE}/api/health`);
    if (health.status === 200) {
      log(`✅ Production is healthy: ${health.data.environment} v${health.data.version}`, 'green');
    } else {
      log(`❌ Production health failed: ${health.status}`, 'red');
      return;
    }

    // Step 2: Test user creation (to get a test user ID)
    log('\n2️⃣ Creating Test User...', 'yellow');
    const testUser = {
      email: `diagnostic-${Date.now()}@test.local`,
      nickname: 'DiagnosticUser',
      confidence_meds: 5,
      confidence_costs: 7,
      confidence_overall: 6,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    };

         const userResponse = await makeRequest(`${STAGING_BASE}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: testUser
    });

    if (userResponse.status !== 201) {
      log(`❌ User creation failed: ${userResponse.status} - ${JSON.stringify(userResponse.data)}`, 'red');
      return;
    }

    const { token, user } = userResponse.data;
    log(`✅ Created test user: ${user.nickname} (${user.id})`, 'green');

    // Step 3: Submit a check-in
    log('\n3️⃣ Submitting Check-in...', 'yellow');
    const checkinData = {
      mood_today: 'hopeful, anxious',
      confidence_today: 8,
      primary_concern_today: 'Diagnostic test concern'
    };

         const checkinResponse = await makeRequest(`${STAGING_BASE}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: checkinData
    });

    if (checkinResponse.status !== 201) {
      log(`❌ Check-in submission failed: ${checkinResponse.status} - ${JSON.stringify(checkinResponse.data)}`, 'red');
      return;
    }

    log(`✅ Check-in submitted: ${checkinResponse.data.checkin.id}`, 'green');

    // Step 4: Retrieve check-ins to verify storage
    log('\n4️⃣ Retrieving Submitted Check-ins...', 'yellow');
         const checkinsResponse = await makeRequest(`${STAGING_BASE}/api/checkins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (checkinsResponse.status !== 200) {
      log(`❌ Check-ins retrieval failed: ${checkinsResponse.status} - ${JSON.stringify(checkinsResponse.data)}`, 'red');
      return;
    }

    const checkins = checkinsResponse.data.checkins || [];
    log(`📊 Retrieved ${checkins.length} check-ins for user`, 'blue');
    
    if (checkins.length > 0) {
      log(`   └─ Latest: ${checkins[0].mood_today} (confidence: ${checkins[0].confidence_today})`, 'blue');
    }

    // Step 5: Test daily insights
    log('\n5️⃣ Testing Daily Insights...', 'yellow');
         const insightsResponse = await makeRequest(`${STAGING_BASE}/api/insights/daily`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (insightsResponse.status !== 200) {
      log(`❌ Daily insights failed: ${insightsResponse.status} - ${JSON.stringify(insightsResponse.data)}`, 'red');
      return;
    }

    const insightData = insightsResponse.data;
    const analyzedCount = insightData.analysis_data?.checkins_analyzed || 0;
    
    log(`📈 Insights Analysis Result:`, 'blue');
    log(`   └─ Check-ins analyzed: ${analyzedCount}`, analyzedCount > 0 ? 'green' : 'red');
    log(`   └─ Insight title: "${insightData.insight?.title || 'none'}"`, 'blue');
    log(`   └─ User ID: ${insightData.analysis_data?.user_id || 'unknown'}`, 'blue');

    // Step 6: Diagnosis
    log('\n🎯 DIAGNOSIS:', 'magenta');
    log('='.repeat(30), 'blue');
    
    if (checkins.length > 0 && analyzedCount === 0) {
      log('❌ BUG CONFIRMED: Check-ins are being stored but NOT counted in insights', 'red');
      log('   → This suggests an issue in the insights endpoint or database adapter', 'yellow');
      log('   → Check-ins storage: ✅ Working', 'green');
      log('   → Insights analysis: ❌ Broken', 'red');
    } else if (checkins.length === 0) {
      log('❌ Check-ins are not being stored at all', 'red');
      log('   → This suggests an issue in the check-in submission endpoint', 'yellow');
    } else if (analyzedCount > 0) {
      log('✅ Everything appears to be working correctly', 'green');
      log('   → The issue might be user-specific or temporary', 'yellow');
    }

    log('\n📋 Summary:', 'magenta');
    log(`   • User created: ✅`, 'green');
    log(`   • Check-in submitted: ✅`, 'green');
    log(`   • Check-ins retrieved: ${checkins.length > 0 ? '✅' : '❌'}`, checkins.length > 0 ? 'green' : 'red');
    log(`   • Insights counted correctly: ${analyzedCount > 0 ? '✅' : '❌'}`, analyzedCount > 0 ? 'green' : 'red');

  } catch (error) {
    log(`❌ Diagnostic failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run diagnostic
diagnosticTest(); 