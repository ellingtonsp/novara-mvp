#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR@switchyard.proxy.rlwy.net:58017/railway"
});

async function checkUsers() {
  try {
    const result = await pool.query(`
      SELECT u.email, p.nickname, u.created_at 
      FROM users u 
      JOIN user_profiles p ON u.id = p.user_id 
      ORDER BY u.created_at DESC 
      LIMIT 10
    `);
    
    console.log('Users in staging database:');
    result.rows.forEach(user => {
      console.log(`- ${user.email} (${user.nickname}) - created: ${user.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();