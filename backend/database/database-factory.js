const SQLiteAdapter = require('./sqlite-adapter');

// Database abstraction layer that mimics Airtable API structure
class DatabaseAdapter {
  constructor() {
    this.useLocalDatabase = process.env.NODE_ENV === 'development' || 
                           process.env.NODE_ENV === 'staging' ||
                           process.env.USE_LOCAL_DATABASE === 'true';
    
    if (this.useLocalDatabase) {
      console.log('🗄️ Using SQLite database for local development');
      this.localDb = new SQLiteAdapter();
    } else {
      console.log('🌩️ Using Airtable for production');
      this.localDb = null;
    }
  }

  // === AIRTABLE-COMPATIBLE API ===

  async airtableRequest(endpoint, method = 'GET', data = null) {
    if (!this.useLocalDatabase) {
      // Fallback to original Airtable implementation
      return this.originalAirtableRequest(endpoint, method, data);
    }

    // Route to local SQLite operations
    try {
      switch (endpoint) {
        case 'Users':
          if (method === 'POST') {
            return await this.localDb.createUser(data.fields);
          }
          break;
          
        case 'DailyCheckins':
          if (method === 'POST') {
            return await this.localDb.createCheckin(data.fields);
          }
          break;
          
        case 'Insights':
          if (method === 'POST') {
            return await this.localDb.createInsight(data.fields);
          }
          break;
          
        case 'InsightEngagement':
          if (method === 'POST') {
            return await this.localDb.createEngagement(data.fields);
          }
          break;
          
        case 'FMVAnalytics':
          if (method === 'POST') {
            return await this.localDb.createAnalyticsEvent(data.fields);
          }
          break;
          
        default:
          throw new Error(`Unsupported local database endpoint: ${endpoint}`);
      }
    } catch (error) {
      console.error(`Local database error for ${endpoint}:`, error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    if (!this.useLocalDatabase) {
      return this.originalFindUserByEmail(email);
    }
    
    return await this.localDb.findUserByEmail(email);
  }

  async getUserCheckins(userId, filterFormula, sortOptions, maxRecords) {
    if (!this.useLocalDatabase) {
      return this.originalGetUserCheckins(userId, filterFormula, sortOptions, maxRecords);
    }
    
    const limit = maxRecords || 7;
    return await this.localDb.getUserCheckins(userId, limit);
  }

  // Handle fetch requests (for checkins endpoint in server.js)
  async fetchCheckins(url, options) {
    if (!this.useLocalDatabase) {
      // Use original fetch for production
      return fetch(url, options);
    }

    // Parse Airtable-style URL for local database
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const endpoint = pathParts[pathParts.length - 1];

    if (endpoint === 'DailyCheckins') {
      // Extract user ID from filter formula
      const filterFormula = urlObj.searchParams.get('filterByFormula');
      const userIdMatch = filterFormula.match(/SEARCH\('([^']+)'/);
      const userId = userIdMatch ? userIdMatch[1] : null;
      
      const maxRecords = urlObj.searchParams.get('maxRecords') || 7;
      
      if (userId) {
        const result = await this.localDb.getUserCheckins(userId, parseInt(maxRecords));
        return {
          ok: true,
          json: async () => result
        };
      }
    }

    // Fallback
    return {
      ok: false,
      json: async () => ({ records: [] })
    };
  }

  // === ORIGINAL AIRTABLE METHODS (for production) ===

  async originalAirtableRequest(endpoint, method = 'GET', data = null) {
    const config = {
      airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
      }
    };

    const url = `${config.airtable.baseUrl}/${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Airtable ${method} failed: ${response.statusText} - ${errorBody}`);
    }
    return response.json();
  }

  async originalFindUserByEmail(email) {
    const config = {
      airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
      }
    };

    try {
      const response = await fetch(
        `${config.airtable.baseUrl}/Users?filterByFormula={email}='${email}'`,
        {
          headers: {
            'Authorization': `Bearer ${config.airtable.apiKey}`,
          }
        }
      );
      
      const result = await response.json();
      
      if (result.records && result.records.length > 0) {
        return {
          id: result.records[0].id,
          ...result.records[0].fields
        };
      }
      return null;
    } catch (error) {
      console.error('User lookup error:', error);
      return null;
    }
  }

  // === UTILITY METHODS ===

  isUsingLocalDatabase() {
    return this.useLocalDatabase;
  }

  getStats() {
    if (this.useLocalDatabase && this.localDb) {
      return this.localDb.getStats();
    }
    return null;
  }

  clearLocalData() {
    if (this.useLocalDatabase && this.localDb) {
      this.localDb.clearAllData();
    }
  }

  close() {
    if (this.localDb) {
      this.localDb.close();
    }
  }
}

// Export singleton instance
const databaseAdapter = new DatabaseAdapter();

module.exports = {
  databaseAdapter,
  createDatabase: () => databaseAdapter,
  // Export individual functions for backward compatibility
  airtableRequest: (endpoint, method, data) => databaseAdapter.airtableRequest(endpoint, method, data),
  findUserByEmail: (email) => databaseAdapter.findUserByEmail(email)
}; 