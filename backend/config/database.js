/**
 * Database Configuration and Initialization
 */

const config = require('./index');
const path = require('path');

let databaseAdapter = null;

function initializeDatabase() {
  if (databaseAdapter) {
    return databaseAdapter;
  }

  console.log('🔧 Initializing database adapter...');
  
  if (config.database.usePostgres) {
    console.log('🐘 Using PostgreSQL database');
    const PostgresAdapter = require('../database/postgres-adapter');
    databaseAdapter = {
      isPostgres: true,
      isUsingLocalDatabase: () => false,
      localDb: new PostgresAdapter(config.database.postgresUrl),
      // Legacy methods for compatibility
      fetchCheckins: async () => ({ ok: false }),
      airtableRequest: async () => { throw new Error('Airtable not available with PostgreSQL'); }
    };
  } else if (config.airtable.apiKey) {
    console.log('☁️  Using Airtable database');
    databaseAdapter = {
      isPostgres: false,
      isUsingLocalDatabase: () => false,
      localDb: null,
      fetchCheckins: fetch,
      airtableRequest: require('../utils/airtable-request')
    };
  } else {
    console.log('💾 Using local SQLite database');
    const LocalDatabase = require('../database/local-db');
    const localDbPath = path.join(__dirname, '..', config.database.localDbPath);
    databaseAdapter = {
      isPostgres: false,
      isUsingLocalDatabase: () => true,
      localDb: new LocalDatabase(localDbPath),
      fetchCheckins: fetch,
      airtableRequest: async () => { throw new Error('Airtable not available in local mode'); }
    };
  }
  
  console.log('✅ Database adapter initialized');
  return databaseAdapter;
}

module.exports = {
  initializeDatabase,
  getDatabaseAdapter: () => databaseAdapter
};