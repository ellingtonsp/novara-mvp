const SQLiteAdapter = require('./sqlite-adapter');
const axios = require('axios');

// Database abstraction layer that mimics Airtable API structure
class DatabaseAdapter {
  constructor() {
    this.useLocalDatabase = process.env.NODE_ENV === 'development' || 
                           process.env.USE_LOCAL_DATABASE === 'true';
    
    if (this.useLocalDatabase) {
      console.log('🗄️ Using SQLite database for local development');
      this.localDb = new SQLiteAdapter();
    } else {
      console.log('🌩️ Using Airtable for production');
      this.localDb = null;
    }
  }

  // Map Airtable table names to SQLite table names
  mapTableName(airtableTableName) {
    const tableMap = {
      'Users': 'users',
      'DailyCheckins': 'daily_checkins',
      'Insights': 'insights',
      'InsightEngagement': 'insight_engagement'
    };
    return tableMap[airtableTableName] || airtableTableName.toLowerCase();
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

  // === USER OPERATIONS ===

  async findUserByEmail(email) {
    if (!this.useLocalDatabase) {
      return this.originalFindUserByEmail(email);
    }
    
    return await this.localDb.findUserByEmail(email);
  }

  // NEW: Update user method for medication status and other profile updates
  async updateUser(userId, updateData) {
    if (!this.useLocalDatabase) {
      // Airtable update for staging/production using axios
      const config = {
        airtable: {
          apiKey: process.env.AIRTABLE_API_KEY,
          baseId: process.env.AIRTABLE_BASE_ID,
          baseUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
        }
      };
      
      const airtableUrl = `${config.airtable.baseUrl}/Users/${userId}`;
      
      console.log(`🔄 Updating user ${userId} in Airtable:`, updateData);
      
      try {
        const response = await axios.patch(airtableUrl, {
          fields: updateData 
        }, {
          headers: {
            'Authorization': `Bearer ${config.airtable.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Airtable update successful:', response.data.fields);
        return response.data;
      } catch (error) {
        console.error('❌ Airtable update failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.response?.data || error.message,
          userId,
          updateData
        });
        throw new Error(`Failed to update user in Airtable: ${error.response?.status} ${error.response?.statusText} - ${error.response?.data || error.message}`);
      }
    }
    
    return await this.localDb.updateUser(userId, updateData);
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
      // Use axios for production (convert fetch-style to axios-style)
      console.log('🌩️ Production: Using axios for checkins query:', url);
      try {
        const axiosConfig = {
          method: 'GET',
          url: url,
          headers: options?.headers || {}
        };
        
        const response = await axios(axiosConfig);
        
        // Return fetch-compatible response object
        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          json: async () => response.data
        };
      } catch (error) {
        console.error('❌ Production axios error:', error);
        
        // Return fetch-compatible error response
        return {
          ok: false,
          status: error.response?.status || 500,
          json: async () => error.response?.data || { error: error.message }
        };
      }
    }

    // Parse Airtable-style URL for local database
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const endpoint = pathParts[pathParts.length - 1];

    if (endpoint === 'DailyCheckins' || endpoint === 'daily_checkins') {
      // Extract user ID from filter formula
      const filterFormula = urlObj.searchParams.get('filterByFormula');
      const userIdMatch = filterFormula ? filterFormula.match(/SEARCH\('([^']+)'/) : null;
      const userId = userIdMatch ? userIdMatch[1] : null;
      
      const maxRecords = urlObj.searchParams.get('maxRecords') || 7;
      
      if (userId) {
        console.log('🗄️ Local: Fetching checkins for user:', userId);
        const result = await this.localDb.getUserCheckins(userId, parseInt(maxRecords));
        return {
          ok: true,
          json: async () => result
        };
      }
    }

    // Fallback
    console.warn('⚠️ Database adapter fallback triggered - no records returned');
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
    
    console.log(`🌩️ Production: Making ${method} request to Airtable:`, url);
    
    try {
      const axiosConfig = {
        method: method,
        url: url,
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (data && method !== 'GET') {
        axiosConfig.data = data;
      }
      
      const response = await axios(axiosConfig);
      console.log(`✅ Production: Airtable ${method} request successful`, response.status);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Production: Airtable ${method} request failed:`, error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Airtable ${method} failed: ${errorMessage}`);
    }
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
      const response = await axios.get(
        `${config.airtable.baseUrl}/Users?filterByFormula={email}='${email}'`,
        {
          headers: {
            'Authorization': `Bearer ${config.airtable.apiKey}`,
          }
        }
      );
      
      const result = response.data;
      
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