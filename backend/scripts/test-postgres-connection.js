#!/usr/bin/env node

/**
 * Test PostgreSQL Connection
 * Verifies if the backend can connect to PostgreSQL
 */

const { Pool } = require('pg');

// Test with the staging DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway";

console.log('🔍 Testing PostgreSQL Connection\n');
console.log('DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected at:', result.rows[0].now);
    
    // Test data insertion
    const testEmail = `test-${Date.now()}@example.com`;
    const user = await pool.query(
      'INSERT INTO users (email, nickname) VALUES ($1, $2) RETURNING id, email',
      [testEmail, 'Test User']
    );
    console.log('✅ Created test user:', user.rows[0].email);
    
    // Test check-in with Enhanced fields
    const checkin = await pool.query(`
      INSERT INTO daily_checkins (
        user_id, mood_today, confidence_today, medication_taken,
        anxiety_level, side_effects, coping_strategies_used,
        date_submitted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, anxiety_level, side_effects
    `, [
      user.rows[0].id,
      'hopeful',
      8,
      'yes',
      7,  // anxiety_level - Previously lost!
      ['Mild headache'],  // side_effects - Previously lost!
      ['Exercise', 'Meditation'],  // coping_strategies - Previously lost!
      new Date().toISOString().split('T')[0]
    ]);
    
    console.log('✅ Created check-in with Enhanced fields:');
    console.log('   - anxiety_level:', checkin.rows[0].anxiety_level);
    console.log('   - side_effects:', checkin.rows[0].side_effects);
    
    // Cleanup
    await pool.query('DELETE FROM daily_checkins WHERE user_id = $1', [user.rows[0].id]);
    await pool.query('DELETE FROM users WHERE id = $1', [user.rows[0].id]);
    console.log('✅ Cleanup complete');
    
    console.log('\n🎉 PostgreSQL is working perfectly!');
    console.log('   All Enhanced form fields will be saved.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();