#!/usr/bin/env node

/**
 * Update BUG-009 test user for PHQ-4 testing
 * 
 * Updates the existing bug009@test.com user to ensure it's ready for PHQ-4 assessment
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://localhost:5432/novara_local',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const TEST_USER_EMAIL = 'bug009@test.com';

async function findUser(email) {
  console.log(`🔍 Finding user: ${email}`);
  
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length > 0) {
      const profileQuery = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userQuery.rows[0].id]);
      return {
        user: userQuery.rows[0],
        profile: profileQuery.rows[0] || null
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error finding user:', error.message);
    throw error;
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

async function ensureBaselineCompleted(userId) {
  console.log('✅ Ensuring baseline is completed...');
  
  try {
    await pool.query(`
      UPDATE user_profiles SET
        baseline_completed = true,
        updated_at = NOW()
      WHERE user_id = $1
    `, [userId]);
    
    console.log('✅ Baseline completion ensured');
  } catch (error) {
    console.error('❌ Failed to update baseline:', error.message);
  }
}

async function main() {
  console.log('🔄 Updating BUG-009 test user for PHQ-4 testing...\n');
  
  try {
    const userData = await findUser(TEST_USER_EMAIL);
    
    if (!userData) {
      console.log('❌ User not found:', TEST_USER_EMAIL);
      console.log('💡 Please use the main setup script to create users');
      process.exit(1);
    }
    
    console.log('✅ Found user:', userData.user.email);
    console.log('👤 User ID:', userData.user.id);
    
    // Ensure baseline is completed
    await ensureBaselineCompleted(userData.user.id);
    
    // Clear PHQ-4 history to trigger fresh assessment
    await clearPHQ4History(userData.user.id);
    
    console.log('\n🎉 BUG-009 User Updated for PHQ-4 Testing!');
    console.log('═'.repeat(50));
    console.log('📧 Email: bug009@test.com');
    console.log('🔑 Password: Test123!');
    console.log('👤 User ID:', userData.user.id);
    console.log('✅ Onboarding: Completed');
    console.log('🧠 PHQ-4 Status: Ready for assessment');
    console.log('═'.repeat(50));
    console.log('\n✨ This user will be prompted for PHQ-4 assessment on next login.');
    
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
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