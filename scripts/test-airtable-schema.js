#!/usr/bin/env node

/**
 * Airtable Schema Test Script
 * Tests the schema to identify allowed values for select fields
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
      path: `/v0/meta/bases/${AIRTABLE_BASE_ID}/${endpoint}`,
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

// Test specific field values
async function testFieldValue(tableName, fieldName, value) {
  const testData = {
    fields: {
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      nickname: 'Schema Test User'
    }
  };
  
  // Add the field we're testing
  testData.fields[fieldName] = value;
  
  try {
    const response = await makeAirtableRequest(`tables/${tableName}/records`, 'POST', testData);
    
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

// Get table schema
async function getTableSchema(tableName) {
  try {
    const response = await makeAirtableRequest(`tables/${tableName}`);
    
    if (response.success) {
      return response.data;
    } else {
      log(`❌ Failed to get schema for ${tableName}: ${response.data?.error?.message || 'Unknown error'}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error getting schema for ${tableName}: ${error.message}`, 'red');
    return null;
  }
}

// Test cycle_stage values
async function testCycleStageValues() {
  logSection('Testing Cycle Stage Values');
  
  const cycleStageValues = [
    'considering',
    'ivf_prep', 
    'stimulation',
    'retrieval',
    'transfer',
    'tww',
    'pregnant',
    'between_cycles'
  ];
  
  const results = [];
  
  for (const value of cycleStageValues) {
    const result = await testFieldValue('Users', 'cycle_stage', value);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Test primary_need values
async function testPrimaryNeedValues() {
  logSection('Testing Primary Need Values');
  
  const primaryNeedValues = [
    'emotional_support',
    'medication_guidance',
    'financial_planning',
    'procedure_info',
    'community'
  ];
  
  const results = [];
  
  for (const value of primaryNeedValues) {
    const result = await testFieldValue('Users', 'primary_need', value);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Main test function
async function runSchemaTests() {
  logHeader('Airtable Schema Test');
  log('Testing field values to identify schema issues...', 'blue');
  
  // Get table schema first
  logSection('Getting Table Schema');
  const schema = await getTableSchema('Users');
  
  if (schema) {
    log('✅ Successfully retrieved Users table schema', 'green');
    log(`Table name: ${schema.name}`, 'blue');
    log(`Fields: ${schema.fields.map(f => f.name).join(', ')}`, 'blue');
    
    // Show field details
    schema.fields.forEach(field => {
      if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
        log(`\n${field.name} (${field.type}):`, 'yellow');
        if (field.options && field.options.choices) {
          field.options.choices.forEach(choice => {
            log(`  - ${choice.name}`, 'cyan');
          });
        }
      }
    });
  }
  
  // Test cycle_stage values
  const cycleStageResults = await testCycleStageValues();
  
  // Test primary_need values
  const primaryNeedResults = await testPrimaryNeedValues();
  
  // Generate report
  logHeader('Schema Test Report');
  
  logSection('Cycle Stage Results');
  const acceptedCycleStages = cycleStageResults.filter(r => r.success).map(r => r.value);
  const rejectedCycleStages = cycleStageResults.filter(r => !r.success).map(r => r.value);
  
  if (acceptedCycleStages.length > 0) {
    log(`✅ Accepted values: ${acceptedCycleStages.join(', ')}`, 'green');
  }
  
  if (rejectedCycleStages.length > 0) {
    log(`❌ Rejected values: ${rejectedCycleStages.join(', ')}`, 'red');
  }
  
  logSection('Primary Need Results');
  const acceptedPrimaryNeeds = primaryNeedResults.filter(r => r.success).map(r => r.value);
  const rejectedPrimaryNeeds = primaryNeedResults.filter(r => !r.success).map(r => r.value);
  
  if (acceptedPrimaryNeeds.length > 0) {
    log(`✅ Accepted values: ${acceptedPrimaryNeeds.join(', ')}`, 'green');
  }
  
  if (rejectedPrimaryNeeds.length > 0) {
    log(`❌ Rejected values: ${rejectedPrimaryNeeds.join(', ')}`, 'red');
  }
  
  // Summary
  logSection('Summary');
  const totalTests = cycleStageResults.length + primaryNeedResults.length;
  const totalAccepted = acceptedCycleStages.length + acceptedPrimaryNeeds.length;
  const totalRejected = rejectedCycleStages.length + rejectedPrimaryNeeds.length;
  
  log(`Total tests: ${totalTests}`, 'blue');
  log(`Accepted: ${totalAccepted}`, 'green');
  log(`Rejected: ${totalRejected}`, 'red');
  
  if (totalRejected > 0) {
    log('\n⚠️  Schema issues detected!', 'yellow');
    log('Please update the frontend to use only accepted values.', 'yellow');
  } else {
    log('\n🎉 All schema tests passed!', 'green');
  }
}

// Run the tests
if (require.main === module) {
  runSchemaTests().catch(error => {
    log(`❌ Schema test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runSchemaTests, testFieldValue, getTableSchema }; 