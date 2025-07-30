#!/usr/bin/env node

/**
 * Test compatibility service directly
 */

const { Pool } = require('pg');
const CompatibilityService = require('../services/compatibility-service');

const DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const compatibility = new CompatibilityService(pool);
compatibility.useV2 = true;

async function testCompatibility() {
  console.log('🔍 Testing compatibility service directly\n');
  
  try {
    const userId = '08d84601-5f0c-4384-b71a-0751edf9b508';
    const checkinData = {
      user_id: [userId], // Still in array format
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Direct compatibility test',
      primary_concern_today: 'Test concern',
      date_submitted: '2025-07-30'
    };
    
    console.log('1️⃣ Testing createDailyCheckin...');
    console.log('UserId:', userId);
    console.log('Data:', checkinData);
    
    const result = await compatibility.createDailyCheckin(userId, checkinData);
    
    console.log('✅ Success!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testCompatibility();