#!/usr/bin/env node

/**
 * Test the daily-summary endpoint
 */

const axios = require('axios');

async function testDailySummary() {
  const API_URL = 'https://novara-staging-staging.up.railway.app';
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'uat-user-1@staging.com'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Test daily-summary endpoint
    console.log('2. Testing /api/v2/health/daily-summary...');
    
    try {
      const response = await axios.get(`${API_URL}/api/v2/health/daily-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Daily summary retrieved:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ Daily summary failed:');
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data || error.message);
    }
    
    // 3. Test with specific date
    console.log('\n3. Testing with specific date...');
    
    try {
      const response = await axios.get(`${API_URL}/api/v2/health/daily-summary?date=2025-01-30`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Daily summary for specific date:');
      console.log(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ Specific date test failed:');
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDailySummary();