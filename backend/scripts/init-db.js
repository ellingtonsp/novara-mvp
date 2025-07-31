#!/usr/bin/env node

// Initialize production database schema
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Connecting to database...');
    await client.connect();
    
    // Check if tables already exist
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles', 'health_events', 'insights')
      ORDER BY table_name;
    `);
    
    if (existingTables.rows.length > 0) {
      console.log('📊 Found existing tables:');
      existingTables.rows.forEach(row => console.log(`  - ${row.table_name}`));
      console.log('✅ Database already initialized, skipping schema creation');
      return;
    }
    
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, '../database/schema-v2-production.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Executing schema...');
    await client.query(schema);
    
    console.log('✅ Database schema initialized successfully!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Stack trace:', error.stack);
    // Don't exit with error if tables already exist
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist, continuing...');
      return;
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();