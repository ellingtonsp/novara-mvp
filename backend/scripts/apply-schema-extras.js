#!/usr/bin/env node

/**
 * Apply Schema V2 Extras (functions, triggers, views)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2] || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyExtras() {
  console.log('📦 Applying Schema V2 Extras...\n');
  
  try {
    const sqlPath = path.join(__dirname, 'setup-schema-v2-extras.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statement blocks
    const statements = sql
      .split(/^-- =====/m)
      .filter(s => s.trim())
      .map(section => {
        // Extract statements from each section
        return section
          .split(';')
          .filter(s => s.trim() && !s.trim().startsWith('--'))
          .map(s => s.trim() + ';');
      })
      .flat();
    
    let successful = 0;
    let failed = 0;
    
    for (const statement of statements) {
      try {
        // Skip pure comments
        if (statement.match(/^--/) || statement.length < 10) continue;
        
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await pool.query(statement);
        successful++;
        console.log('✅ Success\n');
      } catch (err) {
        console.error(`❌ Failed: ${err.message}\n`);
        failed++;
      }
    }
    
    console.log(`\n📊 Summary: ${successful} successful, ${failed} failed`);
    
    // Verify materialized views
    console.log('\n🔍 Verifying components...');
    
    const components = await pool.query(`
      SELECT 
        'function' as type, routine_name as name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      UNION ALL
      SELECT 
        'trigger' as type, trigger_name as name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      UNION ALL
      SELECT 
        'view' as type, table_name as name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      UNION ALL
      SELECT 
        'matview' as type, matviewname as name 
      FROM pg_matviews 
      WHERE schemaname = 'public'
      ORDER BY type, name
    `);
    
    console.log('\n✅ Schema V2 Components:');
    let currentType = '';
    components.rows.forEach(row => {
      if (row.type !== currentType) {
        currentType = row.type;
        console.log(`\n${row.type.toUpperCase()}S:`);
      }
      console.log(`   - ${row.name}`);
    });
    
    // Refresh materialized views with sample data
    console.log('\n🔄 Refreshing materialized views...');
    await pool.query('REFRESH MATERIALIZED VIEW user_daily_metrics');
    await pool.query('REFRESH MATERIALIZED VIEW user_weekly_metrics');
    console.log('✅ Materialized views refreshed');
    
    console.log('\n✅ Schema V2 setup complete with all components!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run
if (require.main === module) {
  applyExtras();
}