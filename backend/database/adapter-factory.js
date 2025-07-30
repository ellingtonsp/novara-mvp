/**
 * Database Adapter Factory
 * 
 * Automatically selects the correct database adapter based on environment
 * Makes migration from Airtable to PostgreSQL seamless
 */

const PostgresAdapter = require('./postgres-adapter');
const AirtableSQLiteAdapter = require('./airtable-sqlite-adapter');

function createDatabaseAdapter() {
  // Check for PostgreSQL configuration first
  const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (postgresUrl) {
    console.log('🐘 Using PostgreSQL database adapter');
    return new PostgresAdapter(postgresUrl);
  }
  
  // Fall back to Airtable/SQLite adapter
  console.log('📊 Using Airtable/SQLite adapter (legacy)');
  const config = {
    airtable: {
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID,
      baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
    }
  };
  
  return new AirtableSQLiteAdapter(config);
}

// Singleton instance
let adapter = null;

module.exports = {
  getDatabaseAdapter() {
    if (!adapter) {
      adapter = createDatabaseAdapter();
    }
    return adapter;
  },
  
  // For testing - allows adapter reset
  resetAdapter() {
    if (adapter && adapter.close) {
      adapter.close();
    }
    adapter = null;
  }
};