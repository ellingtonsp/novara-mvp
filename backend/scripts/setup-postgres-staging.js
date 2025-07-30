#!/usr/bin/env node

/**
 * PostgreSQL Setup Script for Staging
 * 
 * This script helps initialize the PostgreSQL database in Railway staging
 * 
 * Usage: 
 * 1. Set DATABASE_URL environment variable
 * 2. Run: node backend/scripts/setup-postgres-staging.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from environment or command line
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.log(`
❌ DATABASE_URL not found!

To set up PostgreSQL in Railway staging:

1. Go to your Railway project dashboard
2. Click on the PostgreSQL service
3. Go to the "Connect" tab
4. Copy the DATABASE_URL

Then run one of these:
- DATABASE_URL="postgresql://..." node backend/scripts/setup-postgres-staging.js
- railway run -s <postgres-service-name> node backend/scripts/setup-postgres-staging.js
`);
  process.exit(1);
}

console.log('🐘 PostgreSQL Setup for Staging\n');
console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    // Test connection
    console.log('\n1️⃣ Testing connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully at:', testResult.rows[0].now);
    
    // Read schema file
    console.log('\n2️⃣ Reading schema file...');
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');
    
    // Execute schema
    console.log('\n3️⃣ Creating tables...');
    await pool.query(schema);
    console.log('✅ Tables created successfully');
    
    // Verify tables
    console.log('\n4️⃣ Verifying tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('✅ Found tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check Enhanced form fields
    console.log('\n5️⃣ Verifying Enhanced form fields...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'daily_checkins'
      AND column_name IN ('anxiety_level', 'side_effects', 'coping_strategies_used', 'phq4_score')
      ORDER BY column_name
    `);
    
    console.log('✅ Enhanced fields present:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ PostgreSQL setup complete!');
    console.log('\nNext steps:');
    console.log('1. The staging deployment will auto-detect PostgreSQL');
    console.log('2. Run: railway run -s <your-backend-service> npm run db:migrate');
    console.log('3. Test the Enhanced form - all fields will now be saved!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables already exist. To reset:');
      console.log('   Drop all tables and run this script again');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();