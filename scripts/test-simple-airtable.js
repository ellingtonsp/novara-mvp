#!/usr/bin/env node

/**
 * Simple Airtable Test Script
 * Tests user creation with specific field values to identify schema issues
 */

const https = require('https');

// Environment configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appEOWvLjCn5c7Ght';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logSection(message) {
  console.log('\n' + '-'.repeat(40));
  log(message, 'cyan');
  console.log('-'.repeat(40));
}

// Make HTTPS request to Airtable API
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
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test user creation with specific field values
async function testUserCreation(fieldName, value) {
  const testData = {
    fields: {
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      nickname: 'Schema Test User',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      email_opt_in: true,
      status: 'active'
    }
  };
  
  // Add the field we're testing
  testData.fields[fieldName] = value;
  
  log(`Testing ${fieldName} = "${value}"...`, 'blue');
  
  try {
    const response = await makeAirtableRequest('Users', 'POST', testData);
    
    if (response.success) {
      log(`✅ ${fieldName} = "${value}" - ACCEPTED`, 'green');
      return { success: true, value };
    } else {
      log(`❌ ${fieldName} = "${value}" - REJECTED`, 'red');
      if (response.data && response.data.error) {
        log(`   Error: ${response.data.error.message}`, 'red');
        log(`   Type: ${response.data.error.type}`, 'red');
      }
      return { success: false, value, error: response.data };
    }
  } catch (error) {
    log(`❌ ${fieldName} = "${value}" - ERROR: ${error.message}`, 'red');
    return { success: false, value, error: error.message };
  }
}

// Main test function
async function runSimpleTests() {
  logHeader('Simple Airtable Schema Test');
  log('Testing specific field values that might be causing issues...', 'blue');
  
  // Test the problematic "retrieval" value
  logSection('Testing Cycle Stage Values');
  
  const cycleStageTests = [
    { field: 'cycle_stage', value: 'retrieval' },
    { field: 'cycle_stage', value: 'ivf_prep' },
    { field: 'cycle_stage', value: 'considering' }
  ];
  
  for (const test of cycleStageTests) {
    const result = await testUserCreation(test.field, test.value);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test primary_need values
  logSection('Testing Primary Need Values');
  
  const primaryNeedTests = [
    { field: 'primary_need', value: 'emotional_support' },
    { field: 'primary_need', value: 'medication_guidance' }
  ];
  
  for (const test of primaryNeedTests) {
    const result = await testUserCreation(test.field, test.value);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test a basic user creation without problematic fields
  logSection('Testing Basic User Creation');
  
  const basicUserData = {
    fields: {
      email: `basic-test-${Date.now()}@example.com`,
      nickname: 'Basic Test User',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      email_opt_in: true,
      status: 'active'
    }
  };
  
  try {
    const response = await makeAirtableRequest('Users', 'POST', basicUserData);
    
    if (response.success) {
      log('✅ Basic user creation - SUCCESS', 'green');
      log(`   User ID: ${response.data.id}`, 'green');
    } else {
      log('❌ Basic user creation - FAILED', 'red');
      if (response.data && response.data.error) {
        log(`   Error: ${response.data.error.message}`, 'red');
        log(`   Type: ${response.data.error.type}`, 'red');
      }
    }
  } catch (error) {
    log(`❌ Basic user creation - ERROR: ${error.message}`, 'red');
  }
}

// Run the tests
if (require.main === module) {
  runSimpleTests().catch(error => {
    log(`❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runSimpleTests, testUserCreation }; 