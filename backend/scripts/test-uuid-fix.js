#!/usr/bin/env node

/**
 * Test UUID fix for malformed user_id
 */

const PostgresAdapter = require('../database/postgres-adapter');

const DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

process.env.USE_SCHEMA_V2 = 'true';

const adapter = new PostgresAdapter(DATABASE_URL);

async function testUUIDFix() {
  console.log('🔍 Testing UUID fix\n');
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Test with the malformed user_id format seen in logs
    const testCases = [
      {
        name: 'Malformed JSON string',
        user_id: ['{"08d84601-5f0c-4384-b71a-0751edf9b508"}']
      },
      {
        name: 'Double-wrapped',
        user_id: ['{\"08d84601-5f0c-4384-b71a-0751edf9b508\"}']
      },
      {
        name: 'Normal array',
        user_id: ['08d84601-5f0c-4384-b71a-0751edf9b508']
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      console.log(`Input user_id:`, testCase.user_id);
      
      const checkinData = {
        user_id: testCase.user_id,
        mood_today: 'hopeful',
        confidence_today: 8,
        medication_taken: 'yes',
        user_note: `Test for ${testCase.name}`,
        date_submitted: '2025-07-30'
      };
      
      try {
        const result = await adapter.createCheckin(checkinData);
        console.log('✅ Success! Check-in created');
      } catch (error) {
        console.log('❌ Failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await adapter.close();
  }
}

testUUIDFix();