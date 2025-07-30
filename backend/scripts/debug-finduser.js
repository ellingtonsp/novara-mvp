require('dotenv').config();
#!/usr/bin/env node

/**
 * Debug findUserByEmail issue
 */

const { Pool } = require('pg');

const DATABASE_URL = "process.env.DATABASE_URL";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugFindUser() {
  console.log('🔍 Debugging findUserByEmail issue\n');
  
  const testEmail = 'schema-v2-staging-test@example.com';
  
  try {
    // Test 1: Direct query
    console.log('1️⃣ Testing direct user query...');
    const directResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [testEmail]
    );
    console.log('Direct user query result:', directResult.rows.length, 'rows');
    if (directResult.rows.length > 0) {
      console.log('User found:', directResult.rows[0]);
    }
    
    // Test 2: Join query (like in adapter)
    console.log('\n2️⃣ Testing join query...');
    const joinQuery = `
      SELECT 
        u.id, u.email, u.created_at, u.updated_at,
        p.nickname, p.confidence_meds, p.confidence_costs, 
        p.confidence_overall, p.primary_need, p.cycle_stage, 
        p.top_concern, p.timezone, p.email_opt_in, p.status, 
        p.medication_status, p.baseline_completed, p.onboarding_path
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `;
    
    try {
      const joinResult = await pool.query(joinQuery, [testEmail]);
      console.log('Join query result:', joinResult.rows.length, 'rows');
      if (joinResult.rows.length > 0) {
        console.log('✅ Join query successful');
        console.log('User data:', JSON.stringify(joinResult.rows[0], null, 2));
      }
    } catch (joinError) {
      console.error('❌ Join query failed:', joinError.message);
      console.error('This is likely the cause of the 500 error');
    }
    
    // Test 3: Check table schemas
    console.log('\n3️⃣ Checking table schemas...');
    
    const userColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\nUsers table columns:');
    userColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    const profileColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    console.log('\nUser_profiles table columns:');
    profileColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugFindUser();