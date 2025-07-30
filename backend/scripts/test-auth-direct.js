#!/usr/bin/env node

/**
 * Direct Authentication Test
 * Tests the auth endpoint with existing user
 */

const axios = require('axios');

const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
const TEST_EMAIL = 'schema-v2-staging-test@example.com';

async function testAuth() {
  console.log('🔍 Testing authentication directly\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Health check...');
    const health = await axios.get(`${STAGING_URL}/api/health`);
    console.log('✅ Health check passed:', health.data.status);
    
    // Test 2: Try login
    console.log('\n2️⃣ Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${STAGING_URL}/api/auth/login`, {
        email: TEST_EMAIL
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status < 600; // Don't throw on any status
        }
      });
      
      console.log('Response status:', loginResponse.status);
      console.log('Response data:', loginResponse.data);
      
      if (loginResponse.status === 500) {
        console.log('\n❌ Server returned 500 - Internal Server Error');
        console.log('This suggests the PostgreSQL adapter is still having issues');
      } else if (loginResponse.status === 404) {
        console.log('\n⚠️ User not found - may need to check database');
      } else if (loginResponse.status === 200) {
        console.log('\n✅ Login successful!');
        console.log('Token:', loginResponse.data.token?.substring(0, 20) + '...');
      }
      
    } catch (loginError) {
      console.error('Login error:', loginError.message);
      if (loginError.response) {
        console.error('Response:', loginError.response.data);
      }
    }
    
    // Test 3: Direct database test
    console.log('\n3️⃣ Testing database connection via status endpoint...');
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign({ email: TEST_EMAIL }, 'staging_super_secret_jwt_key_different_from_prod', { expiresIn: '1h' });
    
    try {
      const statusResponse = await axios.get(`${STAGING_URL}/api/v2/status`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log('✅ Database connection confirmed');
      console.log('Schema V2:', statusResponse.data.status.schema_v2_enabled);
      console.log('Database:', statusResponse.data.status.database_type);
      
    } catch (statusError) {
      console.error('Status check error:', statusError.response?.status, statusError.response?.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();