#!/usr/bin/env node

/**
 * Verify PHQ-4 Test User Setup
 * 
 * This script verifies that the PHQ-4 test users are correctly configured
 * and ready for testing PHQ-4 assessment scheduling.
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://localhost:5432/novara_local',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const TEST_USERS = [
  {
    email: 'phq4-test@novara.com',
    description: 'Primary PHQ-4 Test User'
  },
  {
    email: 'bug009@test.com',
    description: 'Secondary PHQ-4 Test User (BUG-009)'
  }
];

async function verifyUser(email, description) {
  console.log(`\n🔍 Verifying: ${description}`);
  console.log(`📧 Email: ${email}`);
  
  try {
    // Get user and profile
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      console.log('❌ User not found');
      return false;
    }
    
    const user = userQuery.rows[0];
    const profileQuery = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
    const profile = profileQuery.rows[0];
    
    console.log(`👤 User ID: ${user.id}`);
    console.log(`📝 Nickname: ${profile?.nickname || 'Not set'}`);
    console.log(`✅ Baseline Completed: ${profile?.baseline_completed ? 'Yes' : 'No'}`);
    console.log(`📅 Created: ${user.created_at}`);
    
    // Check for existing PHQ-4 assessments
    const phq4Query = await pool.query(`
      SELECT COUNT(*) as count, MAX(occurred_at) as last_assessment
      FROM health_events 
      WHERE user_id = $1 
      AND event_type = 'assessment' 
      AND event_subtype = 'phq4'
    `, [user.id]);
    
    const phq4Data = phq4Query.rows[0];
    console.log(`🧠 PHQ-4 Assessments: ${phq4Data.count}`);
    
    if (phq4Data.count > 0) {
      const daysSince = Math.floor(
        (new Date() - new Date(phq4Data.last_assessment)) / (1000 * 60 * 60 * 24)
      );
      console.log(`📅 Last Assessment: ${phq4Data.last_assessment} (${daysSince} days ago)`);
      console.log(`🚨 Status: ${daysSince >= 14 ? 'Due for PHQ-4' : 'Recent PHQ-4 completed'}`);
    } else {
      console.log('🚨 Status: Ready for first PHQ-4 assessment');
    }
    
    // Check sample check-ins
    const checkinQuery = await pool.query(`
      SELECT COUNT(*) as count, MAX(occurred_at) as latest
      FROM health_events 
      WHERE user_id = $1 
      AND event_type = 'mood'
    `, [user.id]);
    
    const checkinData = checkinQuery.rows[0];
    console.log(`📝 Sample Check-ins: ${checkinData.count}`);
    if (checkinData.count > 0) {
      console.log(`📅 Latest Check-in: ${checkinData.latest}`);
    }
    
    // Verify user is ready for PHQ-4
    // User is ready if onboarding is complete AND they haven't done PHQ-4 (or it's been >14 days)
    const onboardingComplete = profile?.baseline_completed;
    const needsAssessment = phq4Data.count == 0 || 
      (phq4Data.last_assessment && Math.floor((new Date() - new Date(phq4Data.last_assessment)) / (1000 * 60 * 60 * 24)) >= 14);
    
    const isReady = onboardingComplete && needsAssessment;
    console.log(`🎯 PHQ-4 Ready: ${isReady ? '✅ Yes' : '❌ No'}`);
    
    if (!onboardingComplete) {
      console.log('   ❌ Onboarding not completed');
    }
    if (!needsAssessment && phq4Data.count > 0) {
      console.log('   ❌ Recent PHQ-4 assessment exists');
    }
    
    return isReady;
    
  } catch (error) {
    console.error('❌ Error verifying user:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔬 PHQ-4 Test User Verification');
  console.log('═'.repeat(50));
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    let allReady = true;
    
    for (const testUser of TEST_USERS) {
      const isReady = await verifyUser(testUser.email, testUser.description);
      if (!isReady) {
        allReady = false;
      }
    }
    
    console.log('\n' + '═'.repeat(50));
    
    if (allReady) {
      console.log('🎉 All PHQ-4 test users are ready!');
      console.log('\n💡 How to test PHQ-4:');
      console.log('1. Start the development server (Frontend: 4200, Backend: 9002)');
      console.log('2. Login with either test user');
      console.log('3. Look for PHQ-4 prompts on dashboard (when scheduling is implemented)');
      console.log('4. Navigate to /phq4 route directly to test the component');
      console.log('\n⚠️ Note: PHQ-4 smart scheduling (MH-01) is not yet implemented.');
      console.log('   The users are ready, but automatic triggering needs development.');
    } else {
      console.log('❌ Some test users are not ready for PHQ-4 testing');
      console.log('💡 Run the setup script to create/update test users');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
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