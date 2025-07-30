#!/usr/bin/env node

/**
 * Migration Script: Current Schema → Schema V2
 * 
 * Migrates existing data to the new event-sourced schema
 * while maintaining backward compatibility
 */

const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  console.log('🚀 Starting Schema V2 Migration\n');
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // 1. Create new schema
    console.log('1️⃣ Creating Schema V2 tables...');
    const schemaSQL = require('fs').readFileSync(
      require('path').join(__dirname, '../../database/schema-v2.sql'), 
      'utf8'
    );
    await pool.query(schemaSQL);
    console.log('✅ Schema V2 created');
    
    // 2. Migrate users
    console.log('\n2️⃣ Migrating users...');
    await migrateUsers();
    
    // 3. Migrate daily check-ins to health events
    console.log('\n3️⃣ Migrating daily check-ins to health events...');
    await migrateCheckins();
    
    // 4. Migrate insights
    console.log('\n4️⃣ Migrating insights...');
    await migrateInsights();
    
    // 5. Create initial assessment definitions
    console.log('\n5️⃣ Creating assessment definitions...');
    await createAssessmentDefinitions();
    
    // 6. Refresh materialized views
    console.log('\n6️⃣ Refreshing materialized views...');
    await pool.query('SELECT refresh_user_metrics()');
    
    // Commit transaction
    await pool.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    
    // Show statistics
    await showMigrationStats();
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function migrateUsers() {
  // Check if old users table exists
  const oldTableExists = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
      AND table_schema = 'public'
    )
  `);
  
  if (!oldTableExists.rows[0].exists) {
    console.log('   No existing users table found');
    return;
  }
  
  // Get column information
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
  `);
  
  const columnNames = columns.rows.map(r => r.column_name);
  const hasOldSchema = columnNames.includes('nickname');
  
  if (hasOldSchema) {
    // Rename old table
    await pool.query('ALTER TABLE users RENAME TO users_old');
    
    // Create new users table (from schema-v2.sql)
    // Already created above
    
    // Migrate data
    const result = await pool.query(`
      INSERT INTO users (id, email, created_at)
      SELECT 
        COALESCE(id::uuid, gen_random_uuid()),
        email,
        COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM users_old
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    
    console.log(`   ✅ Migrated ${result.rowCount} users`);
    
    // Migrate profiles
    await pool.query(`
      INSERT INTO user_profiles (
        user_id, nickname, timezone, email_opt_in, status,
        cycle_stage, primary_need, onboarding_path, baseline_completed,
        confidence_meds, confidence_costs, confidence_overall
      )
      SELECT 
        u.id,
        COALESCE(o.nickname, 'User'),
        COALESCE(o.timezone, 'America/Los_Angeles'),
        COALESCE(o.email_opt_in, true),
        COALESCE(o.status, 'active'),
        o.cycle_stage,
        o.primary_need,
        o.onboarding_path,
        COALESCE(o.baseline_completed, false),
        COALESCE(o.confidence_meds, 5),
        COALESCE(o.confidence_costs, 5),
        COALESCE(o.confidence_overall, 5)
      FROM users u
      JOIN users_old o ON u.email = o.email
    `);
    
    console.log('   ✅ Migrated user profiles');
  }
}

async function migrateCheckins() {
  const checkinCount = await pool.query('SELECT COUNT(*) FROM daily_checkins');
  const total = parseInt(checkinCount.rows[0].count);
  
  if (total === 0) {
    console.log('   No check-ins to migrate');
    return;
  }
  
  console.log(`   Found ${total} check-ins to migrate`);
  
  // Migrate in batches
  const batchSize = 1000;
  let offset = 0;
  let migrated = 0;
  
  while (offset < total) {
    const checkins = await pool.query(`
      SELECT 
        c.*,
        u.email
      FROM daily_checkins c
      JOIN users_old u ON c.user_id = u.id
      ORDER BY c.date_submitted, c.created_at
      LIMIT $1 OFFSET $2
    `, [batchSize, offset]);
    
    for (const checkin of checkins.rows) {
      const correlationId = checkin.id;
      
      // Get new user_id
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [checkin.email]
      );
      
      if (userResult.rows.length === 0) continue;
      
      const userId = userResult.rows[0].id;
      
      // Create mood event
      await pool.query(`
        INSERT INTO health_events (
          id, user_id, event_type, event_subtype,
          event_data, occurred_at, correlation_id, source
        ) VALUES (
          $1, $2, 'mood', 'daily_checkin',
          $3, $4, $5, 'migration'
        )
      `, [
        checkin.id, // Preserve original ID
        userId,
        JSON.stringify({
          mood: checkin.mood_today,
          confidence: checkin.confidence_today,
          anxiety_level: checkin.anxiety_level,
          note: checkin.user_note,
          primary_concern: checkin.primary_concern_today,
          // Preserve any enhanced fields
          injection_confidence: checkin.injection_confidence,
          partner_involved: checkin.partner_involved_today
        }),
        checkin.date_submitted,
        correlationId
      ]);
      
      // Create medication event if tracked
      if (checkin.medication_taken && checkin.medication_taken !== 'not tracked') {
        await pool.query(`
          INSERT INTO health_events (
            user_id, event_type, event_subtype,
            event_data, occurred_at, correlation_id, source
          ) VALUES (
            $1, 'medication', 'daily_status',
            $2, $3, $4, 'migration'
          )
        `, [
          userId,
          JSON.stringify({
            status: checkin.medication_taken === 'yes' ? 'taken' : 'missed',
            missed_doses: checkin.missed_doses
          }),
          checkin.date_submitted,
          correlationId
        ]);
      }
      
      // Create symptom event for side effects
      if (checkin.side_effects && checkin.side_effects.length > 0) {
        await pool.query(`
          INSERT INTO health_events (
            user_id, event_type, event_subtype,
            event_data, occurred_at, correlation_id, source
          ) VALUES (
            $1, 'symptom', 'side_effect',
            $2, $3, $4, 'migration'
          )
        `, [
          userId,
          JSON.stringify({
            symptoms: checkin.side_effects,
            related_to: 'medication'
          }),
          checkin.date_submitted,
          correlationId
        ]);
      }
      
      migrated++;
    }
    
    offset += batchSize;
    console.log(`   Migrated ${migrated}/${total} check-ins...`);
  }
  
  console.log(`   ✅ Migrated ${migrated} check-ins to health events`);
}

async function migrateInsights() {
  // Check if old insights table exists
  const tableExists = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'insights'
      AND table_schema = 'public'
    )
  `);
  
  if (!tableExists.rows[0].exists) {
    console.log('   No existing insights table');
    return;
  }
  
  // Check if it's the old schema
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'insights'
  `);
  
  const columnNames = columns.rows.map(r => r.column_name);
  if (columnNames.includes('trigger_type')) {
    console.log('   Insights table already migrated');
    return;
  }
  
  // Rename old table and migrate
  await pool.query('ALTER TABLE insights RENAME TO insights_old');
  
  const result = await pool.query(`
    INSERT INTO insights (
      user_id, insight_type, insight_category,
      title, message, priority,
      trigger_type, trigger_data,
      created_at
    )
    SELECT 
      u.id,
      o.insight_type,
      CASE 
        WHEN o.insight_type LIKE '%achievement%' THEN 'achievement'
        WHEN o.insight_type LIKE '%risk%' THEN 'risk'
        ELSE 'recommendation'
      END,
      o.insight_title,
      o.insight_message,
      5, -- default priority
      'migration',
      json_build_object('insight_id', o.insight_id),
      o.created_at
    FROM insights_old o
    JOIN users_old uo ON o.user_id = uo.email
    JOIN users u ON u.email = uo.email
  `);
  
  console.log(`   ✅ Migrated ${result.rowCount} insights`);
}

async function createAssessmentDefinitions() {
  // Create PHQ-4 definition
  await pool.query(`
    INSERT INTO assessment_definitions (
      name, version, assessment_type, questions, scoring_logic
    ) VALUES (
      'PHQ-4', '1.0', 'standard',
      $1::jsonb,
      $2::jsonb
    ) ON CONFLICT (name, version) DO NOTHING
  `, [
    JSON.stringify([
      {
        id: 'q1',
        text: 'Feeling nervous, anxious, or on edge',
        type: 'scale',
        scale: { min: 0, max: 3, labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] }
      },
      {
        id: 'q2',
        text: 'Not being able to stop or control worrying',
        type: 'scale',
        scale: { min: 0, max: 3, labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] }
      },
      {
        id: 'q3',
        text: 'Feeling down, depressed, or hopeless',
        type: 'scale',
        scale: { min: 0, max: 3, labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] }
      },
      {
        id: 'q4',
        text: 'Little interest or pleasure in doing things',
        type: 'scale',
        scale: { min: 0, max: 3, labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] }
      }
    ]),
    JSON.stringify({
      anxiety: 'sum(q1, q2)',
      depression: 'sum(q3, q4)',
      total: 'sum(q1, q2, q3, q4)',
      severity: {
        minimal: { min: 0, max: 2 },
        mild: { min: 3, max: 5 },
        moderate: { min: 6, max: 8 },
        severe: { min: 9, max: 12 }
      }
    })
  ]);
  
  console.log('   ✅ Created PHQ-4 assessment definition');
}

async function showMigrationStats() {
  console.log('\n📊 Migration Statistics:');
  
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM user_profiles) as profiles,
      (SELECT COUNT(*) FROM health_events) as events,
      (SELECT COUNT(DISTINCT user_id) FROM health_events) as active_users,
      (SELECT COUNT(*) FROM insights) as insights
  `);
  
  const s = stats.rows[0];
  console.log(`   Users: ${s.users}`);
  console.log(`   Profiles: ${s.profiles}`);
  console.log(`   Health Events: ${s.events}`);
  console.log(`   Active Users: ${s.active_users}`);
  console.log(`   Insights: ${s.insights}`);
  
  // Event breakdown
  const eventTypes = await pool.query(`
    SELECT event_type, COUNT(*) as count
    FROM health_events
    GROUP BY event_type
    ORDER BY count DESC
  `);
  
  console.log('\n   Events by type:');
  eventTypes.rows.forEach(row => {
    console.log(`     ${row.event_type}: ${row.count}`);
  });
}

// Run migration
if (require.main === module) {
  migrate();
}