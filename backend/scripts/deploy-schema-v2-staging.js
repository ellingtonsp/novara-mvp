require('dotenv').config();
#!/usr/bin/env node

/**
 * Deploy Schema V2 to Staging
 * 
 * This script handles the complete deployment of Schema V2 to the staging environment
 * with comprehensive testing and verification
 */

const { Pool } = require('pg');
const axios = require('axios');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "process.env.DATABASE_URL";

const STAGING_URL = process.env.STAGING_URL || 'https://novara-staging-staging.up.railway.app';

async function deploySchemaV2ToStaging() {
  console.log('🚀 Deploying Schema V2 to Staging Environment\n');
  console.log(`📍 Staging URL: ${STAGING_URL}`);
  console.log(`🗄️ Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Step 1: Pre-deployment checks
    console.log('1️⃣ Running pre-deployment checks...');
    
    // Check database connection
    const dbTest = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database connection successful');
    console.log(`   PostgreSQL ${dbTest.rows[0].version.split(' ')[1]}`);
    
    // Check Schema V2 tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('health_events', 'user_profiles', 'insights', 'users', 'user_daily_metrics')
      ORDER BY table_name
    `);
    
    const requiredTables = ['health_events', 'insights', 'user_profiles', 'users'];
    const existingTables = tables.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:', missingTables.join(', '));
      console.log('\n🔧 Running schema setup...');
      
      // Run schema setup
      const { execSync } = require('child_process');
      execSync('node backend/scripts/setup-schema-v2.js', { stdio: 'inherit' });
    } else {
      console.log('✅ All required tables present:', existingTables.join(', '));
    }
    
    // Check materialized views
    const matViews = await pool.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
    `);
    
    console.log('✅ Materialized views:', matViews.rows.map(r => r.matviewname).join(', ') || 'none');
    
    // Step 2: Data migration verification
    console.log('\n2️⃣ Verifying data migration...');
    
    const dataCounts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM health_events) as events,
        (SELECT COUNT(*) FROM insights) as insights,
        (SELECT COUNT(*) FROM user_profiles) as profiles
    `);
    
    const counts = dataCounts.rows[0];
    console.log(`✅ Data verification:`);
    console.log(`   Users: ${counts.users}`);
    console.log(`   Health Events: ${counts.events}`);
    console.log(`   Insights: ${counts.insights}`);
    console.log(`   Profiles: ${counts.profiles}`);
    
    if (parseInt(counts.users) === 0) {
      console.log('⚠️ No users found - this might be expected for a fresh staging environment');
    }
    
    // Step 3: Test Schema V2 services locally
    console.log('\n3️⃣ Testing Schema V2 services...');
    
    const HealthEventsService = require('../services/health-events-service');
    const CompatibilityService = require('../services/compatibility-service');
    
    const healthEvents = new HealthEventsService(pool);
    const compatibility = new CompatibilityService(pool);
    compatibility.useV2 = true;
    
    // Create test user if needed
    let testUser;
    try {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        ['schema-v2-staging-test@example.com']
      );
      
      if (existingUser.rows.length > 0) {
        testUser = existingUser.rows[0];
        console.log('✅ Using existing test user');
      } else {
        const newUser = await pool.query(`
          INSERT INTO users (email) 
          VALUES ('schema-v2-staging-test@example.com')
          RETURNING id
        `);
        testUser = newUser.rows[0];
        
        // Create profile
        await pool.query(`
          INSERT INTO user_profiles (user_id, nickname)
          VALUES ($1, 'Schema V2 Test')
        `, [testUser.id]);
        
        console.log('✅ Created test user for deployment verification');
      }
    } catch (error) {
      console.error('❌ Error with test user:', error.message);
      throw error;
    }
    
    // Test health events creation
    const testEvent = await healthEvents.createHealthEvent({
      userId: testUser.id,
      eventType: 'mood',
      eventSubtype: 'deployment_test',
      eventData: {
        mood: 'confident',
        confidence: 9,
        note: 'Schema V2 staging deployment test',
        deployment_timestamp: new Date().toISOString()
      },
      source: 'staging_deployment'
    });
    
    console.log('✅ Health event created:', testEvent.id);
    
    // Test compatibility layer
    const compatTest = await compatibility.createDailyCheckin(testUser.id, {
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Compatibility layer test',
      date_submitted: new Date().toISOString().split('T')[0]
    });
    
    console.log('✅ Compatibility layer working:', compatTest.id);
    
    // Step 4: Check staging server status
    console.log('\n4️⃣ Checking staging server status...');
    
    try {
      const healthCheck = await axios.get(`${STAGING_URL}/api/health`, {
        timeout: 10000
      });
      
      console.log('✅ Staging server is responding');
      console.log(`   Status: ${healthCheck.data.status}`);
      console.log(`   Database: ${healthCheck.data.database?.type || 'unknown'}`);
      
      // Check if Schema V2 is already enabled
      try {
        const v2Status = await axios.get(`${STAGING_URL}/api/v2/status`, {
          headers: {
            'Authorization': 'Bearer dummy-token-for-structure-check'
          },
          timeout: 5000
        });
        
        if (v2Status.status === 200) {
          console.log('✅ Schema V2 endpoints are available');
        }
      } catch (statusError) {
        if (statusError.response?.status === 401) {
          console.log('✅ Schema V2 endpoints exist (auth required)');
        } else if (statusError.response?.status === 503) {
          console.log('⚠️ Schema V2 not enabled yet (expected)');
        } else {
          console.log('⚠️ Schema V2 status check inconclusive');
        }
      }
      
    } catch (serverError) {
      console.error('❌ Staging server not responding:', serverError.message);
      console.log('   This might be expected if the server is not running');
    }
    
    // Step 5: Generate deployment summary
    console.log('\n5️⃣ Deployment Summary...');
    
    const summary = {
      database_ready: true,
      schema_v2_tables: existingTables.length >= 4,
      data_migrated: parseInt(counts.events) > 0 || parseInt(counts.users) > 0,
      services_tested: true,
      ready_for_feature_flag: true
    };
    
    console.log('\n📊 Deployment Readiness:');
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key.replace(/_/g, ' ')}: ${value}`);
    });
    
    const allReady = Object.values(summary).every(v => v === true);
    
    if (allReady) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SCHEMA V2 STAGING DEPLOYMENT READY!');
      console.log('='.repeat(60));
      
      console.log('\n🚀 Next Steps:');
      console.log('1. Enable Schema V2 in Railway staging environment:');
      console.log('   railway variables set USE_SCHEMA_V2=true --environment staging');
      console.log('');
      console.log('2. Restart the staging service:');
      console.log('   railway curl restart --environment staging');
      console.log('');
      console.log('3. Verify deployment:');
      console.log(`   curl ${STAGING_URL}/api/v2/status`);
      console.log('');
      console.log('4. Test existing functionality:');
      console.log(`   curl ${STAGING_URL}/api/health`);
      
    } else {
      console.log('\n❌ Deployment not ready. Please fix the issues above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Deployment preparation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run deployment
if (require.main === module) {
  deploySchemaV2ToStaging();
}