// Debug Airtable Connection
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';

async function debugAirtableConnection() {
  console.log('🔍 Debugging Airtable Connection...\n');
  
  // Test a simple user creation to see the exact error
  const testUser = {
    email: `debug-${Date.now()}@example.com`,
    nickname: 'DebugUser',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    timezone: 'America/New_York'
  };
  
  try {
    console.log('Attempting user creation...');
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log('\n🚨 Airtable Connection Issues Detected');
      console.log('Possible causes:');
      console.log('1. Airtable API key expired or invalid');
      console.log('2. Airtable base ID incorrect');
      console.log('3. Railway environment variables not set correctly');
      console.log('4. Airtable table name mismatch');
      
      // Try to extract more specific error info
      if (data.error && data.error.includes('UNAUTHORIZED')) {
        console.log('\n❌ UNAUTHORIZED ERROR - API Key Issue');
        console.log('Action needed: Generate new Airtable API key');
      }
      
      if (data.error && data.error.includes('NOT_FOUND')) {
        console.log('\n❌ NOT_FOUND ERROR - Base ID or Table Issue');
        console.log('Action needed: Verify Airtable base ID and table names');
      }
    } else {
      console.log('\n✅ Airtable connection working!');
    }
    
  } catch (error) {
    console.log(`Network Error: ${error.message}`);
  }
}

// Test if Railway environment variables are properly set
async function testRailwayEnvVars() {
  console.log('\n🔧 Testing Railway Environment Configuration...');
  
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    const health = await healthResponse.json();
    
    console.log('Environment status:');
    console.log(`- Service: ${health.service}`);
    console.log(`- Environment: ${health.environment}`);
    console.log(`- Airtable: ${health.airtable}`);
    console.log(`- JWT: ${health.jwt}`);
    
    if (health.airtable === 'connected') {
      console.log('\n⚠️ Health check shows Airtable as "connected" but user creation fails');
      console.log('This suggests the API key might work for basic connection but not for write operations');
    }
    
  } catch (error) {
    console.log(`Error checking Railway env: ${error.message}`);
  }
}

async function runDebug() {
  await testRailwayEnvVars();
  await debugAirtableConnection();
}

runDebug().catch(console.error); 