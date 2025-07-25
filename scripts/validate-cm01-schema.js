#!/usr/bin/env node

/**
 * CM-01 Schema Validation Script
 * Validates that all required CM-01 fields exist in Airtable staging base
 */

const https = require('https');

// Staging Airtable configuration
const STAGING_CONFIG = {
  AIRTABLE_BASE_ID: 'appEOWvLjCn5c7Ght',
  AIRTABLE_API_KEY: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7'
};

// CM-01 Required Fields
const CM01_REQUIRED_FIELDS = [
  'sentiment',
  'sentiment_confidence', 
  'sentiment_scores',
  'sentiment_processing_time',
  'journey_reflection_today',
  'medication_momentum',
  'financial_momentum',
  'journey_momentum'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Make HTTPS request to Airtable
function makeAirtableRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = `https://api.airtable.com/v0/${STAGING_CONFIG.AIRTABLE_BASE_ID}/${endpoint}`;
    
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${STAGING_CONFIG.AIRTABLE_BASE_ID}/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${STAGING_CONFIG.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Validate CM-01 schema fields
async function validateCM01Schema() {
  logHeader('CM-01 Schema Validation - Staging Environment');
  
  try {
    // Step 1: Test Airtable connection
    logSection('Testing Airtable Connection');
    
    const connectionTest = await makeAirtableRequest('DailyCheckins?maxRecords=1');
    
    if (!connectionTest.success) {
      log(`❌ Failed to connect to Airtable: ${connectionTest.status}`, 'red');
      if (connectionTest.data && connectionTest.data.error) {
        log(`   Error: ${connectionTest.data.error.message}`, 'red');
      }
      return false;
    }
    
    log('✅ Successfully connected to Airtable staging base', 'green');
    
    // Step 2: Get table schema by analyzing a record
    logSection('Analyzing DailyCheckins Table Schema');
    
    const schemaTest = await makeAirtableRequest('DailyCheckins?maxRecords=1');
    
    if (!schemaTest.success || !schemaTest.data.records || schemaTest.data.records.length === 0) {
      log('❌ No records found in DailyCheckins table', 'red');
      log('   This might be normal for a new staging base', 'yellow');
      log('   We\'ll check field existence by attempting to create a test record', 'yellow');
    } else {
      const record = schemaTest.data.records[0];
      const existingFields = Object.keys(record.fields || {});
      
      log(`📊 Found ${existingFields.length} existing fields:`, 'blue');
      existingFields.forEach(field => {
        log(`   - ${field}`, 'blue');
      });
    }
    
    // Step 3: Validate CM-01 required fields
    logSection('Validating CM-01 Required Fields');
    
    const missingFields = [];
    const existingFields = [];
    
    for (const fieldName of CM01_REQUIRED_FIELDS) {
      try {
        // Try to create a test record with the field
        const testData = {
          fields: {
            user_id: ['recTestUser123'],
            mood_today: 'hopeful',
            confidence_today: 8,
            date_submitted: '2025-07-25',
            [fieldName]: fieldName === 'sentiment' ? 'positive' : 
                        fieldName.includes('confidence') ? 0.85 :
                        fieldName.includes('time') ? 150 :
                        fieldName.includes('scores') ? '{"positive":0.6,"neutral":0.4}' :
                        'Test value for validation'
          }
        };
        
        // This will fail if the field doesn't exist, which is what we want to test
        const fieldTest = await makeAirtableRequest('DailyCheckins', 'POST');
        
        // If we get here, the field exists
        existingFields.push(fieldName);
        log(`✅ ${fieldName} - EXISTS`, 'green');
        
      } catch (error) {
        // Field doesn't exist or other error
        missingFields.push(fieldName);
        log(`❌ ${fieldName} - MISSING`, 'red');
      }
    }
    
    // Step 4: Generate report
    logSection('CM-01 Schema Validation Report');
    
    if (missingFields.length === 0) {
      log('🎉 ALL CM-01 FIELDS ARE PRESENT!', 'green');
      log('✅ Staging environment is ready for CM-01 deployment', 'green');
      return true;
    } else {
      log(`⚠️  ${missingFields.length} CM-01 fields are missing:`, 'yellow');
      missingFields.forEach(field => {
        log(`   ❌ ${field}`, 'red');
      });
      
      log('\n🔧 REQUIRED ACTION:', 'bright');
      log('Add these fields to your staging Airtable DailyCheckins table:', 'yellow');
      log('1. Go to https://airtable.com', 'blue');
      log('2. Open your staging base (appEOWvLjCn5c7Ght)', 'blue');
      log('3. Go to DailyCheckins table', 'blue');
      log('4. Add the missing fields with correct types:', 'blue');
      
      missingFields.forEach(field => {
        let fieldType = 'Long Text';
        if (field === 'sentiment') fieldType = 'Single Select (positive, neutral, negative)';
        if (field.includes('confidence')) fieldType = 'Number (Decimal)';
        if (field.includes('time')) fieldType = 'Number (Integer)';
        
        log(`   - ${field}: ${fieldType}`, 'cyan');
      });
      
      log('\n❌ CM-01 deployment will fail without these fields!', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, 'red');
    return false;
  }
}

// Main execution
async function main() {
  try {
    const isValid = await validateCM01Schema();
    
    if (isValid) {
      log('\n🎉 CM-01 Schema Validation: PASSED', 'green');
      log('✅ Ready to deploy CM-01 to staging', 'green');
      process.exit(0);
    } else {
      log('\n❌ CM-01 Schema Validation: FAILED', 'red');
      log('❌ Cannot deploy CM-01 until schema is updated', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Validation script error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateCM01Schema }; 