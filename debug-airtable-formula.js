#!/usr/bin/env node

/**
 * Debug Airtable Formula for Linked Records
 * Tests different formula approaches to find the correct one
 */

const https = require('https');

const AIRTABLE_CONFIG = {
  BASE_ID: 'appEOWvLjCn5c7Ght',
  API_KEY: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7',
  TABLE_NAME: 'DailyCheckins'
};

const TEST_USER_ID = 'rec7DIHb10K1JRf2B';
const TEST_RECORD_ID = 'recIshmKBG8PpfTnU';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: response.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data
          });
        }
      });
    });
    
    request.on('error', reject);
    request.end();
  });
}

async function testFormulas() {
  console.log('🧪 Testing Different Airtable Formula Approaches');
  console.log('='.repeat(60));
  console.log(`Target User ID: ${TEST_USER_ID}`);
  console.log(`Known Record ID: ${TEST_RECORD_ID}`);
  console.log('');

  // First verify the record exists
  console.log('1️⃣ Verifying test record exists...');
  const recordUrl = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}/${TEST_RECORD_ID}`;
  const recordCheck = await makeRequest(recordUrl);
  
  if (recordCheck.status === 200) {
    console.log('✅ Test record exists');
    console.log(`   User ID: ${JSON.stringify(recordCheck.data.fields.user_id)}`);
    console.log(`   Mood: ${recordCheck.data.fields.mood_today}`);
  } else {
    console.log('❌ Test record not found');
    return;
  }

  console.log('');

  // Test different formulas
  const formulas = [
    {
      name: 'SEARCH + ARRAYJOIN (Original)',
      formula: `SEARCH('${TEST_USER_ID}',ARRAYJOIN({user_id}))`,
      encoded: encodeURIComponent(`SEARCH('${TEST_USER_ID}',ARRAYJOIN({user_id}))`)
    },
    {
      name: 'FIND function',
      formula: `FIND('${TEST_USER_ID}',{user_id})`,
      encoded: encodeURIComponent(`FIND('${TEST_USER_ID}',{user_id})`)
    },
    {
      name: 'Direct comparison',
      formula: `{user_id}='${TEST_USER_ID}'`,
      encoded: encodeURIComponent(`{user_id}='${TEST_USER_ID}'`)
    },
    {
      name: 'RECORD_ID() approach',
      formula: `RECORD_ID()='${TEST_RECORD_ID}'`,
      encoded: encodeURIComponent(`RECORD_ID()='${TEST_RECORD_ID}'`)
    },
    {
      name: 'IS_SAME function',
      formula: `IS_SAME({user_id},'${TEST_USER_ID}')`,
      encoded: encodeURIComponent(`IS_SAME({user_id},'${TEST_USER_ID}')`)
    }
  ];

  for (let i = 0; i < formulas.length; i++) {
    const formula = formulas[i];
    console.log(`${i + 2}️⃣ Testing: ${formula.name}`);
    console.log(`   Formula: ${formula.formula}`);
    
    const testUrl = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}?filterByFormula=${formula.encoded}&maxRecords=10`;
    
    try {
      const result = await makeRequest(testUrl);
      
      if (result.status === 200) {
        const recordCount = result.data.records?.length || 0;
        if (recordCount > 0) {
          console.log(`   ✅ SUCCESS: Found ${recordCount} records`);
          console.log(`   First record: ${result.data.records[0].id}`);
          // This formula works!
          console.log('');
          console.log('🎉 WORKING FORMULA FOUND!');
          console.log(`Formula: ${formula.formula}`);
          console.log(`Encoded: ${formula.encoded}`);
          return formula;
        } else {
          console.log(`   ❌ No records found`);
        }
      } else {
        console.log(`   ❌ Error: ${result.status}`);
        if (result.data.error) {
          console.log(`   Error message: ${result.data.error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('❌ None of the tested formulas worked');
  console.log('');
  console.log('💡 Alternative approaches to consider:');
  console.log('1. Use Airtable API without filters and filter in code');
  console.log('2. Check if the field name or type has changed');
  console.log('3. Use a different field for linking');
}

// Run the test
testFormulas().catch(console.error); 