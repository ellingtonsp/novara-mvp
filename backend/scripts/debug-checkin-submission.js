#!/usr/bin/env node

/**
 * Debug check-in submission issue
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
const JWT_SECRET = 'staging_super_secret_jwt_key_different_from_prod';
const TEST_EMAIL = 'uat-user-1@staging.com';

async function debugCheckinSubmission() {
  console.log('🔍 Debugging check-in submission\n');
  
  try {
    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${STAGING_URL}/api/auth/login`, {
      email: TEST_EMAIL
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // 2. Prepare check-in data (same as frontend)
    const checkinData = {
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Debug test check-in',
      primary_concern_today: 'Test concern',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    console.log('\n2️⃣ Submitting check-in...');
    console.log('Data:', JSON.stringify(checkinData, null, 2));
    
    try {
      const checkinResponse = await axios.post(
        `${STAGING_URL}/api/checkins`,
        checkinData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Check-in submitted successfully!');
      console.log('Response:', checkinResponse.data);
      
    } catch (checkinError) {
      console.log('❌ Check-in submission failed');
      console.log('Status:', checkinError.response?.status);
      console.log('Error:', checkinError.response?.data);
      
      // If we get error details, that helps debug
      if (checkinError.response?.data?.error) {
        console.log('\n🔍 Error details:', checkinError.response.data.error);
      }
    }
    
    // 3. Test direct database submission
    console.log('\n3️⃣ Testing direct compatibility service...');
    
    // Test if it's a Schema V2 issue by checking status
    const statusResponse = await axios.get(`${STAGING_URL}/api/v2/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Schema V2 enabled:', statusResponse.data.status.schema_v2_enabled);
    console.log('Database type:', statusResponse.data.status.database_type);
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugCheckinSubmission();