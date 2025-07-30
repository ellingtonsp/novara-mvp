require('dotenv').config();
#!/usr/bin/env node

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "process.env.DATABASE_URL";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAndFixViews() {
  console.log('🔍 Checking materialized view structure...');
  
  try {
    // Check columns in user_daily_metrics
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_daily_metrics'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columns in user_daily_metrics:');
    columns.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // Get sample data
    try {
      const sample = await pool.query('SELECT * FROM user_daily_metrics LIMIT 1');
      console.log('\n📊 Sample row:');
      console.log(sample.rows[0]);
    } catch (err) {
      console.log('\n⚠️ No sample data available');
    }
    
    // Refresh the existing view
    console.log('\n🔄 Refreshing user_daily_metrics...');
    await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
    console.log('✅ user_daily_metrics refreshed');
    
    // Create a simpler weekly view based on what we actually have
    console.log('\n🔧 Creating simplified user_weekly_metrics...');
    
    await pool.query('DROP MATERIALIZED VIEW IF EXISTS user_weekly_metrics CASCADE');
    
    // Create a view based on actual columns available
    await pool.query(`
      CREATE MATERIALIZED VIEW user_weekly_metrics AS
      SELECT 
        user_id,
        DATE_TRUNC('week', date) as week_start,
        COUNT(DISTINCT date) as days_with_data,
        COUNT(DISTINCT CASE WHEN mood_entries > 0 THEN date END) as days_with_mood,
        COUNT(DISTINCT CASE WHEN medication_entries > 0 THEN date END) as days_with_medication,
        SUM(mood_entries) as total_mood_entries,
        SUM(medication_entries) as total_medication_entries,
        SUM(symptom_entries) as total_symptom_entries,
        MAX(last_updated) as last_updated
      FROM user_daily_metrics
      GROUP BY user_id, DATE_TRUNC('week', date)
    `);
    
    // Create index
    await pool.query('CREATE INDEX idx_user_weekly_metrics ON user_weekly_metrics(user_id, week_start)');
    
    console.log('✅ user_weekly_metrics created with available columns');
    
    // Refresh the new view
    await pool.query('REFRESH MATERIALIZED VIEW user_weekly_metrics');
    console.log('✅ user_weekly_metrics refreshed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkAndFixViews();
}