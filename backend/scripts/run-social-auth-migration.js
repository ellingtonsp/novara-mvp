#!/usr/bin/env node

/**
 * Run social auth migration
 */

const fs = require('fs').promises;
const path = require('path');
const { getDatabaseAdapter } = require('../config/database');

async function runMigration() {
  console.log('🔄 Running social auth migration...\n');
  
  try {
    // Initialize database first
    const { initializeDatabase } = require('../config/database');
    await initializeDatabase();
    
    const db = getDatabaseAdapter();
    
    if (!db || (!db.isPostgres && !db.isUsingLocalDatabase())) {
      console.log('❌ Social authentication requires PostgreSQL');
      console.log('   Current database type:', process.env.DATABASE_TYPE || 'airtable');
      return;
    }

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add-social-auth.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📄 Applying migration: add-social-auth.sql');
    
    // Execute migration
    await db.localDb.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Verifying tables...');
    
    // Verify tables exist
    const tableCheck = await db.localDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_auth_providers'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ user_auth_providers table created');
      
      // Check columns
      const columnCheck = await db.localDb.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_auth_providers'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table structure:');
      columnCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('\n✨ Social auth database setup complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(console.error);