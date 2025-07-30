#!/usr/bin/env node

/**
 * Test PostgreSQL adapter with staging configuration
 */

const PostgresAdapter = require('../database/postgres-adapter');

// Use staging database URL
const DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

// Set environment to match staging
process.env.USE_SCHEMA_V2 = 'true';
process.env.NODE_ENV = 'staging';

async function testPostgresAdapter() {
  console.log('🔍 Testing PostgreSQL adapter with staging config\n');
  
  // Create adapter instance
  const adapter = new PostgresAdapter(DATABASE_URL);
  
  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Test data matching what server.js sends
    const checkinData = {
      user_id: ['08d84601-5f0c-4384-b71a-0751edf9b508'], // Array format as sent by server
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Staging adapter test',
      primary_concern_today: 'Test concern',
      date_submitted: '2025-07-30'
    };
    
    console.log('1️⃣ Testing createCheckin with server.js format...');
    console.log('Input data:', JSON.stringify(checkinData, null, 2));
    
    const result = await adapter.createCheckin(checkinData);
    
    console.log('\n✅ Success!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Check if compatibility service is properly initialized
    console.log('\n🔍 Adapter state:');
    console.log('useSchemaV2:', adapter.useSchemaV2);
    console.log('compatibility exists:', !!adapter.compatibility);
    console.log('compatibility.createDailyCheckin exists:', !!adapter.compatibility?.createDailyCheckin);
  } finally {
    await adapter.close();
  }
}

testPostgresAdapter();