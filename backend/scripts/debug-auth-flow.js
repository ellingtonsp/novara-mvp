#!/usr/bin/env node

/**
 * Debug full auth flow locally
 */

const PostgresAdapter = require('../database/postgres-adapter');

const DATABASE_URL = "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

// Set environment variable for Schema V2
process.env.USE_SCHEMA_V2 = 'true';

const adapter = new PostgresAdapter(DATABASE_URL);

async function debugAuthFlow() {
  console.log('🔍 Debugging full auth flow\n');
  
  const testEmail = 'schema-v2-staging-test@example.com';
  
  try {
    console.log('1️⃣ Testing findUserByEmail...');
    console.log('   Schema V2 enabled:', adapter.useSchemaV2);
    
    const user = await adapter.findUserByEmail(testEmail);
    
    if (user) {
      console.log('✅ User found successfully!');
      console.log('User data:');
      Object.entries(user).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Check what fields might be missing that the auth expects
      console.log('\n2️⃣ Checking expected fields...');
      const expectedFields = [
        'id', 'email', 'nickname', 'confidence_meds', 
        'confidence_costs', 'confidence_overall', 'primary_need',
        'cycle_stage', 'medication_status', 'baseline_completed'
      ];
      
      const missingFields = expectedFields.filter(field => !(field in user));
      if (missingFields.length > 0) {
        console.log('⚠️ Missing expected fields:', missingFields);
      } else {
        console.log('✅ All expected fields present');
      }
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error during auth flow:', error.message);
    console.error('Stack trace:', error.stack);
    
    // This is likely the error causing the 500
    console.log('\n🔍 This error would cause a 500 response in the API');
  } finally {
    await adapter.close();
  }
}

debugAuthFlow();