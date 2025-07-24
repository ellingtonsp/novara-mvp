#!/usr/bin/env node

/**
 * 🎯 TARGETED CHECK-IN DIAGNOSTIC
 * Tests check-in storage without verbose logging that breaks CI/CD
 */

const https = require('https');

const PRODUCTION_BACKEND = 'https://novara-backend.up.railway.app';

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

async function targetedCheckinDiagnostic() {
  console.log('🎯 TARGETED CHECK-IN DIAGNOSTIC\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Health check...');
    const healthResponse = await makeRequest(`${PRODUCTION_BACKEND}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);

    if (healthResponse.status !== 200) {
      console.log('   ❌ Production backend not accessible');
      return;
    }
    console.log('   ✅ Production backend accessible\n');

    // Test 2: Create test user
    console.log('2️⃣ Creating test user...');
    const userData = {
      email: `targeted-test-${Date.now()}@example.com`,
      nickname: 'TargetedTestUser',
      confidence_meds: 7,
      confidence_costs: 6,
      confidence_overall: 7,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep'
    };

    const userResponse = await makeRequest(`${PRODUCTION_BACKEND}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: userData
    });

    if (userResponse.status === 401 || userResponse.status === 403) {
      console.log('   ⚠️ User creation failed (auth expected)');
      console.log('   📋 This is expected - proceeding with diagnostic\n');
    } else if (userResponse.status === 201) {
      console.log('   ✅ Test user created');
      console.log(`   📊 User ID: ${userResponse.data.user?.id}\n`);
    } else {
      console.log(`   ❌ Unexpected user creation response: ${userResponse.status}`);
      console.log(`   📋 Response: ${JSON.stringify(userResponse.data)}\n`);
    }

    // Test 3: Submit check-in
    console.log('3️⃣ Submitting check-in...');
    const checkinData = {
      mood_today: 'targeted-diagnostic',
      confidence_today: 8,
      primary_concern_today: 'Testing targeted diagnostic approach',
      date_submitted: '2025-07-24'
    };

    const checkinResponse = await makeRequest(`${PRODUCTION_BACKEND}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: checkinData
    });

    console.log(`   Status: ${checkinResponse.status}`);
    if (checkinResponse.status === 201) {
      console.log('   ✅ Check-in submitted successfully');
      console.log(`   📊 Check-in ID: ${checkinResponse.data.checkin?.id}`);
    } else if (checkinResponse.status === 401 || checkinResponse.status === 403) {
      console.log('   ⚠️ Check-in submission failed (auth expected)');
    } else {
      console.log(`   ❌ Unexpected check-in response: ${checkinResponse.status}`);
      console.log(`   📋 Response: ${JSON.stringify(checkinResponse.data)}`);
    }

    // Test 4: Check insights
    console.log('\n4️⃣ Testing insights...');
    const insightsResponse = await makeRequest(`${PRODUCTION_BACKEND}/api/insights/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: { user_id: 'test-user-targeted' }
    });

    console.log(`   Status: ${insightsResponse.status}`);
    if (insightsResponse.status === 200) {
      console.log('   ✅ Insights generated');
      console.log(`   📊 Check-ins analyzed: ${insightsResponse.data.analysis_data?.checkins_analyzed || 0}`);
    } else {
      console.log(`   ⚠️ Insights failed (auth expected): ${insightsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }

  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('========================');
  console.log('🎯 This diagnostic tests the core check-in flow without verbose logging');
  console.log('🔍 Focuses on HTTP status codes and basic response validation');
  console.log('📊 Provides targeted insights without breaking CI/CD pipeline');
  console.log('✅ Safe for production testing');
}

// Run diagnostic
targetedCheckinDiagnostic(); 