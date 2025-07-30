#!/usr/bin/env node

/**
 * Detailed debug for insights error
 */

const axios = require('axios');

async function debugInsights() {
  const API_URL = 'https://novara-staging-staging.up.railway.app';
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'uat-user-1@staging.com'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Make a raw request to insights endpoint to see full error
    console.log('2. Making direct request to insights endpoint...');
    
    const response = await fetch(`${API_URL}/api/insights/daily`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', responseText);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nCould not parse as JSON');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugInsights();