#!/usr/bin/env node

/**
 * PHQ-4 Test User Setup Script
 * 
 * Creates or updates a test user account that will be prompted for PHQ-4 assessment on login.
 * 
 * Requirements:
 * - User must have completed onboarding (baseline_completed = true)
 * - User must NOT have completed PHQ-4 yet (or last completion was >14 days ago)
 * - User should be ready for testing PHQ-4 scheduling logic
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://localhost:5432/novara_local',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test user credentials
const TEST_USER = {
  email: 'phq4-test@novara.com',
  nickname: 'PHQ4 Tester',
  baseline_completed: true,
  confidence_meds: 7,
  confidence_costs: 6,
  confidence_overall: 8,
  primary_need: 'emotional_support',
  cycle_stage: 'stimulation',
  timezone: 'America/Los_Angeles',
  email_opt_in: true,
  status: 'active'
};

async function checkDatabase() {
  console.log('🔍 Checking database connection and schema...');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // Check if users table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles', 'assessment_responses')
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Available tables:', tables);
    
    return tables;
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  }
}

async function findExistingUser(email) {
  console.log(`🔍 Checking for existing user: ${email}`);
  
  try {
    // Check both V1 and V2 schema patterns
    let userQuery, profileQuery;
    
    // Try V2 schema first
    try {
      userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userQuery.rows.length > 0) {
        profileQuery = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userQuery.rows[0].id]);
        console.log('📋 Found user in V2 schema');
        return {
          user: userQuery.rows[0],
          profile: profileQuery.rows[0] || null,
          schema: 'v2'
        };
      }
    } catch (err) {
      console.log('ℹ️ V2 schema not available, checking V1...');
    }
    
    // Try V1 schema (legacy users table with all fields)
    try {
      const legacyQuery = await pool.query(`
        SELECT id, email, nickname, baseline_completed, confidence_meds, 
               confidence_costs, confidence_overall, primary_need, cycle_stage,
               timezone, email_opt_in, status, created_at, updated_at
        FROM users 
        WHERE email = $1
      `, [email]);
      
      if (legacyQuery.rows.length > 0) {
        console.log('📋 Found user in V1 schema');
        return {
          user: legacyQuery.rows[0],
          profile: null,
          schema: 'v1'
        };
      }
    } catch (err) {
      console.log('ℹ️ V1 schema not available');
    }
    
    console.log('👤 No existing user found');
    return null;
  } catch (error) {
    console.error('❌ Error searching for user:', error.message);
    throw error;
  }
}

async function checkPHQ4Status(userId) {
  console.log('🧠 Checking PHQ-4 assessment status...');
  
  try {
    // Check for any PHQ-4 assessments in health_events
    const phq4Query = await pool.query(`
      SELECT occurred_at, event_data
      FROM health_events 
      WHERE user_id = $1 
      AND event_type = 'assessment' 
      AND event_subtype = 'phq4'
      ORDER BY occurred_at DESC
      LIMIT 1
    `, [userId]);
    
    if (phq4Query.rows.length > 0) {
      const lastAssessment = phq4Query.rows[0];
      const daysSinceLastAssessment = Math.floor(
        (new Date() - new Date(lastAssessment.occurred_at)) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`📅 Last PHQ-4 completed: ${lastAssessment.occurred_at} (${daysSinceLastAssessment} days ago)`);
      return {
        hasCompleted: true,
        lastCompleted: lastAssessment.occurred_at,
        daysSince: daysSinceLastAssessment,
        isDue: daysSinceLastAssessment >= 14 // Due if 14+ days
      };
    }
    
    console.log('📝 No PHQ-4 assessments found - user will be prompted');
    return {
      hasCompleted: false,
      lastCompleted: null,
      daysSince: null,
      isDue: true
    };
  } catch (error) {
    console.error('❌ Error checking PHQ-4 status:', error.message);
    return {
      hasCompleted: false,
      lastCompleted: null,
      daysSince: null,
      isDue: true
    };
  }
}

async function createUser() {
  console.log('👤 Creating new test user...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = uuidv4();
    
    // Insert into users table
    await client.query(`
      INSERT INTO users (id, email, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
    `, [userId, TEST_USER.email]);
    
    // Insert into user_profiles table (V2 schema)
    await client.query(`
      INSERT INTO user_profiles (
        user_id, nickname, timezone, email_opt_in, status,
        cycle_stage, primary_need, baseline_completed,
        confidence_meds, confidence_costs, confidence_overall,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, [
      userId, TEST_USER.nickname, TEST_USER.timezone, TEST_USER.email_opt_in,
      TEST_USER.status, TEST_USER.cycle_stage, TEST_USER.primary_need,
      TEST_USER.baseline_completed, TEST_USER.confidence_meds,
      TEST_USER.confidence_costs, TEST_USER.confidence_overall
    ]);
    
    await client.query('COMMIT');
    
    console.log('✅ Test user created successfully');
    console.log(`📧 Email: ${TEST_USER.email}`);
    console.log(`👤 Nickname: ${TEST_USER.nickname}`);
    console.log(`✅ Baseline completed: ${TEST_USER.baseline_completed}`);
    
    return userId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to create user:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function updateUser(existingUser) {
  console.log('🔄 Updating existing test user...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (existingUser.schema === 'v2') {
      // Update user_profiles table
      await client.query(`
        UPDATE user_profiles SET
          nickname = $2,
          baseline_completed = $3,
          confidence_meds = $4,
          confidence_costs = $5,
          confidence_overall = $6,
          primary_need = $7,
          cycle_stage = $8,
          updated_at = NOW()
        WHERE user_id = $1
      `, [
        existingUser.user.id, TEST_USER.nickname, TEST_USER.baseline_completed,
        TEST_USER.confidence_meds, TEST_USER.confidence_costs, TEST_USER.confidence_overall,
        TEST_USER.primary_need, TEST_USER.cycle_stage
      ]);
    } else {
      // Update legacy users table
      await client.query(`
        UPDATE users SET
          nickname = $2,
          baseline_completed = $3,
          confidence_meds = $4,
          confidence_costs = $5,
          confidence_overall = $6,
          primary_need = $7,
          cycle_stage = $8,
          updated_at = NOW()
        WHERE id = $1
      `, [
        existingUser.user.id, TEST_USER.nickname, TEST_USER.baseline_completed,
        TEST_USER.confidence_meds, TEST_USER.confidence_costs, TEST_USER.confidence_overall,
        TEST_USER.primary_need, TEST_USER.cycle_stage
      ]);
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Test user updated successfully');
    return existingUser.user.id;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to update user:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function clearPHQ4History(userId) {
  console.log('🧹 Clearing PHQ-4 history to trigger fresh assessment...');
  
  try {
    const result = await pool.query(`
      DELETE FROM health_events 
      WHERE user_id = $1 
      AND event_type = 'assessment' 
      AND event_subtype = 'phq4'
    `, [userId]);
    
    console.log(`🗑️ Cleared ${result.rowCount} PHQ-4 assessment records`);
  } catch (error) {
    console.error('❌ Failed to clear PHQ-4 history:', error.message);
  }
}

async function addSampleCheckins(userId) {
  console.log('📝 Adding sample check-ins for realistic testing...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add 3 days of sample check-ins
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const correlationId = uuidv4();
      
      // Add mood event
      await client.query(`
        INSERT INTO health_events (
          id, user_id, event_type, event_subtype, event_data,
          occurred_at, correlation_id, source
        ) VALUES ($1, $2, 'mood', 'daily_checkin', $3, $4, $5, 'web_app')
      `, [
        uuidv4(), userId, 
        JSON.stringify({ 
          mood: ['hopeful', 'confident', 'optimistic'][i % 3],
          confidence: 7 + i,
          note: `Sample check-in day ${i + 1}`
        }),
        date.toISOString(),
        correlationId
      ]);
      
      // Add medication event
      await client.query(`
        INSERT INTO health_events (
          id, user_id, event_type, event_subtype, event_data,
          occurred_at, correlation_id, source
        ) VALUES ($1, $2, 'medication', 'adherence', $3, $4, $5, 'web_app')
      `, [
        uuidv4(), userId,
        JSON.stringify({ 
          status: 'taken',
          medication: 'Sample medication'
        }),
        date.toISOString(),
        correlationId
      ]);
    }
    
    await client.query('COMMIT');
    console.log('✅ Added 3 days of sample check-ins');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add sample check-ins:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Setting up PHQ-4 test user...\n');
  
  try {
    // Check database
    await checkDatabase();
    
    // Check for existing user
    const existingUser = await findExistingUser(TEST_USER.email);
    
    let userId;
    if (existingUser) {
      userId = await updateUser(existingUser);
      
      // Check current PHQ-4 status
      const phq4Status = await checkPHQ4Status(userId);
      
      if (!phq4Status.isDue) {
        console.log('⚠️ User has recent PHQ-4 - clearing history to trigger fresh assessment');
        await clearPHQ4History(userId);
      }
    } else {
      userId = await createUser();
    }
    
    // Add sample data for realistic testing
    await addSampleCheckins(userId);
    
    console.log('\n🎉 PHQ-4 Test User Setup Complete!');
    console.log('═'.repeat(50));
    console.log('📧 Email: phq4-test@novara.com');
    console.log('🔑 Password: (No password - use test login flow)');
    console.log('👤 User ID:', userId);
    console.log('✅ Onboarding: Completed');
    console.log('🧠 PHQ-4 Status: Ready for assessment');
    console.log('📝 Sample data: 3 days of check-ins added');
    console.log('═'.repeat(50));
    console.log('\n✨ This user will be prompted for PHQ-4 assessment on next login.');
    console.log('🔗 Test via: http://localhost:4200');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };