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

async function testPrimaryNeeds() {
  console.log('🧪 Testing primary_need values from frontend...\n');
  
  const primaryNeedValues = [
    'emotional_support',
    'medication_guidance', 
    'financial_planning',
    'procedure_info',
    'community'
  ];
  
  for (const value of primaryNeedValues) {
    const testData = {
      fields: {
        email: `test-${value}-${Date.now()}@example.com`,
        nickname: `Test ${value}`,
        confidence_meds: 5,
        confidence_costs: 5,
        confidence_overall: 5,
        primary_need: value,
        email_opt_in: true,
        status: 'active'
      }
    };
    
    try {
      const response = await makeAirtableRequest('Users', 'POST', testData);
      
      if (response.success) {
        console.log(`✅ "${value}" - ACCEPTED`);
      } else {
        console.log(`❌ "${value}" - REJECTED`);
        if (response.data && response.data.error) {
          console.log(`   Error: ${response.data.error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ "${value}" - ERROR: ${error.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testPrimaryNeeds(); 