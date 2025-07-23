// Novara Airtable Schema Test - Local Development
// This script tests our Airtable connection and validates the schema
const AIRTABLE_BASE_ID = 'app5QWCcVbCnVg2Gg';
const AIRTABLE_API_KEY = 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7';

async function testAirtableSchema() {
  console.log('🔍 Testing Novara Airtable Schema...\n');
  
  // Step 1: Check existing records to understand field structure
  console.log('=== STEP 1: Analyzing existing records ===');
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?maxRecords=5`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully connected to Airtable');
    console.log(`📊 Found ${data.records.length} existing records`);
    
    // Analyze field structure
    const allFields = new Set();
    data.records.forEach(record => {
      Object.keys(record.fields || {}).forEach(field => allFields.add(field));
    });
    
    console.log('\n📋 Available fields in Airtable Users table:');
    Array.from(allFields).forEach(field => {
      console.log(`  - "${field}"`);
    });
    
    if (allFields.size === 0) {
      console.log('⚠️  No fields found - records might be empty');
      console.log('Raw records:', JSON.stringify(data.records, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Failed to read existing records:', error.message);
    return;
  }
  
  // Step 2: Test minimal record creation
  console.log('\n=== STEP 2: Testing minimal record creation ===');
  
  const testRecords = [
    // Test 1: Just email
    { email: `test-${Date.now()}@example.com` },
    
    // Test 2: Email with common field variations
    { Email: `test2-${Date.now()}@example.com` },
    
    // Test 3: Email with nickname
    { 
      email: `test3-${Date.now()}@example.com`,
      nickname: "TestUser"
    },
    
    // Test 4: Title case variations
    {
      Email: `test4-${Date.now()}@example.com`,
      Nickname: "TestUser4"
    }
  ];
  
  for (let i = 0; i < testRecords.length; i++) {
    const testData = testRecords[i];
    console.log(`\nTest ${i + 1}: ${Object.keys(testData).join(', ')}`);
    
    try {
      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: testData
        })
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        console.log(`✅ Test ${i + 1} SUCCESS`);
        const result = JSON.parse(responseText);
        console.log(`   Created record: ${result.id}`);
        break; // Stop on first success
      } else {
        console.log(`❌ Test ${i + 1} FAILED (${response.status})`);
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error && errorData.error.message) {
            console.log(`   Error: ${errorData.error.message}`);
          }
          if (errorData.error && errorData.error.type) {
            console.log(`   Type: ${errorData.error.type}`);
          }
        } catch (e) {
          console.log(`   Raw error: ${responseText}`);
        }
      }
    } catch (error) {
      console.log(`❌ Test ${i + 1} ERROR: ${error.message}`);
    }
  }
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('If all tests failed, the likely issues are:');
  console.log('1. Field names in Airtable don\'t match what we\'re sending');
  console.log('2. Required fields are missing in Airtable');
  console.log('3. Field types don\'t match (e.g., text vs number)');
  console.log('4. Table permissions or API key issues');
  console.log('\n💡 Solution: Check your Airtable Users table and verify:');
  console.log('   - Field names exactly match');
  console.log('   - No required fields are missing');
  console.log('   - Field types are correct');
}

// Run the test
testAirtableSchema().catch(console.error);
