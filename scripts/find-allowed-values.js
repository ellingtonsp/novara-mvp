#!/usr/bin/env node

const https = require('https');

const AIRTABLE_API_KEY = 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7';
const AIRTABLE_BASE_ID = 'appEOWvLjCn5c7Ght';

function makeAirtableRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: `/v0/${AIRTABLE_BASE_ID}/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData, success: res.statusCode >= 200 && res.statusCode < 300 });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, success: res.statusCode >= 200 && res.statusCode < 300 });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function findAllowedValues() {
  console.log('🔍 Finding allowed values in Airtable...\n');
  
  try {
    // Get existing records to see what values are already used
    const response = await makeAirtableRequest('Users?maxRecords=100');
    
    if (response.success && response.data.records) {
      console.log(`Found ${response.data.records.length} existing records\n`);
      
      const cycleStages = new Set();
      const primaryNeeds = new Set();
      
      response.data.records.forEach(record => {
        if (record.fields.cycle_stage) {
          cycleStages.add(record.fields.cycle_stage);
        }
        if (record.fields.primary_need) {
          primaryNeeds.add(record.fields.primary_need);
        }
      });
      
      console.log('📋 Existing cycle_stage values:');
      if (cycleStages.size > 0) {
        Array.from(cycleStages).forEach(stage => {
          console.log(`  - "${stage}"`);
        });
      } else {
        console.log('  (none found)');
      }
      
      console.log('\n📋 Existing primary_need values:');
      if (primaryNeeds.size > 0) {
        Array.from(primaryNeeds).forEach(need => {
          console.log(`  - "${need}"`);
        });
      } else {
        console.log('  (none found)');
      }
      
      // Test some common variations
      console.log('\n🧪 Testing common variations...\n');
      
      const testValues = [
        'retrieval',
        'egg_retrieval', 
        'egg-retrieval',
        'eggretrieval',
        'retrieval_phase',
        'retrieval_stage',
        'stimulation',
        'transfer',
        'two_week_wait',
        'tww',
        'pregnant',
        'between_cycles'
      ];
      
      for (const value of testValues) {
        const testData = {
          fields: {
            email: `test-${value}-${Date.now()}@example.com`,
            nickname: `Test ${value}`,
            confidence_meds: 5,
            confidence_costs: 5,
            confidence_overall: 5,
            cycle_stage: value,
            email_opt_in: true,
            status: 'active'
          }
        };
        
        try {
          const testResponse = await makeAirtableRequest('Users', 'POST', testData);
          
          if (testResponse.success) {
            console.log(`✅ "${value}" - ACCEPTED`);
          } else {
            console.log(`❌ "${value}" - REJECTED`);
            if (testResponse.data && testResponse.data.error) {
              console.log(`   Error: ${testResponse.data.error.message}`);
            }
          }
        } catch (error) {
          console.log(`❌ "${value}" - ERROR: ${error.message}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } else {
      console.log('❌ Failed to get existing records');
      if (response.data && response.data.error) {
        console.log(`Error: ${response.data.error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

findAllowedValues(); 