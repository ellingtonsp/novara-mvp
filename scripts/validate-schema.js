#!/usr/bin/env node

/**
 * 🗄️ Schema Validation Script
 * Validates database schema consistency and table names
 */

const path = require('path');

// Try to require better-sqlite3 from backend directory
let Database;
try {
  // Try to load from backend node_modules
  const backendPath = path.join(__dirname, '../backend');
  const modulePath = path.join(backendPath, 'node_modules/better-sqlite3');
  Database = require(modulePath);
} catch (err) {
  try {
    // Fallback to global require
    Database = require('better-sqlite3');
  } catch (err2) {
    console.error('❌ better-sqlite3 module not found. Please run from backend directory.');
    console.error('Try: cd backend && node ../scripts/validate-schema.js');
    process.exit(1);
  }
}

const DB_PATH = path.join(__dirname, '../backend/data/novara-local.db');

// Expected table names based on current schema
const EXPECTED_TABLES = [
  'users',
  'daily_checkins', 
  'insights',
  'insight_engagement',
  'fmv_analytics'
];

// Expected user table columns
const EXPECTED_USER_COLUMNS = [
  'id',
  'email',
  'nickname',
  'confidence_meds',
  'confidence_costs', 
  'confidence_overall',
  'primary_need',
  'cycle_stage',
  'top_concern',
  'timezone',
  'email_opt_in',
  'status',
  'medication_status',
  'medication_status_updated',
  'baseline_completed',
  'onboarding_path',
  'created_at'
];

async function validateSchema() {
  console.log('🗄️ Schema Validation');
  console.log('===================');
  console.log(`Database: ${DB_PATH}`);
  console.log('');

  try {
    const db = new Database(DB_PATH);
    console.log('✅ Database connected successfully');
    console.log('');

    // Get all table names
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    
    console.log('📋 Found Tables:');
    tableNames.forEach(table => console.log(`  - ${table}`));
    console.log('');

    // Check for expected tables
    console.log('🔍 Validating Expected Tables:');
    let allTablesFound = true;
    EXPECTED_TABLES.forEach(expectedTable => {
      const found = tableNames.includes(expectedTable);
      console.log(`  ${found ? '✅' : '❌'} ${expectedTable}`);
      if (!found) allTablesFound = false;
    });
    console.log('');

    // Check for unexpected tables
    const unexpectedTables = tableNames.filter(table => !EXPECTED_TABLES.includes(table));
    if (unexpectedTables.length > 0) {
      console.log('⚠️ Unexpected Tables Found:');
      unexpectedTables.forEach(table => console.log(`  - ${table}`));
      console.log('');
    }

    // Validate users table structure
    if (tableNames.includes('users')) {
      console.log('👥 Validating Users Table Structure:');
      const columns = db.prepare("PRAGMA table_info(users)").all();
      const columnNames = columns.map(c => c.name);
      
      console.log('  Found columns:', columnNames.join(', '));
      console.log('');

      // Check for expected columns
      console.log('🔍 Validating Expected User Columns:');
      let allColumnsFound = true;
      EXPECTED_USER_COLUMNS.forEach(expectedColumn => {
        const found = columnNames.includes(expectedColumn);
        console.log(`  ${found ? '✅' : '❌'} ${expectedColumn}`);
        if (!found) allColumnsFound = false;
      });
      console.log('');

      // Check for unexpected columns
      const unexpectedColumns = columnNames.filter(col => !EXPECTED_USER_COLUMNS.includes(col));
      if (unexpectedColumns.length > 0) {
        console.log('⚠️ Unexpected User Columns Found:');
        unexpectedColumns.forEach(col => console.log(`  - ${col}`));
        console.log('');
      }

      // Summary
      console.log('📊 Validation Summary:');
      console.log('====================');
      console.log(`✅ Tables Found: ${tableNames.length}/${EXPECTED_TABLES.length}`);
      console.log(`✅ User Columns: ${columnNames.length}/${EXPECTED_USER_COLUMNS.length}`);
      console.log(`✅ All Expected Tables: ${allTablesFound ? 'YES' : 'NO'}`);
      console.log(`✅ All Expected Columns: ${allColumnsFound ? 'YES' : 'NO'}`);
      console.log('');

      if (allTablesFound && allColumnsFound) {
        console.log('🎉 Schema validation PASSED!');
        console.log('All expected tables and columns are present.');
      } else {
        console.log('❌ Schema validation FAILED!');
        console.log('Missing expected tables or columns.');
      }

      db.close();
      return {
        success: allTablesFound && allColumnsFound,
        tablesFound: tableNames.length,
        expectedTables: EXPECTED_TABLES.length,
        userColumnsFound: columnNames.length,
        expectedUserColumns: EXPECTED_USER_COLUMNS.length
      };
    } else {
      console.log('❌ Users table not found!');
      db.close();
      return {
        success: false,
        tablesFound: tableNames.length,
        expectedTables: EXPECTED_TABLES.length,
        userColumnsFound: 0,
        expectedUserColumns: EXPECTED_USER_COLUMNS.length
      };
    }
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    throw error;
  }
}

// Run validation if called directly
if (require.main === module) {
  validateSchema()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Validation failed:', err);
      process.exit(1);
    });
}

module.exports = { validateSchema, EXPECTED_TABLES, EXPECTED_USER_COLUMNS }; 