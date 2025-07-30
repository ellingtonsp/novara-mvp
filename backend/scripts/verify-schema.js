const fetch = require('node-fetch');

// Verify Airtable schema through API introspection
async function verifySchema() {
  console.log('🔍 Verifying Airtable Schema for Medication Tracking\n');
  
  const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
  
  try {
    // 1. Check service health first
    console.log('1️⃣ Checking service health...');
    const healthResponse = await fetch(`${STAGING_URL}/api/health`);
    
    if (!healthResponse.ok) {
      console.log('❌ Service not healthy:', healthResponse.status);
      return;
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Service healthy:', healthData);
    console.log('');
    
    // 2. Try to get schema info through a test endpoint
    console.log('2️⃣ Checking for schema test endpoint...');
    const schemaResponse = await fetch(`${STAGING_URL}/api/schema/daily_checkins`);
    
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json();
      console.log('✅ Schema endpoint found:');
      console.log(JSON.stringify(schemaData, null, 2));
    } else {
      console.log('ℹ️  No schema endpoint available (expected)');
    }
    
    // 3. Login and create a test check-in to see what fields are accepted
    console.log('\n3️⃣ Testing field acceptance through API...');
    
    // First, try to login with a test account
    const loginResponse = await fetch(`${STAGING_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      
      // Try to submit a check-in with various fields
      console.log('\n4️⃣ Testing field submission...');
      
      const testFields = {
        mood_today: 'test-schema',
        confidence_today: 5,
        medication_taken: 'yes',
        test_field_that_doesnt_exist: 'test',
        date_submitted: new Date().toISOString().split('T')[0]
      };
      
      const submitResponse = await fetch(`${STAGING_URL}/api/checkins`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testFields)
      });
      
      if (submitResponse.ok) {
        console.log('✅ Check-in accepted with medication_taken field');
      } else {
        const error = await submitResponse.json();
        console.log('❌ Check-in rejected:', error);
        
        // Check if error mentions specific fields
        if (error.error && error.error.includes('medication_taken')) {
          console.log('⚠️  medication_taken field might not exist in schema');
        }
      }
    } else {
      console.log('ℹ️  Could not login with test account (expected)');
    }
    
    // 4. Check the actual endpoints
    console.log('\n5️⃣ Checking API endpoints...');
    const endpointsResponse = await fetch(`${STAGING_URL}/api/checkins-test`);
    
    if (endpointsResponse.ok) {
      const endpoints = await endpointsResponse.json();
      console.log('✅ Available endpoints:');
      console.log(JSON.stringify(endpoints, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Also create a direct Airtable check if we have access
async function checkAirtableDirectly() {
  console.log('\n\n🔍 Attempting Direct Airtable Check...\n');
  
  try {
    const Airtable = require('airtable');
    require('dotenv').config();
    
    if (!process.env.AIRTABLE_API_KEY) {
      console.log('ℹ️  No Airtable API key in environment');
      return;
    }
    
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Try to get table schema
    console.log('📋 Checking daily_checkins table...');
    
    // Get one record to see available fields
    const records = await base('daily_checkins')
      .select({ 
        maxRecords: 1,
        view: 'Grid view'
      })
      .firstPage();
    
    if (records.length > 0) {
      console.log('✅ Found record with fields:');
      const fields = Object.keys(records[0].fields);
      console.log('   Available fields:', fields.join(', '));
      
      if (fields.includes('medication_taken')) {
        console.log('   ✅ medication_taken field EXISTS in schema');
      } else {
        console.log('   ❌ medication_taken field NOT FOUND in schema');
      }
      
      // Show field types if available
      console.log('\n   Field details:');
      Object.entries(records[0].fields).forEach(([key, value]) => {
        console.log(`   - ${key}: ${typeof value} (sample: ${JSON.stringify(value).substring(0, 50)}...)`);
      });
    } else {
      console.log('ℹ️  No records found in daily_checkins table');
    }
    
  } catch (error) {
    console.log('ℹ️  Direct Airtable access not available:', error.message);
  }
}

// Run both checks
async function runAllChecks() {
  await verifySchema();
  await checkAirtableDirectly();
  
  console.log('\n\n📌 SUMMARY:');
  console.log('If medication_taken field exists in Airtable but not saving:');
  console.log('1. Check if field name is exactly "medication_taken" (case sensitive)');
  console.log('2. Check if field type is correct (should be Single Select or Text)');
  console.log('3. Check if the backend is properly mapping the field');
  console.log('4. Check if there are any field permissions in Airtable');
}

runAllChecks();