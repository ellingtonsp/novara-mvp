require('dotenv').config();
#!/usr/bin/env node

/**
 * Complete Schema V2 Setup
 * Applies remaining functions, views, and triggers
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "process.env.DATABASE_URL";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function completeSchemaV2() {
  console.log('🔧 Completing Schema V2 Setup...\n');
  
  try {
    // 1. Add missing columns
    console.log('1️⃣ Adding missing columns...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await pool.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await pool.query('ALTER TABLE user_medications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await pool.query('ALTER TABLE health_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Columns added\n');
    
    // 2. Create update function
    console.log('2️⃣ Creating update function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Function created\n');
    
    // 3. Create triggers
    console.log('3️⃣ Creating triggers...');
    
    // Drop existing triggers first
    await pool.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await pool.query('DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles');
    await pool.query('DROP TRIGGER IF EXISTS update_user_medications_updated_at ON user_medications');
    
    // Create new triggers
    await pool.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
    
    await pool.query(`
      CREATE TRIGGER update_user_profiles_updated_at 
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
    
    await pool.query(`
      CREATE TRIGGER update_user_medications_updated_at 
      BEFORE UPDATE ON user_medications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
    
    console.log('✅ Triggers created\n');
    
    // 4. Create compatibility view
    console.log('4️⃣ Creating compatibility view...');
    await pool.query('DROP VIEW IF EXISTS daily_checkins_legacy CASCADE');
    await pool.query(`
      CREATE VIEW daily_checkins_legacy AS
      SELECT 
        he.id,
        he.user_id,
        he.event_data->>'mood' as mood_today,
        (he.event_data->>'confidence')::INTEGER as confidence_today,
        he.event_data->>'note' as user_note,
        DATE(he.occurred_at) as date_submitted,
        he.created_at,
        -- Additional fields for compatibility
        (he.event_data->>'anxiety_level')::INTEGER as anxiety_level,
        CASE 
          WHEN he.event_data->'side_effects' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(he.event_data->'side_effects'))
          ELSE NULL 
        END as side_effects,
        CASE 
          WHEN he.event_data->'coping_strategies' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(he.event_data->'coping_strategies'))
          ELSE NULL 
        END as coping_strategies_used
      FROM health_events he
      WHERE he.event_type = 'mood'
    `);
    console.log('✅ Compatibility view created\n');
    
    // 5. Create simple materialized view for testing
    console.log('5️⃣ Creating materialized views...');
    await pool.query('DROP MATERIALIZED VIEW IF EXISTS user_daily_metrics CASCADE');
    await pool.query(`
      CREATE MATERIALIZED VIEW user_daily_metrics AS
      SELECT 
        he.user_id,
        DATE(he.occurred_at) as date,
        COUNT(DISTINCT CASE WHEN event_type = 'mood' THEN id END) as mood_entries,
        COUNT(DISTINCT CASE WHEN event_type = 'medication' THEN id END) as medication_entries,
        COUNT(DISTINCT CASE WHEN event_type = 'symptom' THEN id END) as symptom_entries,
        MAX(he.created_at) as last_updated
      FROM health_events he
      GROUP BY he.user_id, DATE(he.occurred_at)
    `);
    
    // Create index
    await pool.query('CREATE UNIQUE INDEX idx_user_daily_metrics ON user_daily_metrics(user_id, date)');
    
    // Refresh view
    await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
    console.log('✅ Materialized view created\n');
    
    // 6. Verify setup
    console.log('6️⃣ Verifying setup...');
    
    // Check functions
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('update_updated_at')
    `);
    console.log(`   Functions: ${functions.rows.map(r => r.routine_name).join(', ')}`);
    
    // Check triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      AND trigger_name LIKE 'update_%'
      ORDER BY trigger_name
    `);
    console.log(`   Triggers: ${triggers.rows.length} update triggers`);
    
    // Check views
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    console.log(`   Views: ${views.rows.map(r => r.table_name).join(', ')}`);
    
    // Check materialized views
    const matviews = await pool.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
    `);
    console.log(`   Materialized Views: ${matviews.rows.map(r => r.matviewname).join(', ')}`);
    
    console.log('\n✅ Schema V2 setup complete!');
    
    // 7. Create migration status table
    console.log('\n7️⃣ Creating migration tracking...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
    
    await pool.query(`
      INSERT INTO schema_migrations (version, description)
      VALUES ('v2.0', 'Event-sourced health data schema')
      ON CONFLICT (version) DO NOTHING
    `);
    
    console.log('✅ Migration tracking created');
    
    console.log('\n🎉 Schema V2 is ready for use!');
    console.log('\nNext steps:');
    console.log('1. Run data migration: node backend/scripts/migrate-v1-to-v2.js');
    console.log('2. Update backend to use dual-write');
    console.log('3. Test with feature flags');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Run
if (require.main === module) {
  completeSchemaV2();
}