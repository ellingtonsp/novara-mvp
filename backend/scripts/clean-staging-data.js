#!/usr/bin/env node

/**
 * Clean Staging Data for UAT Testing
 * 
 * Purges staging data and creates clean test dataset for Schema V2 UAT
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanStagingData() {
  console.log('🧹 Cleaning Staging Data for UAT Testing\n');
  console.log('⚠️  This will purge ALL staging data and create clean test dataset');
  console.log('📍 Target: Staging PostgreSQL Database\n');
  
  try {
    // Step 1: Clean existing data
    console.log('1️⃣ Purging existing data...');
    
    await pool.query('BEGIN');
    
    // Clear all data in proper order (respecting foreign keys)
    const clearQueries = [
      'DELETE FROM insight_interactions',
      'DELETE FROM insights', 
      'DELETE FROM assessment_responses',
      'DELETE FROM medication_adherence',
      'DELETE FROM health_events',
      'DELETE FROM user_medications',
      'DELETE FROM user_profiles',
      'DELETE FROM users',
      'DELETE FROM schema_migrations WHERE version != \'v2.0\''  // Keep schema version
    ];
    
    for (const query of clearQueries) {
      try {
        const result = await pool.query(query);
        console.log(`   ✅ ${query.split(' ')[2]}: ${result.rowCount} rows deleted`);
      } catch (err) {
        if (!err.message.includes('does not exist')) {
          console.log(`   ⚠️ ${query}: ${err.message}`);
        }
      }
    }
    
    // Reset sequences
    const resetSequences = [
      'ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS health_events_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS insights_id_seq RESTART WITH 1'
    ];
    
    for (const query of resetSequences) {
      try {
        await pool.query(query);
      } catch (err) {
        // Sequences might not exist, that's ok
      }
    }
    
    await pool.query('COMMIT');
    console.log('   ✅ Data purge complete\n');
    
    // Step 2: Create clean test dataset
    console.log('2️⃣ Creating clean test dataset...');
    
    // Create UAT test users
    const testUsers = [
      {
        email: 'uat-user-1@staging.com',
        nickname: 'UAT User 1',
        primary_need: 'track_mood',
        cycle_stage: 'stable',
        confidence_meds: 8,
        confidence_costs: 7,
        confidence_overall: 8
      },
      {
        email: 'uat-user-2@staging.com', 
        nickname: 'UAT User 2',
        primary_need: 'medication_adherence',
        cycle_stage: 'adjusting',
        confidence_meds: 6,
        confidence_costs: 5,
        confidence_overall: 6
      },
      {
        email: 'schema-v2-staging-test@example.com',
        nickname: 'Schema V2 Test User',
        primary_need: 'track_mood',
        cycle_stage: 'stable',
        confidence_meds: 7,
        confidence_costs: 8,
        confidence_overall: 7
      }
    ];
    
    const userIds = [];
    
    for (const userData of testUsers) {
      // Create user
      const userResult = await pool.query(`
        INSERT INTO users (email, created_at)
        VALUES ($1, NOW())
        RETURNING id, email
      `, [userData.email]);
      
      const userId = userResult.rows[0].id;
      userIds.push({ id: userId, email: userData.email });
      
      // Create user profile
      await pool.query(`
        INSERT INTO user_profiles (
          user_id, nickname, primary_need, cycle_stage,
          confidence_meds, confidence_costs, confidence_overall,
          baseline_completed, status, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        userId, userData.nickname, userData.primary_need, userData.cycle_stage,
        userData.confidence_meds, userData.confidence_costs, userData.confidence_overall,
        true, 'active', 'America/Los_Angeles'
      ]);
      
      console.log(`   ✅ Created user: ${userData.email}`);
    }
    
    // Step 3: Create sample health events for testing
    console.log('\n3️⃣ Creating sample health events...');
    
    const sampleEvents = [
      // Recent events for UAT testing
      {
        user_index: 0,
        event_type: 'mood',
        event_subtype: 'daily_checkin',
        event_data: {
          mood: 'hopeful',
          confidence: 8,
          anxiety_level: 3,
          note: 'Feeling much better today after starting new routine'
        },
        days_ago: 0
      },
      {
        user_index: 0, 
        event_type: 'medication',
        event_subtype: 'daily_status',
        event_data: {
          status: 'taken', 
          medication_name: 'Morning vitamins',
          notes: 'Took with breakfast as planned'
        },
        days_ago: 0
      },
      {
        user_index: 1,
        event_type: 'mood',
        event_subtype: 'daily_checkin', 
        event_data: {
          mood: 'confident',
          confidence: 7,
          anxiety_level: 4,
          note: 'Good progress this week'
        },
        days_ago: 1
      },
      {
        user_index: 1,
        event_type: 'medication',
        event_subtype: 'daily_status',
        event_data: {
          status: 'missed',
          medication_name: 'Evening supplement',
          reason: 'Forgot due to late meeting'
        },
        days_ago: 1
      }
    ];
    
    for (const event of sampleEvents) {
      const userId = userIds[event.user_index].id;
      const occurredAt = new Date();
      occurredAt.setDate(occurredAt.getDate() - event.days_ago);
      
      await pool.query(`
        INSERT INTO health_events (
          user_id, event_type, event_subtype, event_data,
          occurred_at, source
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId, event.event_type, event.event_subtype,
        JSON.stringify(event.event_data), occurredAt, 'staging_setup'
      ]);
    }
    
    console.log(`   ✅ Created ${sampleEvents.length} sample health events`);
    
    // Step 4: Refresh materialized views
    console.log('\n4️⃣ Refreshing analytics views...');
    
    try {
      await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
      await pool.query('REFRESH MATERIALIZED VIEW user_weekly_metrics');
      console.log('   ✅ Materialized views refreshed');
    } catch (err) {
      console.log('   ⚠️ Some materialized views need setup');
    }
    
    // Step 5: Create sample insights
    console.log('\n5️⃣ Creating sample insights...');
    
    const sampleInsights = [
      {
        user_index: 0,
        insight_type: 'positive_trend',
        insight_category: 'achievement',
        title: 'Great Progress This Week!',
        message: 'Your mood has been consistently positive for 5 days in a row. Keep up the excellent work with your routine!',
        priority: 7
      },
      {
        user_index: 1,
        insight_type: 'medication_reminder',
        insight_category: 'recommendation', 
        title: 'Medication Adherence Opportunity',
        message: 'Setting a phone reminder for evening supplements might help maintain your routine.',
        priority: 6
      }
    ];
    
    for (const insight of sampleInsights) {
      const userId = userIds[insight.user_index].id;
      
      await pool.query(`
        INSERT INTO insights (
          user_id, insight_type, insight_category,
          title, message, priority, trigger_type, trigger_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        userId, insight.insight_type, insight.insight_category,
        insight.title, insight.message, insight.priority,
        'staging_setup', JSON.stringify({ created_by: 'clean_staging_script' })
      ]);
    }
    
    console.log(`   ✅ Created ${sampleInsights.length} sample insights`);
    
    // Step 6: Generate summary
    console.log('\n6️⃣ Clean dataset summary...');
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM user_profiles) as profiles,
        (SELECT COUNT(*) FROM health_events) as events,
        (SELECT COUNT(*) FROM insights) as insights
    `);
    
    const stats = summary.rows[0];
    console.log(`   Users: ${stats.users}`);
    console.log(`   Profiles: ${stats.profiles}`);
    console.log(`   Health Events: ${stats.events}`);
    console.log(`   Insights: ${stats.insights}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 STAGING DATA CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n✅ Clean UAT Dataset Ready:');
    console.log('   - 3 test users created');
    console.log('   - Sample health events for testing');
    console.log('   - Analytics views refreshed');
    console.log('   - Sample insights generated');
    
    console.log('\n👥 UAT Test Users:');
    userIds.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n🚀 Ready for UAT Testing!');
    console.log('   Run: node backend/scripts/verify-staging-deployment.js');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Staging cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run cleanup
if (require.main === module) {
  cleanStagingData();
}