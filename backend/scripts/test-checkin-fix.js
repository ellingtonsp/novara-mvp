#!/usr/bin/env node

/**
 * Test check-in fix locally
 */

const PostgresAdapter = require('../database/postgres-adapter');

const DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

// Set environment variable for Schema V2
process.env.USE_SCHEMA_V2 = 'true';

const adapter = new PostgresAdapter(DATABASE_URL);

async function testCheckinFix() {
  console.log('🔍 Testing check-in fix\n');
  
  try {
    // Test with array format (as sent by server.js)
    const checkinData = {
      user_id: ['08d84601-5f0c-4384-b71a-0751edf9b508'], // Array format
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Test check-in with array user_id fix',
      primary_concern_today: 'Test concern',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    console.log('1️⃣ Testing with array user_id format...');
    console.log('Data:', JSON.stringify(checkinData, null, 2));
    
    const result = await adapter.createCheckin(checkinData);
    
    console.log('✅ Check-in created successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await adapter.close();
  }
}

testCheckinFix();