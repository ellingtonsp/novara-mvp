#!/usr/bin/env node

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createWeeklyView() {
  console.log('🔧 Creating user_weekly_metrics view...');
  
  try {
    // Drop existing view
    await pool.query('DROP MATERIALIZED VIEW IF EXISTS user_weekly_metrics CASCADE');
    
    // Create weekly metrics view
    await pool.query(`
      CREATE MATERIALIZED VIEW user_weekly_metrics AS
      SELECT 
        user_id,
        DATE_TRUNC('week', date) as week_start,
        COUNT(DISTINCT date) as days_with_data,
        SUM(medications_taken) as total_medications_taken,
        SUM(medications_missed) as total_medications_missed,
        CASE 
          WHEN SUM(medications_taken) + SUM(medications_missed) > 0
          THEN ROUND(100.0 * SUM(medications_taken) / (SUM(medications_taken) + SUM(medications_missed)), 1)
          ELSE NULL
        END as adherence_rate,
        MAX(last_updated) as last_updated
      FROM user_daily_metrics
      GROUP BY user_id, DATE_TRUNC('week', date)
    `);
    
    // Create index
    await pool.query('CREATE INDEX idx_user_weekly_metrics ON user_weekly_metrics(user_id, week_start)');
    
    console.log('✅ Weekly metrics view created successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createWeeklyView();
}