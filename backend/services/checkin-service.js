/**
 * Check-in Service
 * Handles check-in business logic
 */

const { getDatabaseAdapter } = require('../config/database');
const { AppError } = require('../middleware/error-handler');
const config = require('../config');
const { filterForProductionSchema } = require('../utils/airtable-schema');

class CheckinService {
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
   * Create a new check-in
   */
  async create(checkinData) {
    // Handle PostgreSQL
    if (this.db.isPostgres) {
      console.log('🐘 Using PostgreSQL for check-in creation');
      const result = await this.db.localDb.createCheckin(checkinData);
      
      // Ensure response format consistency
      if (result.fields) {
        return result.fields;
      }
      return result;
    }
    
    // Handle local SQLite database
    if (this.db.isUsingLocalDatabase()) {
      console.log('💾 Using SQLite for check-in creation');
      const result = await this.db.localDb.createCheckin(checkinData);
      return result;
    }
    
    // Handle Airtable
    console.log('☁️  Using Airtable for check-in creation');
    
    // Ensure user_id is in array format for Airtable
    const airtableData = {
      ...checkinData,
      user_id: Array.isArray(checkinData.user_id) ? checkinData.user_id : [checkinData.user_id]
    };
    
    // Filter for production schema
    const filteredData = filterForProductionSchema('DailyCheckins', airtableData);
    
    // Create in Airtable
    const result = await this.db.airtableRequest('DailyCheckins', 'POST', {
      fields: filteredData
    });
    
    return result;
  }

  /**
   * Find check-in by user and date
   */
  async findByUserAndDate(userId, date) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      const result = await this.db.localDb.getUserCheckins(userId, 100);
      const checkins = result.records || [];
      return checkins.find(c => 
        (c.fields?.date_submitted || c.date_submitted) === date
      );
    }
    
    // Airtable
    const url = `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=AND(user_id='${userId}',date_submitted='${date}')`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      console.error('Error checking for existing check-in:', response.status);
      return null;
    }
    
    const result = await response.json();
    return result.records && result.records.length > 0 ? result.records[0] : null;
  }

  /**
   * Get user's check-ins
   */
  async getUserCheckins(userId, limit = 30) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.getUserCheckins(userId, limit);
    }
    
    // Airtable
    const url = `${config.airtable.baseUrl}/DailyCheckins?filterByFormula=user_id='${userId}'&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new AppError('Failed to retrieve check-ins', response.status);
    }
    
    const result = await response.json();
    return result;
  }

  /**
   * Find check-in by ID
   */
  async findById(checkinId) {
    // Initialize database if needed
    if (!this.db) {
      await this.initialize();
    }
    
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      console.log('🔍 Using PostgreSQL/SQLite for check-in lookup');
      return await this.db.localDb.findCheckinById(checkinId);
    }
    
    // Airtable
    const url = `${config.airtable.baseUrl}/DailyCheckins/${checkinId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new AppError('Failed to retrieve check-in', response.status);
    }
    
    const result = await response.json();
    return result;
  }

  /**
   * Delete check-in
   */
  async delete(checkinId) {
    // Initialize database if needed
    if (!this.db) {
      await this.initialize();
    }
    
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      console.log('🐘 Using PostgreSQL/SQLite for check-in deletion');
      return await this.db.localDb.deleteCheckin(checkinId);
    }
    
    // Airtable
    const response = await fetch(`${config.airtable.baseUrl}/DailyCheckins/${checkinId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new AppError('Failed to delete check-in', response.status);
    }
    
    return true;
  }

  /**
   * Get recent check-ins across all users
   */
  async getRecentCheckins(limit = 100) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.getRecentCheckins(limit);
    }
    
    // Airtable
    const url = `${config.airtable.baseUrl}/DailyCheckins?sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new AppError('Failed to retrieve recent check-ins', response.status);
    }
    
    const result = await response.json();
    return result;
  }

  /**
   * Update an existing check-in
   */
  async update(checkinId, updateData) {
    // Initialize database if needed
    if (!this.db) {
      await this.initialize();
    }
    
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      console.log('🐘 Using PostgreSQL/SQLite for check-in update');
      return await this.db.localDb.updateCheckin(checkinId, updateData);
    }
    
    // Airtable
    console.log('☁️  Using Airtable for check-in update');
    
    // Filter for production schema
    const filteredData = filterForProductionSchema('DailyCheckins', updateData);
    
    const response = await fetch(`${config.airtable.baseUrl}/DailyCheckins/${checkinId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: filteredData
      })
    });
    
    if (!response.ok) {
      throw new AppError('Failed to update check-in', response.status);
    }
    
    const result = await response.json();
    return result;
  }
}

// Export singleton instance
const checkinService = new CheckinService();
module.exports = checkinService;