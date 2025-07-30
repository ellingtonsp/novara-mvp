#!/usr/bin/env node

/**
 * Debug insights error on staging
 */

const axios = require('axios');

const API_URL = 'https://novara-staging-staging.up.railway.app';
const TEST_USER_EMAIL = 'uat-user-1@staging.com';

async function debugInsights() {
  console.log('🔍 Debugging insights error...\n');
  
  try {
    // 1. Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Logged in as:', user.nickname);
    console.log('   User ID:', user.id);
    console.log('   Onboarding path:', user.onboarding_path);
    console.log('   Baseline completed:', user.baseline_completed);
    console.log('   Primary need:', user.primary_need);
    console.log('   Cycle stage:', user.cycle_stage);
    
    // 2. Try to get insights with detailed error handling
    console.log('\n📊 Attempting to get daily insights...');
    
    try {
      const insightsResponse = await axios.get(
        `${API_URL}/api/insights/daily`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Insights retrieved:', insightsResponse.data);
    } catch (error) {
      console.error('❌ Insights error:', error.response?.status, error.response?.data);
      
      // Check if it's an onboarding issue
      if (error.response?.status === 403) {
        console.log('\n⚠️  User needs to complete onboarding');
        console.log('   Current status:', error.response.data.user_status);
      }
    }
    
    // 3. Check user's check-ins
    console.log('\n📅 Checking user check-ins...');
    const checkinsResponse = await axios.get(
      `${API_URL}/api/checkins`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('   Total check-ins:', checkinsResponse.data.count);
    console.log('   Latest check-in:', checkinsResponse.data.checkins[0]?.date_submitted);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

debugInsights();