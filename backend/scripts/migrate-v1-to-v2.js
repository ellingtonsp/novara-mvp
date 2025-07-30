require('dotenv').config();
#!/usr/bin/env node

/**
 * Migration Script: V1 Data → Schema V2
 * 
 * Migrates existing data to the new event-sourced schema
 * while maintaining backward compatibility
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "process.env.DATABASE_URL";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Starting V1 → V2 Data Migration\n');
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // 1. Check what data we have
    console.log('1️⃣ Analyzing existing data...');
    await analyzeExistingData();
    
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
    try {
      await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
      await pool.query('REFRESH MATERIALIZED VIEW user_weekly_metrics');
    } catch (err) {
      console.log('   ⚠️ Some materialized views not available yet');
    }
    
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

async function analyzeExistingData() {
  // Check for V1 tables
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users_v1', 'daily_checkins_v1', 'insights_v1', 'users', 'daily_checkins', 'insights')
    ORDER BY table_name
  `);
  
  console.log('   Available tables:', tables.rows.map(r => r.table_name).join(', '));
  
  // Count records in each
  for (const table of tables.rows) {
    try {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   ${table.table_name}: ${count.rows[0].count} records`);
    } catch (err) {
      console.log(`   ${table.table_name}: error accessing (${err.message})`);
    }
  }
}

async function migrateUsers() {
  // Try users_v1 first, then users
  const userTables = ['users_v1', 'users'];
  let sourceTable = null;
  
  for (const table of userTables) {
    try {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        )
      `, [table]);
      
      if (exists.rows[0].exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        if (parseInt(count.rows[0].count) > 0) {
          sourceTable = table;
          break;
        }
      }
    } catch (err) {
      continue;
    }
  }
  
  if (!sourceTable) {
    console.log('   No source users table found');
    return;
  }
  
  console.log(`   Using source table: ${sourceTable}`);
  
  // Get column information
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1 AND table_schema = 'public'
  `, [sourceTable]);
  
  const columnNames = columns.rows.map(r => r.column_name);
  console.log(`   Available columns: ${columnNames.join(', ')}`);
  
  // Build migration query based on available columns
  let selectClause = '';
  let profileInsert = '';
  
  if (columnNames.includes('email')) {
    // Basic migration for users
    const result = await pool.query(`
      INSERT INTO users (email, created_at)
      SELECT 
        email,
        COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM ${sourceTable}
      WHERE email IS NOT NULL AND email != ''
      ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id, email
    `);
    
    console.log(`   ✅ Migrated ${result.rowCount} users`);
    
    // Migrate profiles if we have profile columns
    const profileColumns = ['nickname', 'timezone', 'status', 'cycle_stage', 'primary_need'];
    const availableProfileCols = profileColumns.filter(col => columnNames.includes(col));
    
    if (availableProfileCols.length > 0) {
      const profileResult = await pool.query(`
        INSERT INTO user_profiles (
          user_id, nickname, timezone, status
        )
        SELECT 
          u.id,
          COALESCE(s.nickname, 'User'),
          COALESCE(s.timezone, 'America/Los_Angeles'),
          COALESCE(s.status, 'active')
        FROM users u
        JOIN ${sourceTable} s ON u.email = s.email
        ON CONFLICT (user_id) DO UPDATE SET
          nickname = EXCLUDED.nickname,
          timezone = EXCLUDED.timezone,
          status = EXCLUDED.status
      `);
      
      console.log(`   ✅ Migrated ${profileResult.rowCount} user profiles`);
    }
  }
}

async function migrateCheckins() {
  // Try daily_checkins_v1 first, then daily_checkins
  const checkinTables = ['daily_checkins_v1', 'daily_checkins'];
  let sourceTable = null;
  
  for (const table of checkinTables) {
    try {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        )
      `, [table]);
      
      if (exists.rows[0].exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        if (parseInt(count.rows[0].count) > 0) {
          sourceTable = table;
          break;
        }
      }
    } catch (err) {
      continue;
    }
  }
  
  if (!sourceTable) {
    console.log('   No source checkins table found');
    return;
  }
  
  console.log(`   Using source table: ${sourceTable}`);
  
  const checkinCount = await pool.query(`SELECT COUNT(*) FROM ${sourceTable}`);
  const total = parseInt(checkinCount.rows[0].count);
  
  if (total === 0) {
    console.log('   No check-ins to migrate');
    return;
  }
  
  console.log(`   Found ${total} check-ins to migrate`);
  
  // Get columns to understand schema
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
  `, [sourceTable]);
  
  const columnNames = columns.rows.map(r => r.column_name);
  console.log(`   Available columns: ${columnNames.slice(0, 10).join(', ')}...`);
  
  // Migrate in batches
  const batchSize = 100;
  let offset = 0;
  let migrated = 0;
  
  while (offset < total) {
    let checkinQuery = `
      SELECT c.*
      FROM ${sourceTable} c
      ORDER BY c.date_submitted, c.created_at
      LIMIT $1 OFFSET $2
    `;
    
    // If we have old users table, join to get email
    const hasOldUsers = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users_v1' AND table_schema = 'public'
      )
    `);
    
    if (hasOldUsers.rows[0].exists && columnNames.includes('user_id')) {
      checkinQuery = `
        SELECT c.*, u.email
        FROM ${sourceTable} c
        LEFT JOIN users_v1 u ON c.user_id = u.id
        ORDER BY c.date_submitted, c.created_at
        LIMIT $1 OFFSET $2
      `;
    }
    
    const checkins = await pool.query(checkinQuery, [batchSize, offset]);
    
    for (const checkin of checkins.rows) {
      let userId = null;
      
      // Get user ID - try different approaches
      if (checkin.email) {
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [checkin.email]
        );
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        }
      } else if (checkin.user_id) {
        // If user_id is UUID format, try direct lookup
        try {
          const userResult = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [checkin.user_id]
          );
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
          }
        } catch (err) {
          // Not a UUID, skip
        }
      }
      
      if (!userId) {
        console.log(`   ⚠️ Skipping checkin - no user found for: ${checkin.email || checkin.user_id}`);
        continue;
      }
      
      const correlationId = checkin.id || `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const occurredAt = checkin.date_submitted || checkin.created_at || new Date();
      
      // Build event data from available columns
      const eventData = {};
      if (checkin.mood_today) eventData.mood = checkin.mood_today;
      if (checkin.confidence_today) eventData.confidence = checkin.confidence_today;
      if (checkin.anxiety_level) eventData.anxiety_level = checkin.anxiety_level;
      if (checkin.user_note) eventData.note = checkin.user_note;
      if (checkin.primary_concern_today) eventData.primary_concern = checkin.primary_concern_today;
      if (checkin.injection_confidence) eventData.injection_confidence = checkin.injection_confidence;
      if (checkin.partner_involved_today) eventData.partner_involved = checkin.partner_involved_today;
      
      // Create mood event
      if (Object.keys(eventData).length > 0) {
        await pool.query(`
          INSERT INTO health_events (
            user_id, event_type, event_subtype,
            event_data, occurred_at, correlation_id, source
          ) VALUES (
            $1, 'mood', 'daily_checkin',
            $2, $3, $4, 'migration'
          )
        `, [
          userId,
          JSON.stringify(eventData),
          occurredAt,
          correlationId
        ]);
      }
      
      // Create medication event if tracked
      if (checkin.medication_taken && checkin.medication_taken !== 'not tracked') {
        const medData = {
          status: checkin.medication_taken === 'yes' ? 'taken' : 'missed'
        };
        if (checkin.missed_doses) medData.missed_doses = checkin.missed_doses;
        
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
          JSON.stringify(medData),
          occurredAt,
          correlationId
        ]);
      }
      
      // Create symptom event for side effects
      if (checkin.side_effects && checkin.side_effects.length > 0) {
        let symptoms = checkin.side_effects;
        if (typeof symptoms === 'string') {
          try {
            symptoms = JSON.parse(symptoms);
          } catch (e) {
            symptoms = [symptoms];
          }
        }
        
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
            symptoms: symptoms,
            related_to: 'medication'
          }),
          occurredAt,
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
  // Try insights_v1 first, then insights
  const insightTables = ['insights_v1', 'insights'];
  let sourceTable = null;
  
  for (const table of insightTables) {
    try {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        )
      `, [table]);
      
      if (exists.rows[0].exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        if (parseInt(count.rows[0].count) > 0) {
          sourceTable = table;
          break;
        }
      }
    } catch (err) {
      continue;
    }
  }
  
  if (!sourceTable) {
    console.log('   No source insights table found');
    return;
  }
  
  // Check if insights table already has the new schema
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'insights'
  `);
  
  const columnNames = columns.rows.map(r => r.column_name);
  if (columnNames.includes('trigger_type')) {
    console.log('   Insights table already has V2 schema');
    return;
  }
  
  console.log(`   Using source table: ${sourceTable}`);
  
  // Simple migration - just preserve what we can
  try {
    const result = await pool.query(`
      INSERT INTO insights (
        user_id, insight_type, insight_category,
        title, message, priority,
        trigger_type, trigger_data,
        created_at
      )
      SELECT 
        u.id,
        'legacy',
        'general',
        COALESCE(o.insight_title, 'Legacy Insight'),
        COALESCE(o.insight_message, 'Migrated from old system'),
        5,
        'migration',
        json_build_object('original_id', o.insight_id),
        COALESCE(o.created_at, NOW())
      FROM ${sourceTable} o
      JOIN users u ON (
        -- Try to match by email if available
        CASE 
          WHEN o.user_id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' 
          THEN u.email = o.user_id
          ELSE FALSE
        END
      )
      ON CONFLICT DO NOTHING
    `);
    
    console.log(`   ✅ Migrated ${result.rowCount} insights`);
  } catch (err) {
    console.log(`   ⚠️ Could not migrate insights: ${err.message}`);
  }
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
  
  if (eventTypes.rows.length > 0) {
    console.log('\n   Events by type:');
    eventTypes.rows.forEach(row => {
      console.log(`     ${row.event_type}: ${row.count}`);
    });
  }
  
  console.log('\n✅ Migration complete! Schema V2 is ready for use.');
  console.log('\nNext steps:');
  console.log('1. Update backend to dual-write to both schemas');
  console.log('2. Test compatibility layer');
  console.log('3. Update frontend gradually with feature flags');
}

// Run migration
if (require.main === module) {
  migrate();
}