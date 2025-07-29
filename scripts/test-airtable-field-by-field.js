#!/usr/bin/env node

/**
 * Field-by-field Airtable schema tester
 * Tests each field individually to identify what's missing
 */

const https = require('https');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appEOWvLjCn5c7Ght';

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
          resolve({
            status: res.statusCode,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            success: false
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testField(table, fieldName, value) {
  // Get a test user ID
  const usersResponse = await makeAirtableRequest('Users?maxRecords=1');
  if (!usersResponse.success || !usersResponse.data.records.length) {
    return { field: fieldName, supported: false, error: 'No users found' };
  }
  
  const testUserId = usersResponse.data.records[0].id;
  
  // Build test data based on table
  const baseFields = {};
  if (table === 'DailyCheckins') {
    baseFields.user_id = [testUserId];
    baseFields.mood_today = 'hopeful';
    baseFields.confidence_today = 5;
    baseFields.date_submitted = new Date().toISOString().split('T')[0];
  } else if (table === 'Users') {
    // For user updates, we'll use PATCH on the existing user
  }
  
  const testData = {
    fields: {
      ...baseFields,
      [fieldName]: value
    }
  };
  
  try {
    let response;
    if (table === 'Users') {
      // Update existing user
      response = await makeAirtableRequest(`Users/${testUserId}`, 'PATCH', { fields: { [fieldName]: value } });
    } else {
      // Create new record
      response = await makeAirtableRequest(table, 'POST', testData);
      
      // Clean up if successful
      if (response.success && response.data.id) {
        await makeAirtableRequest(`${table}/${response.data.id}`, 'DELETE');
      }
    }
    
    return {
      field: fieldName,
      supported: response.success,
      error: response.success ? null : (response.data.error && response.data.error.message || 'Unknown error')
    };
  } catch (error) {
    return {
      field: fieldName,
      supported: false,
      error: error.message
    };
  }
}

async function testAllFields() {
  console.log('Field-by-Field Airtable Schema Test\n');
  
  // Test DailyCheckins enhanced fields
  console.log('Testing DailyCheckins fields:');
  const checkinFields = [
    { name: 'anxiety_level', value: 5 },
    { name: 'took_all_medications', value: true },
    { name: 'missed_doses', value: 0 },
    { name: 'injection_confidence', value: 8 },
    { name: 'side_effects', value: JSON.stringify(['headache']) },
    { name: 'appointment_within_3_days', value: true },
    { name: 'appointment_anxiety', value: 4 },
    { name: 'coping_strategies_used', value: JSON.stringify(['meditation']) },
    { name: 'partner_involved_today', value: true },
    { name: 'wish_knew_more_about', value: JSON.stringify(['success_rates']) }
  ];
  
  for (const field of checkinFields) {
    const result = await testField('DailyCheckins', field.name, field.value);
    console.log(`  ${field.name}: ${result.supported ? '✅' : '❌'} ${result.error || ''}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Test User preference fields
  console.log('\nTesting Users fields:');
  const userFields = [
    { name: 'checkin_preference', value: 'quick_daily' },
    { name: 'checkin_preference_updated_at', value: new Date().toISOString() }
  ];
  
  for (const field of userFields) {
    const result = await testField('Users', field.name, field.value);
    console.log(`  ${field.name}: ${result.supported ? '✅' : '❌'} ${result.error || ''}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
}

testAllFields().catch(console.error);