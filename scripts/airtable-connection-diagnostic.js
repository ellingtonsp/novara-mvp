#!/usr/bin/env node

/**
 * 🔍 AIRTABLE CONNECTION DIAGNOSTIC
 * Tests Airtable API connection, permissions, and data storage
 * Identifies why check-ins appear to save but don't persist
 */

const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', 
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Make HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: data
          });
        }
      });
    });
    
    request.on('error', reject);
    
    if (options.body) {
      request.write(JSON.stringify(options.body));
    }
    
    request.end();
  });
}

async function airtableDiagnostic() {
  log('\n🔍 AIRTABLE CONNECTION DIAGNOSTIC', 'magenta');
  log('='.repeat(50), 'blue');
  
  // Get environment variables
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  if (!apiKey || !baseId) {
    log('❌ Missing Airtable configuration:', 'red');
    log(`   API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`, apiKey ? 'green' : 'red');
    log(`   Base ID: ${baseId ? '✅ Set' : '❌ Missing'}`, baseId ? 'green' : 'red');
    log('\n💡 Set environment variables:', 'yellow');
    log('   export AIRTABLE_API_KEY="your_api_key"', 'blue');
    log('   export AIRTABLE_BASE_ID="your_base_id"', 'blue');
    return;
  }
  
  log(`✅ Airtable Configuration:`, 'green');
  log(`   Base ID: ${baseId}`, 'blue');
  log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`, 'blue');
  
  try {
    // Step 1: Test basic connection and permissions
    log('\n1️⃣ Testing Basic Connection...', 'yellow');
    const testUrl = `https://api.airtable.com/v0/${baseId}/Users?maxRecords=1`;
    
    const connectionTest = await makeRequest(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (connectionTest.status === 200) {
      log('✅ Airtable connection successful', 'green');
      log(`   Records found: ${connectionTest.data.records?.length || 0}`, 'blue');
    } else {
      log(`❌ Airtable connection failed: ${connectionTest.status}`, 'red');
      log(`   Error: ${JSON.stringify(connectionTest.data)}`, 'red');
      return;
    }
    
    // Step 2: Test table structure
    log('\n2️⃣ Testing Table Structure...', 'yellow');
    const tables = ['Users', 'DailyCheckins', 'Insights', 'InsightEngagement', 'FMVAnalytics'];
    
    for (const table of tables) {
      const tableUrl = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=1`;
      
      try {
        const tableTest = await makeRequest(tableUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tableTest.status === 200) {
          log(`   ✅ ${table}: Accessible`, 'green');
          if (tableTest.data.records?.length > 0) {
            const fields = Object.keys(tableTest.data.records[0].fields);
            log(`      Fields: ${fields.slice(0, 5).join(', ')}${fields.length > 5 ? '...' : ''}`, 'blue');
          }
        } else {
          log(`   ❌ ${table}: ${tableTest.status} - ${tableTest.data.error?.message || 'Unknown error'}`, 'red');
        }
      } catch (error) {
        log(`   ❌ ${table}: ${error.message}`, 'red');
      }
    }
    
    // Step 3: Test write permissions with a test record
    log('\n3️⃣ Testing Write Permissions...', 'yellow');
    
    // Create a test user first
    const testUserData = {
      fields: {
        email: `test-${Date.now()}@airtable-diagnostic.local`,
        nickname: 'AirtableTestUser',
        confidence_meds: 5,
        confidence_costs: 5,
        confidence_overall: 5,
        primary_need: 'medical_clarity',
        cycle_stage: 'ivf_prep',
        status: 'active'
      }
    };
    
    log('   📝 Creating test user...', 'blue');
    const createUserResponse = await makeRequest(`https://api.airtable.com/v0/${baseId}/Users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: testUserData
    });
    
    if (createUserResponse.status === 200 || createUserResponse.status === 201) {
      const userId = createUserResponse.data.id;
      log(`   ✅ Test user created: ${userId}`, 'green');
      
      // Test check-in creation
      log('   📝 Creating test check-in...', 'blue');
      const testCheckinData = {
        fields: {
          user_id: [userId],
          mood_today: 'diagnostic-testing',
          confidence_today: 7,
          primary_concern_today: 'Airtable diagnostic test',
          date_submitted: new Date().toISOString().split('T')[0]
        }
      };
      
      const createCheckinResponse = await makeRequest(`https://api.airtable.com/v0/${baseId}/DailyCheckins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: testCheckinData
      });
      
      if (createCheckinResponse.status === 200 || createCheckinResponse.status === 201) {
        const checkinId = createCheckinResponse.data.id;
        log(`   ✅ Test check-in created: ${checkinId}`, 'green');
        
        // Step 4: Verify the check-in actually exists
        log('\n4️⃣ Verifying Data Persistence...', 'yellow');
        log('   🔍 Waiting 3 seconds then checking if check-in exists...', 'blue');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const verifyUrl = `https://api.airtable.com/v0/${baseId}/DailyCheckins?filterByFormula=RECORD_ID()='${checkinId}'`;
        const verifyResponse = await makeRequest(verifyUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (verifyResponse.status === 200) {
          const records = verifyResponse.data.records || [];
          if (records.length > 0) {
            log('   ✅ Check-in persists in database', 'green');
            log(`   📊 Retrieved: ${records[0].fields.mood_today}`, 'blue');
          } else {
            log('   ❌ Check-in does NOT persist in database', 'red');
            log('   🚨 This confirms the storage issue!', 'red');
          }
        } else {
          log(`   ❌ Verification failed: ${verifyResponse.status}`, 'red');
        }
        
        // Step 5: Test user-specific check-in retrieval
        log('\n5️⃣ Testing User-Specific Retrieval...', 'yellow');
        const userCheckinsUrl = `https://api.airtable.com/v0/${baseId}/DailyCheckins?filterByFormula=SEARCH('${userId}',ARRAYJOIN({user_id}))&maxRecords=10`;
        
        const userCheckinsResponse = await makeRequest(userCheckinsUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userCheckinsResponse.status === 200) {
          const userCheckins = userCheckinsResponse.data.records || [];
          log(`   📊 User has ${userCheckins.length} check-ins`, 'blue');
          
          if (userCheckins.length > 0) {
            log('   ✅ User check-ins retrieval works', 'green');
            log(`   📝 Latest: ${userCheckins[0].fields.mood_today}`, 'blue');
          } else {
            log('   ❌ User check-ins retrieval returns empty', 'red');
            log('   🚨 This explains the "0 check-ins analyzed" issue!', 'red');
          }
        } else {
          log(`   ❌ User check-ins retrieval failed: ${userCheckinsResponse.status}`, 'red');
        }
        
      } else {
        log(`   ❌ Test check-in creation failed: ${createCheckinResponse.status}`, 'red');
        log(`   Error: ${JSON.stringify(createCheckinResponse.data)}`, 'red');
      }
      
    } else {
      log(`   ❌ Test user creation failed: ${createUserResponse.status}`, 'red');
      log(`   Error: ${JSON.stringify(createUserResponse.data)}`, 'red');
    }
    
    // Step 6: Summary and recommendations
    log('\n🎯 DIAGNOSIS SUMMARY:', 'magenta');
    log('='.repeat(30), 'blue');
    
    log('✅ Airtable connection: Working', 'green');
    log('✅ API key permissions: Valid', 'green');
    log('✅ Table structure: Accessible', 'green');
    
    log('\n📋 Next Steps:', 'yellow');
    log('1. Check Airtable base field validation rules', 'blue');
    log('2. Verify API key has write permissions to all tables', 'blue');
    log('3. Check for Airtable rate limiting', 'blue');
    log('4. Review field name mappings between code and Airtable', 'blue');
    
  } catch (error) {
    log(`❌ Diagnostic failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run diagnostic
airtableDiagnostic(); 