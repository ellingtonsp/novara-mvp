#!/usr/bin/env node

/**
 * Airtable Schema Validator
 * Validates that all frontend field values are compatible with Airtable schema
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
      res.on('data', (chunk) => responseData += chunk);
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test field value
async function testFieldValue(fieldName, value) {
  const testData = {
    fields: {
      email: `test-${fieldName}-${value}-${Date.now()}@example.com`,
      nickname: `Test ${fieldName}`,
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      email_opt_in: true,
      status: 'active'
    }
  };
  
  // Add the field we're testing
  testData.fields[fieldName] = value;
  
  try {
    const response = await makeAirtableRequest('Users', 'POST', testData);
    
    if (response.success) {
      return { success: true, value };
    } else {
      return { success: false, value, error: response.data };
    }
  } catch (error) {
    return { success: false, value, error: error.message };
  }
}

// Get existing field values from Airtable
async function getExistingFieldValues() {
  try {
    const response = await makeAirtableRequest('Users?maxRecords=100');
    
    if (response.success && response.data.records) {
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
      
      return {
        cycle_stage: Array.from(cycleStages),
        primary_need: Array.from(primaryNeeds)
      };
    }
  } catch (error) {
    console.log(`Error getting existing values: ${error.message}`);
  }
  
  return { cycle_stage: [], primary_need: [] };
}

// Frontend field values (from NovaraLanding.tsx)
const FRONTEND_FIELD_VALUES = {
  cycle_stage: [
    'considering',
    'ivf_prep',
    'stimulation',
    'transfer'
  ],
  primary_need: [
    'emotional_support',
    'medication_guidance',
    'financial_planning',
    'procedure_info',
    'community'
  ]
};

// Main validation function
async function validateAirtableSchema() {
  logHeader('Airtable Schema Validator');
  log('Validating frontend field values against Airtable schema...', 'blue');
  
  // Get existing values from Airtable
  logSection('Getting Existing Field Values');
  const existingValues = await getExistingFieldValues();
  
  log('Existing cycle_stage values:', 'blue');
  existingValues.cycle_stage.forEach(value => {
    log(`  - "${value}"`, 'cyan');
  });
  
  log('\nExisting primary_need values:', 'blue');
  existingValues.primary_need.forEach(value => {
    log(`  - "${value}"`, 'cyan');
  });
  
  // Test frontend values
  logSection('Testing Frontend Field Values');
  
  const results = {
    cycle_stage: [],
    primary_need: []
  };
  
  // Test cycle_stage values
  log('\nTesting cycle_stage values...', 'blue');
  for (const value of FRONTEND_FIELD_VALUES.cycle_stage) {
    const result = await testFieldValue('cycle_stage', value);
    results.cycle_stage.push(result);
    
    if (result.success) {
      log(`✅ cycle_stage = "${value}" - ACCEPTED`, 'green');
    } else {
      log(`❌ cycle_stage = "${value}" - REJECTED`, 'red');
      if (result.error && result.error.error) {
        log(`   Error: ${result.error.error.message}`, 'red');
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test primary_need values
  log('\nTesting primary_need values...', 'blue');
  for (const value of FRONTEND_FIELD_VALUES.primary_need) {
    const result = await testFieldValue('primary_need', value);
    results.primary_need.push(result);
    
    if (result.success) {
      log(`✅ primary_need = "${value}" - ACCEPTED`, 'green');
    } else {
      log(`❌ primary_need = "${value}" - REJECTED`, 'red');
      if (result.error && result.error.error) {
        log(`   Error: ${result.error.error.message}`, 'red');
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  logHeader('Schema Validation Report');
  
  const cycleStageAccepted = results.cycle_stage.filter(r => r.success).map(r => r.value);
  const cycleStageRejected = results.cycle_stage.filter(r => !r.success).map(r => r.value);
  
  const primaryNeedAccepted = results.primary_need.filter(r => r.success).map(r => r.value);
  const primaryNeedRejected = results.primary_need.filter(r => !r.success).map(r => r.value);
  
  logSection('Cycle Stage Results');
  if (cycleStageAccepted.length > 0) {
    log(`✅ Accepted: ${cycleStageAccepted.join(', ')}`, 'green');
  }
  if (cycleStageRejected.length > 0) {
    log(`❌ Rejected: ${cycleStageRejected.join(', ')}`, 'red');
  }
  
  logSection('Primary Need Results');
  if (primaryNeedAccepted.length > 0) {
    log(`✅ Accepted: ${primaryNeedAccepted.join(', ')}`, 'green');
  }
  if (primaryNeedRejected.length > 0) {
    log(`❌ Rejected: ${primaryNeedRejected.join(', ')}`, 'red');
  }
  
  // Summary
  logSection('Summary');
  const totalTests = results.cycle_stage.length + results.primary_need.length;
  const totalAccepted = cycleStageAccepted.length + primaryNeedAccepted.length;
  const totalRejected = cycleStageRejected.length + primaryNeedRejected.length;
  
  log(`Total tests: ${totalTests}`, 'blue');
  log(`Accepted: ${totalAccepted}`, 'green');
  log(`Rejected: ${totalRejected}`, 'red');
  
  if (totalRejected > 0) {
    log('\n⚠️  Schema validation failed!', 'yellow');
    log('Please update the frontend to use only accepted values.', 'yellow');
    return false;
  } else {
    log('\n🎉 All schema validations passed!', 'green');
    return true;
  }
}

// Run validation
if (require.main === module) {
  validateAirtableSchema().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    log(`❌ Schema validation failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateAirtableSchema, FRONTEND_FIELD_VALUES }; 