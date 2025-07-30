#!/usr/bin/env node

/**
 * Test check-in submission after defensive coding fix
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'https://novara-staging-staging.up.railway.app';
const TEST_USER_EMAIL = 'uat-user-1@staging.com';

async function testCheckinSubmission() {
  console.log('🧪 Testing check-in submission on staging...\n');
  
  try {
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: 'password'
    });
    
    const { token, user } = loginResponse.data;
    console.log(`✅ Logged in as ${user.nickname} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    
    // 2. Submit a check-in
    console.log('\n2. Submitting check-in...');
    const checkinData = {
      user_id: user.id,
      mood_today: 'hopeful',
      confidence_today: 7,
      medication_taken: 'yes',
      user_note: 'Testing check-in submission after fix',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    console.log('   Check-in data:', JSON.stringify(checkinData, null, 2));
    
    const checkinResponse = await axios.post(
      `${API_URL}/api/checkins`,
      checkinData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Check-in submitted successfully!');
    console.log('   Response:', JSON.stringify(checkinResponse.data, null, 2));
    
    // 3. Verify the check-in was saved
    console.log('\n3. Verifying check-in was saved...');
    const verifyResponse = await axios.get(
      `${API_URL}/api/checkins/user/${user.id}?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (verifyResponse.data.records && verifyResponse.data.records.length > 0) {
      const latestCheckin = verifyResponse.data.records[0].fields;
      console.log('✅ Check-in verified in database:');
      console.log(`   Mood: ${latestCheckin.mood_today}`);
      console.log(`   Confidence: ${latestCheckin.confidence_today}`);
      console.log(`   Medication: ${latestCheckin.medication_taken}`);
      console.log(`   Date: ${latestCheckin.date_submitted}`);
    } else {
      console.log('❌ Check-in not found in database');
    }
    
    console.log('\n🎉 Check-in submission test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testCheckinSubmission();