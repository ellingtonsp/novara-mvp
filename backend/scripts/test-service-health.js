#!/usr/bin/env node

/**
 * Test service health on staging
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
const JWT_SECRET = 'staging_super_secret_jwt_key_different_from_prod';

async function testServiceHealth() {
  console.log('🔍 Testing service health\n');
  
  try {
    // Generate a test token
    const token = jwt.sign({ 
      email: 'test@example.com',
      userId: 'test-user-id'
    }, JWT_SECRET, { expiresIn: '1h' });
    
    // Test Schema V2 status which should show service health
    console.log('1️⃣ Testing Schema V2 status endpoint...');
    const statusResponse = await axios.get(`${STAGING_URL}/api/v2/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Schema V2 Status:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // Test if we can get any additional debug info
    console.log('\n2️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${STAGING_URL}/api/health`);
    console.log('✅ Health:', healthResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testServiceHealth();