#!/usr/bin/env node

/**
 * 🔍 TEST ENHANCED AIRTABLE LOGGING
 * Tests the enhanced logging in our database adapter
 */

const axios = require('axios');

// Mock the database factory to test logging
async function testEnhancedLogging() {
  console.log('🔍 Testing Enhanced Airtable Logging...\n');
  
  // Simulate the originalAirtableRequest function with enhanced logging
  async function originalAirtableRequest(endpoint, method = 'GET', data = null) {
    const config = {
      airtable: {
        apiKey: process.env.AIRTABLE_API_KEY || 'test-api-key',
        baseId: process.env.AIRTABLE_BASE_ID || 'appWOsZBUfg57fKD3',
        baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || 'appWOsZBUfg57fKD3'}`
      }
    };

    const url = `${config.airtable.baseUrl}/${endpoint}`;
    
    // Enhanced logging for debugging
    console.log(`🌩️ Production: Making ${method} request to Airtable:`, url);
    console.log(`🌩️ Base ID: ${config.airtable.baseId}`);
    console.log(`🌩️ Has API Key: ${!!config.airtable.apiKey}`);
    
    if (data && method !== 'GET') {
      console.log(`🌩️ Request Data:`, JSON.stringify(data, null, 2));
    }
    
    try {
      const axiosConfig = {
        method: method,
        url: url,
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (data && method !== 'GET') {
        axiosConfig.data = data;
      }
      
      const response = await axios(axiosConfig);
      
      // Enhanced response logging
      console.log(`✅ Production: Airtable ${method} request successful`, response.status);
      console.log(`✅ Response Status: ${response.status}`);
      console.log(`✅ Response Data:`, JSON.stringify(response.data, null, 2));
      
      return response.data;
      
    } catch (error) {
      // Enhanced error logging
      console.error(`❌ Production: Airtable ${method} request failed`);
      console.error(`❌ Error Status: ${error.response?.status}`);
      console.error(`❌ Error Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`❌ Error Message:`, error.message);
      
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Airtable ${method} failed: ${errorMessage}`);
    }
  }
  
  // Test with sample data
  const testData = {
    fields: {
      user_id: ['recTestUser123'],
      mood_today: 'test-enhanced-logging',
      confidence_today: 7,
      primary_concern_today: 'Testing enhanced logging',
      date_submitted: '2025-07-24'
    }
  };
  
  try {
    console.log('📝 Testing check-in creation with enhanced logging...\n');
    await originalAirtableRequest('DailyCheckins', 'POST', testData);
  } catch (error) {
    console.log('\n✅ Enhanced logging test completed');
    console.log('📊 The logging will show detailed request/response information');
    console.log('🔍 This will help identify the exact issue with Airtable storage');
  }
}

// Run test
testEnhancedLogging(); 