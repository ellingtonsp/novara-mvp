#!/usr/bin/env node

/**
 * Comprehensive Airtable Schema Check
 * Tests all frontend field values and identifies potential issues
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

// All frontend field values (from NovaraLanding.tsx)
const FRONTEND_FIELD_VALUES = {
  cycle_stage: [
    'considering',
    'ivf_prep',
    'stimulation',
    'retrieval',
    'transfer',
    'tww',
    'pregnant',
    'between_cycles'
  ],
  primary_need: [
    'emotional_support',
    'medication_guidance',
    'financial_planning',
    'procedure_info',
    'community'
  ]
};

// Test data types and formats
const DATA_TYPE_TESTS = [
  // Email validation
  { field: 'email', value: 'test@example.com', description: 'Valid email' },
  { field: 'email', value: 'invalid-email', description: 'Invalid email format' },
  { field: 'email', value: '', description: 'Empty email' },
  
  // Nickname validation
  { field: 'nickname', value: 'Test User', description: 'Valid nickname' },
  { field: 'nickname', value: 'A'.repeat(100), description: 'Very long nickname' },
  { field: 'nickname', value: '', description: 'Empty nickname' },
  
  // Confidence scores
  { field: 'confidence_meds', value: 1, description: 'Min confidence' },
  { field: 'confidence_meds', value: 10, description: 'Max confidence' },
  { field: 'confidence_meds', value: 0, description: 'Below min confidence' },
  { field: 'confidence_meds', value: 11, description: 'Above max confidence' },
  { field: 'confidence_meds', value: 'not-a-number', description: 'Non-numeric confidence' },
  
  // Boolean fields
  { field: 'email_opt_in', value: true, description: 'Email opt-in true' },
  { field: 'email_opt_in', value: false, description: 'Email opt-in false' },
  { field: 'email_opt_in', value: 'yes', description: 'Email opt-in string' },
  
  // Optional fields
  { field: 'top_concern', value: 'Test concern', description: 'Valid concern' },
  { field: 'top_concern', value: 'A'.repeat(1000), description: 'Very long concern' },
  { field: 'top_concern', value: '', description: 'Empty concern' },
  
  // Timezone
  { field: 'timezone', value: 'America/New_York', description: 'Valid timezone' },
  { field: 'timezone', value: 'Invalid/Timezone', description: 'Invalid timezone' }
];

// Main validation function
async function runComprehensiveCheck() {
  logHeader('Comprehensive Airtable Schema Check');
  log('Testing all frontend field values and data types...', 'blue');
  
  const results = {
    fieldValues: {},
    dataTypes: []
  };
  
  // Test field values
  logSection('Testing Frontend Field Values');
  
  for (const [fieldName, values] of Object.entries(FRONTEND_FIELD_VALUES)) {
    log(`\nTesting ${fieldName} values...`, 'blue');
    results.fieldValues[fieldName] = [];
    
    for (const value of values) {
      const result = await testFieldValue(fieldName, value);
      results.fieldValues[fieldName].push(result);
      
      if (result.success) {
        log(`✅ ${fieldName} = "${value}" - ACCEPTED`, 'green');
      } else {
        log(`❌ ${fieldName} = "${value}" - REJECTED`, 'red');
        if (result.error && result.error.error) {
          log(`   Error: ${result.error.error.message}`, 'red');
          log(`   Type: ${result.error.error.type}`, 'red');
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Test data types
  logSection('Testing Data Types and Formats');
  
  for (const test of DATA_TYPE_TESTS) {
    const result = await testFieldValue(test.field, test.value);
    results.dataTypes.push({ ...test, result });
    
    if (result.success) {
      log(`✅ ${test.field} = "${test.value}" (${test.description}) - ACCEPTED`, 'green');
    } else {
      log(`❌ ${test.field} = "${test.value}" (${test.description}) - REJECTED`, 'red');
      if (result.error && result.error.error) {
        log(`   Error: ${result.error.error.message}`, 'red');
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate comprehensive report
  logHeader('Comprehensive Schema Check Report');
  
  // Field values summary
  for (const [fieldName, fieldResults] of Object.entries(results.fieldValues)) {
    logSection(`${fieldName.toUpperCase()} Field Results`);
    const accepted = fieldResults.filter(r => r.success).map(r => r.value);
    const rejected = fieldResults.filter(r => !r.success).map(r => r.value);
    
    if (accepted.length > 0) {
      log(`✅ Accepted: ${accepted.join(', ')}`, 'green');
    }
    if (rejected.length > 0) {
      log(`❌ Rejected: ${rejected.join(', ')}`, 'red');
    }
  }
  
  // Data type summary
  logSection('Data Type Validation Results');
  const dataTypeAccepted = results.dataTypes.filter(r => r.result.success);
  const dataTypeRejected = results.dataTypes.filter(r => !r.result.success);
  
  if (dataTypeAccepted.length > 0) {
    log(`✅ Data types accepted: ${dataTypeAccepted.length}`, 'green');
  }
  if (dataTypeRejected.length > 0) {
    log(`❌ Data types rejected: ${dataTypeRejected.length}`, 'red');
    dataTypeRejected.forEach(r => {
      log(`   - ${r.field}: "${r.value}" (${r.description})`, 'red');
    });
  }
  
  // Overall summary
  logSection('Overall Summary');
  const totalFieldTests = Object.values(results.fieldValues).flat().length;
  const totalFieldAccepted = Object.values(results.fieldValues).flat().filter(r => r.success).length;
  const totalFieldRejected = totalFieldTests - totalFieldAccepted;
  
  const totalDataTypeTests = results.dataTypes.length;
  const totalDataTypeAccepted = dataTypeAccepted.length;
  const totalDataTypeRejected = dataTypeRejected.length;
  
  const totalTests = totalFieldTests + totalDataTypeTests;
  const totalAccepted = totalFieldAccepted + totalDataTypeAccepted;
  const totalRejected = totalFieldRejected + totalDataTypeRejected;
  
  log(`Total field value tests: ${totalFieldTests}`, 'blue');
  log(`Field values accepted: ${totalFieldAccepted}`, 'green');
  log(`Field values rejected: ${totalFieldRejected}`, 'red');
  
  log(`Total data type tests: ${totalDataTypeTests}`, 'blue');
  log(`Data types accepted: ${totalDataTypeAccepted}`, 'green');
  log(`Data types rejected: ${totalDataTypeRejected}`, 'red');
  
  log(`\nOverall: ${totalAccepted}/${totalTests} tests passed`, totalRejected > 0 ? 'red' : 'green');
  
  if (totalRejected > 0) {
    log('\n⚠️  Schema issues detected!', 'yellow');
    log('Please review the rejected values and data types above.', 'yellow');
    return false;
  } else {
    log('\n🎉 All schema checks passed!', 'green');
    return true;
  }
}

// Run comprehensive check
if (require.main === module) {
  runComprehensiveCheck().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    log(`❌ Comprehensive check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runComprehensiveCheck, FRONTEND_FIELD_VALUES }; 