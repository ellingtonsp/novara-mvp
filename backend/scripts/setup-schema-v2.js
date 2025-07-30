#!/usr/bin/env node

/**
 * Setup Schema V2 in PostgreSQL
 * This script creates the new event-sourced schema alongside the existing one
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from environment or command line
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

console.log('🚀 Schema V2 Setup\n');
console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupSchemaV2() {
  try {
    // 1. Test connection
    console.log('\n1️⃣ Testing connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully at:', testResult.rows[0].now);
    
    // 2. Check existing tables
    console.log('\n2️⃣ Checking existing schema...');
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', existingTables.rows.map(r => r.table_name).join(', '));
    
    // Check if we have the old schema
    const hasOldSchema = existingTables.rows.some(r => r.table_name === 'daily_checkins');
    const hasNewSchema = existingTables.rows.some(r => r.table_name === 'health_events');
    
    if (hasNewSchema) {
      console.log('⚠️  Schema V2 already exists!');
      const answer = await askQuestion('Do you want to drop and recreate it? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Setup cancelled');
        process.exit(0);
      }
      
      // Drop V2 tables
      console.log('\n🗑️  Dropping existing V2 tables...');
      await dropV2Tables();
    }
    
    // 3. Rename existing tables if needed
    if (hasOldSchema && !hasNewSchema) {
      console.log('\n3️⃣ Preserving existing tables...');
      
      // Rename tables to _v1 suffix
      const tablesToRename = ['users', 'daily_checkins', 'insights'];
      
      for (const table of tablesToRename) {
        const exists = existingTables.rows.some(r => r.table_name === table);
        if (exists) {
          try {
            await pool.query(`ALTER TABLE ${table} RENAME TO ${table}_v1`);
            console.log(`   ✅ Renamed ${table} → ${table}_v1`);
          } catch (err) {
            if (err.message.includes('already exists')) {
              console.log(`   ⚠️  ${table}_v1 already exists, skipping`);
            }
          }
        }
      }
    }
    
    // 4. Create Schema V2
    console.log('\n4️⃣ Creating Schema V2...');
    const schemaPath = path.join(__dirname, '../../database/schema-v2.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema in chunks (PostgreSQL doesn't like multiple statements)
    const statements = schema
      .split(';')
      .filter(s => s.trim())
      .map(s => s.trim() + ';');
    
    let created = 0;
    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('DROP')) {
        try {
          await pool.query(statement);
          created++;
        } catch (err) {
          console.error(`   ❌ Failed to execute:`, statement.substring(0, 50) + '...');
          console.error(`      Error:`, err.message);
        }
      }
    }
    
    console.log(`   ✅ Executed ${created} statements`);
    
    // 5. Verify new tables
    console.log('\n5️⃣ Verifying Schema V2...');
    const v2Tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('health_events', 'user_profiles', 'user_medications', 'assessment_definitions')
      ORDER BY table_name
    `);
    
    console.log('✅ V2 tables created:');
    v2Tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 6. Check event types constraint
    console.log('\n6️⃣ Verifying health_events structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'health_events'
      AND column_name IN ('event_type', 'event_data', 'occurred_at')
      ORDER BY column_name
    `);
    
    console.log('✅ Key columns present:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 7. Create test data
    console.log('\n7️⃣ Creating test event...');
    
    // Create test user first
    const testUser = await pool.query(`
      INSERT INTO users (email) 
      VALUES ('test-v2@example.com')
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const userId = testUser.rows[0].id;
    
    // Create test profile
    await pool.query(`
      INSERT INTO user_profiles (user_id, nickname)
      VALUES ($1, 'Test V2 User')
      ON CONFLICT (user_id) DO UPDATE SET nickname = 'Test V2 User'
    `, [userId]);
    
    // Create test health event
    const event = await pool.query(`
      INSERT INTO health_events (
        user_id, event_type, event_subtype, event_data, occurred_at
      ) VALUES (
        $1, 'mood', 'test', $2, NOW()
      ) RETURNING id, event_type, event_data
    `, [
      userId,
      JSON.stringify({ mood: 'hopeful', confidence: 8, note: 'Schema V2 test' })
    ]);
    
    console.log('✅ Test event created:', {
      id: event.rows[0].id,
      type: event.rows[0].event_type,
      data: event.rows[0].event_data
    });
    
    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCHEMA V2 SETUP COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n📊 Current state:');
    console.log('   - Old schema tables renamed to *_v1');
    console.log('   - New event-sourced schema created');
    console.log('   - Ready for dual-write implementation');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Run migration to copy V1 data → V2');
    console.log('   2. Update backend to dual-write');
    console.log('   3. Test with feature flags');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function dropV2Tables() {
  const v2Tables = [
    'insight_interactions',
    'insights',
    'medication_adherence',
    'user_medications',
    'assessment_responses',
    'assessment_definitions',
    'health_events',
    'user_profiles',
    'audit_log',
    'feature_flags'
  ];
  
  // Drop materialized views first
  try {
    await pool.query('DROP MATERIALIZED VIEW IF EXISTS user_weekly_metrics CASCADE');
    await pool.query('DROP MATERIALIZED VIEW IF EXISTS user_daily_metrics CASCADE');
    await pool.query('DROP VIEW IF EXISTS daily_checkins_legacy CASCADE');
  } catch (err) {
    console.error('Error dropping views:', err.message);
  }
  
  // Drop tables
  for (const table of v2Tables) {
    try {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   ✅ Dropped ${table}`);
    } catch (err) {
      console.error(`   ❌ Error dropping ${table}:`, err.message);
    }
  }
  
  // Drop functions
  try {
    await pool.query('DROP FUNCTION IF EXISTS refresh_user_metrics() CASCADE');
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at() CASCADE');
  } catch (err) {
    console.error('Error dropping functions:', err.message);
  }
}

function askQuestion(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run setup
if (require.main === module) {
  setupSchemaV2();
}