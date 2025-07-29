#!/usr/bin/env node

/**
 * Airtable Enhanced Schema Tester
 * Tests if staging/production Airtable schema supports evidence-based features
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

// Test enhanced DailyCheckins fields
async function testEnhancedCheckinFields() {
  log('\nTesting Enhanced DailyCheckins Fields...', 'cyan');
  
  // First get a real user ID to test with
  const usersResponse = await makeAirtableRequest('Users?maxRecords=1');
  if (!usersResponse.success || !usersResponse.data.records.length) {
    log('⚠️  No users found to test with', 'yellow');
    return false;
  }
  
  const testUserId = usersResponse.data.records[0].id;
  
  const testData = {
    fields: {
      user_id: [testUserId], // Use real user ID in array format
      mood_today: 'hopeful',
      confidence_today: 7,
      // Enhanced fields
      anxiety_level: 5,
      took_all_medications: true,
      missed_doses: 0,
      injection_confidence: 8,
      side_effects: JSON.stringify(['headache', 'bloating']),
      appointment_within_3_days: true,
      appointment_anxiety: 4,
      coping_strategies_used: JSON.stringify(['deep_breathing', 'meditation']),
      partner_involved_today: true,
      wish_knew_more_about: JSON.stringify(['side_effects', 'success_rates']),
      date_submitted: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const response = await makeAirtableRequest('DailyCheckins', 'POST', testData);
    
    if (response.success) {
      log('✅ Enhanced DailyCheckins fields SUPPORTED', 'green');
      
      // Clean up test record
      if (response.data.id) {
        await makeAirtableRequest(`DailyCheckins/${response.data.id}`, 'DELETE');
      }
      return true;
    } else {
      log('❌ Enhanced DailyCheckins fields NOT SUPPORTED', 'red');
      if (response.data.error) {
        log(`   Error: ${response.data.error.message || response.data.error}`, 'red');
      }
      return false;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test PHQ4Assessments table
async function testPHQ4AssessmentsTable() {
  log('\nTesting PHQ4Assessments Table...', 'cyan');
  
  // First get a real user ID to test with
  const usersResponse = await makeAirtableRequest('Users?maxRecords=1');
  if (!usersResponse.success || !usersResponse.data.records.length) {
    log('⚠️  No users found to test with', 'yellow');
    return false;
  }
  
  const testUserId = usersResponse.data.records[0].id;
  
  const testData = {
    fields: {
      user_id: [testUserId], // Use real user ID in array format
      total_score: 8,
      anxiety_score: 5,
      depression_score: 3,
      risk_level: 'moderate',
      assessment_date: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const response = await makeAirtableRequest('PHQ4Assessments', 'POST', testData);
    
    if (response.success) {
      log('✅ PHQ4Assessments table EXISTS and ACCEPTS data', 'green');
      
      // Clean up test record
      if (response.data.id) {
        await makeAirtableRequest(`PHQ4Assessments/${response.data.id}`, 'DELETE');
      }
      return true;
    } else {
      log('❌ PHQ4Assessments table NOT FOUND or REJECTED data', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test FVMAnalytics table
async function testFVMAnalyticsTable() {
  log('\nTesting FVMAnalytics Table...', 'cyan');
  
  // First get a real user ID to test with
  const usersResponse = await makeAirtableRequest('Users?maxRecords=1');
  if (!usersResponse.success || !usersResponse.data.records.length) {
    log('⚠️  No users found to test with', 'yellow');
    return false;
  }
  
  const testUserId = usersResponse.data.records[0].id;
  
  const testData = {
    fields: {
      user_id: [testUserId], // Use real user ID in array format
      event_type: 'check_in_preference_selected',
      event_timestamp: new Date().toISOString(),
      event_data: JSON.stringify({
        preference: 'quick_daily',
        reason: 'time_constraints',
        previous_preference: 'full_daily'
      }),
      date: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const response = await makeAirtableRequest('FVMAnalytics', 'POST', testData);
    
    if (response.success) {
      log('✅ FVMAnalytics table EXISTS and ACCEPTS data', 'green');
      
      // Clean up test record
      if (response.data.id) {
        await makeAirtableRequest(`FVMAnalytics/${response.data.id}`, 'DELETE');
      }
      return true;
    } else {
      log('❌ FVMAnalytics table NOT FOUND or REJECTED data', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

// Test check-in preference tracking
async function testCheckinPreferenceTracking() {
  log('\nTesting Check-in Preference Tracking...', 'cyan');
  
  // First, update a user with preference
  const userUpdateData = {
    fields: {
      checkin_preference: 'quick_daily',
      checkin_preference_updated_at: new Date().toISOString()
    }
  };

  try {
    // Get a test user
    const usersResponse = await makeAirtableRequest('Users?maxRecords=1');
    if (!usersResponse.success || !usersResponse.data.records.length) {
      log('⚠️  No users found to test preference update', 'yellow');
      return false;
    }

    const userId = usersResponse.data.records[0].id;
    const updateResponse = await makeAirtableRequest(`Users/${userId}`, 'PATCH', userUpdateData);
    
    if (updateResponse.success) {
      log('✅ User checkin_preference field SUPPORTED', 'green');
      return true;
    } else {
      log('❌ User checkin_preference field NOT SUPPORTED', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runSchemaTests() {
  logHeader('Airtable Enhanced Schema Test for Evidence-Based Features');
  log('Testing staging/production schema compatibility...', 'blue');
  
  const results = {
    enhancedCheckins: false,
    phq4Assessments: false,
    fvmAnalytics: false,
    checkinPreferences: false
  };
  
  // Run all tests
  results.enhancedCheckins = await testEnhancedCheckinFields();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  
  results.phq4Assessments = await testPHQ4AssessmentsTable();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.fvmAnalytics = await testFVMAnalyticsTable();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.checkinPreferences = await testCheckinPreferenceTracking();
  
  // Summary report
  logHeader('Schema Test Summary');
  
  const allPassed = Object.values(results).every(r => r === true);
  const criticalPassed = results.enhancedCheckins && results.checkinPreferences;
  
  log('\nCore Features:', 'bright');
  log(`Enhanced Daily Check-ins: ${results.enhancedCheckins ? '✅ READY' : '❌ NOT READY'}`, results.enhancedCheckins ? 'green' : 'red');
  log(`Check-in Preferences: ${results.checkinPreferences ? '✅ READY' : '❌ NOT READY'}`, results.checkinPreferences ? 'green' : 'red');
  
  log('\nAdvanced Features:', 'bright');
  log(`PHQ-4 Assessments: ${results.phq4Assessments ? '✅ READY' : '❌ NOT READY'}`, results.phq4Assessments ? 'green' : 'red');
  log(`Analytics Tracking: ${results.fvmAnalytics ? '✅ READY' : '❌ NOT READY'}`, results.fvmAnalytics ? 'green' : 'red');
  
  if (allPassed) {
    log('\n🎉 All schema tests PASSED! Ready for full deployment.', 'green');
    return true;
  } else if (criticalPassed) {
    log('\n⚠️  Core features ready, but some advanced features missing.', 'yellow');
    log('The application will work with limited analytics capabilities.', 'yellow');
    return true;
  } else {
    log('\n❌ Critical schema updates missing! Deployment not recommended.', 'red');
    log('Please update Airtable schema before deploying.', 'red');
    return false;
  }
}

// Run tests
if (require.main === module) {
  runSchemaTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ Schema test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runSchemaTests };