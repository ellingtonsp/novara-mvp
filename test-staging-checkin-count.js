#!/usr/bin/env node

/**
 * Test script to verify check-in counting in staging environment
 * This will help identify if the issue is with the backend or frontend
 */

const https = require('https');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';
const TEST_EMAIL = 'monkey@gmail.com';

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testStagingCheckinCount() {
  console.log('🔍 Testing Staging Check-in Count Issue');
  console.log('=====================================\n');

  try {
    // 1. Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const health = await makeRequest(`${STAGING_BACKEND}/api/health`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Environment: ${health.data.environment}`);
    console.log(`   Service: ${health.data.service}\n`);

    // 2. Test login
    console.log('2️⃣ Testing login...');
    const loginResponse = await makeRequest(`${STAGING_BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    if (loginResponse.status !== 200) {
      console.log(`   ❌ Login failed: ${loginResponse.status}`);
      console.log(`   Error: ${JSON.stringify(loginResponse.data)}`);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log(`   ✅ Login successful for ${TEST_EMAIL}`);
    console.log(`   User ID: ${loginResponse.data.user.id}`);
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // 3. Test check-ins endpoint
    console.log('3️⃣ Testing check-ins endpoint...');
    const checkinsResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkinsResponse.status !== 200) {
      console.log(`   ❌ Check-ins fetch failed: ${checkinsResponse.status}`);
      console.log(`   Error: ${JSON.stringify(checkinsResponse.data)}`);
      return;
    }
    
    const checkins = checkinsResponse.data.checkins;
    console.log(`   ✅ Found ${checkins.length} check-ins`);
    console.log(`   Backend count: ${checkinsResponse.data.count}`);
    
    // Analyze check-ins by date
    const checkinsByDate = {};
    checkins.forEach(checkin => {
      const date = checkin.date_submitted;
      if (!checkinsByDate[date]) {
        checkinsByDate[date] = [];
      }
      checkinsByDate[date].push(checkin);
    });
    
    console.log('\n   📊 Check-ins by date:');
    Object.entries(checkinsByDate).forEach(([date, dateCheckins]) => {
      console.log(`   ${date}: ${dateCheckins.length} check-in(s)`);
      if (dateCheckins.length > 1) {
        console.log(`      ⚠️  DUPLICATE CHECK-INS DETECTED!`);
        dateCheckins.forEach((checkin, index) => {
          console.log(`         ${index + 1}. ID: ${checkin.id}, Mood: ${checkin.mood_today}, Confidence: ${checkin.confidence_today}`);
        });
      }
    });

    // 4. Test daily insights endpoint
    console.log('\n4️⃣ Testing daily insights endpoint...');
    const insightsResponse = await makeRequest(`${STAGING_BACKEND}/api/insights/daily`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (insightsResponse.status !== 200) {
      console.log(`   ❌ Insights fetch failed: ${insightsResponse.status}`);
      console.log(`   Error: ${JSON.stringify(insightsResponse.data)}`);
      return;
    }
    
    const analysisData = insightsResponse.data.analysis_data;
    console.log(`   ✅ Insights generated successfully`);
    console.log(`   Check-ins analyzed: ${analysisData.checkins_analyzed}`);
    console.log(`   Date range: ${analysisData.date_range}`);
    console.log(`   User ID: ${analysisData.user_id}`);
    
    // 5. Compare counts
    console.log('\n5️⃣ Count Comparison:');
    console.log(`   Backend check-ins count: ${checkins.length}`);
    console.log(`   Insights analysis count: ${analysisData.checkins_analyzed}`);
    
    if (checkins.length === analysisData.checkins_analyzed) {
      console.log(`   ✅ Counts match! The backend is working correctly.`);
    } else {
      console.log(`   ❌ Counts don't match! There's a discrepancy.`);
    }

    // 6. Check for duplicate check-ins
    const hasDuplicates = Object.values(checkinsByDate).some(dateCheckins => dateCheckins.length > 1);
    if (hasDuplicates) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Duplicate check-ins detected!');
      console.log('   This could be caused by:');
      console.log('   - Multiple form submissions');
      console.log('   - Frontend not preventing duplicate submissions');
      console.log('   - Network issues causing retries');
      console.log('   - Browser refresh during submission');
    } else {
      console.log('\n✅ No duplicate check-ins found');
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Clear browser cache and try again');
    console.log('2. Check if the frontend is properly handling form submission states');
    console.log('3. Verify that the frontend is using the correct staging API URL');
    console.log('4. Check for any network issues or retry logic that might cause duplicates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStagingCheckinCount(); 