// Staging Environment Configuration
// Use this file to test your staging environment setup

const STAGING_CONFIG = {
  // Airtable Configuration
  AIRTABLE_BASE_ID: 'appEOWvLjCn5c7Ght', // Your staging base
  AIRTABLE_API_KEY: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7',
  
  // Staging Environment URLs (Updated for your setup)
  STAGING_FRONTEND_URL: 'https://novara-mvp-staging.vercel.app',
  STAGING_BACKEND_URL: 'https://novara-staging-production.up.railway.app',
  
  // Environment Variables for Railway Backend
  BACKEND_ENV_VARS: {
    AIRTABLE_API_KEY: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7',
    AIRTABLE_BASE_ID: 'appEOWvLjCn5c7Ght',
    JWT_SECRET: 'staging_super_secret_jwt_key_different_from_prod',
    NODE_ENV: 'staging'
  },
  
  // Environment Variables for Vercel Frontend
  FRONTEND_ENV_VARS: {
    VITE_GA_MEASUREMENT_ID: 'G-STAGING-TEST-ID',
    VITE_API_URL: 'https://novara-staging-production.up.railway.app'
  }
};

async function testStagingAirtableConnection() {
  console.log('🧪 Testing Staging Airtable Connection...\n');
  
  try {
    const response = await fetch(`https://api.airtable.com/v0/${STAGING_CONFIG.AIRTABLE_BASE_ID}/Users?maxRecords=3`, {
      headers: {
        'Authorization': `Bearer ${STAGING_CONFIG.AIRTABLE_API_KEY}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Staging Airtable connection successful!');
      console.log(`   Base ID: ${STAGING_CONFIG.AIRTABLE_BASE_ID}`);
      console.log(`   Records found: ${data.records?.length || 0}`);
      
      if (data.records && data.records.length > 0) {
        console.log('   Available fields:', Object.keys(data.records[0].fields || {}));
      }
      
      console.log('\n🎉 Your staging Airtable base is ready for testing!');
      console.log('   - Safe to create test data');
      console.log('   - No risk to production data');
      console.log('   - Perfect for feature development');
      
    } else {
      console.log('❌ Staging Airtable connection failed');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Connection test failed');
    console.log('   Error:', error.message);
  }
}

async function createTestUser() {
  console.log('\n🧪 Testing user creation in staging base...');
  
  const testUser = {
    email: `staging-test-${Date.now()}@example.com`,
    nickname: 'Staging Test User',
    confidence_meds: 5,
    confidence_costs: 5,
    confidence_overall: 5,
    email_opt_in: true,
    status: 'active'
  };

  try {
    const response = await fetch(`https://api.airtable.com/v0/${STAGING_CONFIG.AIRTABLE_BASE_ID}/Users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STAGING_CONFIG.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: testUser
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test user created successfully in staging!');
      console.log(`   User ID: ${data.id}`);
      console.log(`   Email: ${testUser.email}`);
      console.log('   🎉 Safe to test features without affecting production!');
    } else {
      console.log('❌ Test user creation failed');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ User creation test failed');
    console.log('   Error:', error.message);
  }
}

async function testStagingDeployments() {
  console.log('\n🌐 Testing Staging Environment Deployments...\n');
  
  // Test Backend
  try {
    console.log('1. Testing staging backend health...');
    const backendResponse = await fetch(`${STAGING_CONFIG.STAGING_BACKEND_URL}/api/health`);
    
    if (backendResponse.ok) {
      const healthData = await backendResponse.json();
      console.log('✅ Staging backend is healthy!');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Environment: ${healthData.environment || 'unknown'}`);
    } else {
      console.log('❌ Staging backend health check failed');
      console.log(`   Status: ${backendResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Staging backend unreachable');
    console.log(`   Error: ${error.message}`);
    console.log('   💡 Tip: Check Railway deployment status');
  }
  
  // Test Frontend
  try {
    console.log('\n2. Testing staging frontend accessibility...');
    const frontendResponse = await fetch(STAGING_CONFIG.STAGING_FRONTEND_URL);
    
    if (frontendResponse.ok) {
      console.log('✅ Staging frontend is accessible!');
    } else {
      console.log('❌ Staging frontend not accessible');
      console.log(`   Status: ${frontendResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Staging frontend unreachable');
    console.log(`   Error: ${error.message}`);
    console.log('   💡 Tip: Check Vercel deployment status');
  }
}

console.log('🚀 Staging Environment Configuration');
console.log('=====================================');
console.log('Staging Base ID:', STAGING_CONFIG.AIRTABLE_BASE_ID);
console.log('Frontend URL:', STAGING_CONFIG.STAGING_FRONTEND_URL);
console.log('Backend URL:', STAGING_CONFIG.STAGING_BACKEND_URL);
console.log('Git Branch: staging (auto-deploys to staging environment)');
console.log('');

// Run tests
testStagingAirtableConnection()
  .then(() => createTestUser())
  .then(() => testStagingDeployments())
  .catch(console.error);

module.exports = STAGING_CONFIG; 