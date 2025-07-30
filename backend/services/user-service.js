/**
 * User Service
 * Handles user-related business logic
 */

const { getDatabaseAdapter } = require('../config/database');
const { AppError } = require('../middleware/error-handler');
const config = require('../config');

class UserService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    const adapter = getDatabaseAdapter();
    if (!adapter) {
      throw new AppError('Database not initialized', 500);
    }
    this.db = adapter;
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.findUserByEmail(email);
    } else {
      // Airtable logic
      const url = `${config.airtable.baseUrl}/Users?filterByFormula=email='${encodeURIComponent(email)}'`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      });
      
      if (!response.ok) {
        throw new AppError('Failed to fetch user from Airtable', response.status);
      }
      
      const result = await response.json();
      return result.records && result.records.length > 0 ? result.records[0] : null;
    }
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.findUserById(userId);
    } else {
      // Airtable logic - need to search by ID in the records
      const url = `${config.airtable.baseUrl}/Users?filterByFormula=RECORD_ID()='${userId}'`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      });
      
      if (!response.ok) {
        throw new AppError('Failed to fetch user from Airtable', response.status);
      }
      
      const result = await response.json();
      if (result.records && result.records.length > 0) {
        const record = result.records[0];
        return {
          id: record.id,
          ...record.fields
        };
      }
      return null;
    }
  }

  /**
   * Create new user
   */
  async create(userData) {
    // Validate required fields
    if (!userData.email) {
      throw new AppError('Email is required', 400);
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.createUser(userData);
    } else {
      // Airtable logic
      const result = await this.db.airtableRequest('Users', 'POST', {
        fields: userData
      });
      return result;
    }
  }

  /**
   * Update user
   */
  async update(userId, updates) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.updateUser(userId, updates);
    } else {
      // Airtable logic
      const result = await this.db.airtableRequest(`Users/${userId}`, 'PATCH', {
        fields: updates
      });
      return result;
    }
  }

  /**
   * Get user check-ins
   */
  async getCheckins(userId, limit = 30) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.getUserCheckins(userId, limit);
    } else {
      // Airtable logic
      const url = `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=user_id='${userId}'&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.airtable.apiKey}`,
        }
      });
      
      if (!response.ok) {
        throw new AppError('Failed to fetch check-ins from Airtable', response.status);
      }
      
      const result = await response.json();
      return result;
    }
  }
}

// Export singleton instance
const userService = new UserService();
module.exports = userService;