#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway"
});

async function testInsightsTable() {
  try {
    // 1. Check if insights table exists
    console.log('1. Checking insights table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'insights'
      );
    `);
    console.log('   Table exists:', tableCheck.rows[0].exists);
    
    // 2. Check table structure
    console.log('\n2. Checking table columns...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'insights'
      ORDER BY ordinal_position;
    `);
    console.log('   Columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 3. Try to insert a test insight
    console.log('\n3. Testing insert...');
    const testData = {
      user_id: '08d84601-5f0c-4384-b71a-0751edf9b508',
      insight_type: 'daily_insight',
      title: 'Test Insight',
      message: 'This is a test',
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      context_data: JSON.stringify({ test: true })
    };
    
    try {
      const result = await pool.query(`
        INSERT INTO insights (user_id, insight_type, title, message, status, date, context_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, Object.values(testData));
      
      console.log('✅ Insert successful:', result.rows[0].id);
      
      // Clean up
      await pool.query('DELETE FROM insights WHERE id = $1', [result.rows[0].id]);
      console.log('   Test record cleaned up');
      
    } catch (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('   Detail:', insertError.detail);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testInsightsTable();