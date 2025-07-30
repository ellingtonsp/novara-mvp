const { Pool } = require('pg');
const crypto = require('crypto');
const HealthEventsService = require('../services/health-events-service');
const CompatibilityService = require('../services/compatibility-service');

class PostgresAdapter {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Initialize Schema V2 services
    this.healthEvents = new HealthEventsService(this.pool);
    this.compatibility = new CompatibilityService(this.pool);
    
    // Feature flag for Schema V2 usage
    this.useSchemaV2 = process.env.USE_SCHEMA_V2 === 'true';
    this.compatibility.useV2 = this.useSchemaV2;
    
    // Test connection
    this.pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
      } else {
        console.log('✅ PostgreSQL connected successfully');
        console.log(`🔧 Schema V2: ${this.useSchemaV2 ? 'ENABLED' : 'DISABLED'}`);
      }
    });
  }

  // User operations
  async createUser(userData) {
    const {
      email, nickname, password, ...profileData
    } = userData;

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create user in users table (Schema V2)
      const userResult = await client.query(`
        INSERT INTO users (email)
        VALUES ($1)
        RETURNING id, email, created_at
      `, [email]);
      
      const user = userResult.rows[0];
      
      // 2. Create user profile with extended data
      const profileFields = {
        user_id: user.id,
        nickname: nickname || 'User',
        confidence_meds: profileData.confidence_meds || 5,
        confidence_costs: profileData.confidence_costs || 5,
        confidence_overall: profileData.confidence_overall || 5,
        primary_need: profileData.primary_need,
        cycle_stage: profileData.cycle_stage,
        timezone: profileData.timezone || 'America/Los_Angeles',
        email_opt_in: profileData.email_opt_in !== false,
        status: profileData.status || 'active',
        baseline_completed: profileData.baseline_completed || false,
        onboarding_path: profileData.onboarding_path
      };
      
      const profileKeys = Object.keys(profileFields).filter(k => profileFields[k] !== undefined);
      const profileValues = profileKeys.map(k => profileFields[k]);
      const profilePlaceholders = profileKeys.map((_, i) => `$${i + 1}`).join(', ');
      
      await client.query(`
        INSERT INTO user_profiles (${profileKeys.join(', ')})
        VALUES (${profilePlaceholders})
      `, profileValues);
      
      await client.query('COMMIT');
      
      // Return combined user data
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        ...profileFields
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email) {
    // Schema V2 - join with user_profiles table
    const query = `
      SELECT 
        u.id, u.email, u.created_at, u.updated_at,
        p.nickname, p.confidence_meds, p.confidence_costs, 
        p.confidence_overall, p.primary_need, p.cycle_stage, 
        p.timezone, p.email_opt_in, p.status, 
        p.baseline_completed, p.onboarding_path
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `;
    
    const result = await this.pool.query(query, [email]);
    if (result.rows[0]) {
      // Add default values for fields expected by legacy code
      return {
        ...result.rows[0],
        medication_status: result.rows[0].medication_status || 'not_tracked',
        medication_status_updated: result.rows[0].medication_status_updated || null,
        top_concern: result.rows[0].top_concern || null
      };
    }
    return null;
  }

  async updateUser(userId, updates) {
    // Schema V2 - separate user and profile updates
    const userFields = ['email'];
    const userUpdates = {};
    const profileUpdates = {};
    
    // Separate updates between user and profile tables
    Object.entries(updates).forEach(([key, value]) => {
      if (userFields.includes(key)) {
        userUpdates[key] = value;
      } else {
        profileUpdates[key] = value;
      }
    });
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update user table if needed
      if (Object.keys(userUpdates).length > 0) {
        const userKeys = Object.keys(userUpdates);
        const userValues = Object.values(userUpdates);
        const userSetClause = userKeys.map((field, i) => `${field} = $${i + 2}`).join(', ');
        
        await client.query(`
          UPDATE users 
          SET ${userSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [userId, ...userValues]);
      }
      
      // Update profile table if needed
      if (Object.keys(profileUpdates).length > 0) {
        const profileKeys = Object.keys(profileUpdates);
        const profileValues = Object.values(profileUpdates);
        const profileSetClause = profileKeys.map((field, i) => `${field} = $${i + 2}`).join(', ');
        
        await client.query(`
          UPDATE user_profiles 
          SET ${profileSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId, ...profileValues]);
      }
      
      await client.query('COMMIT');
      
      // Return updated user data
      return await this.findUserById(userId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async findUserById(userId) {
    const query = `
      SELECT 
        u.id, u.email, u.created_at, u.updated_at,
        p.nickname, p.confidence_meds, p.confidence_costs, 
        p.confidence_overall, p.primary_need, p.cycle_stage, 
        p.timezone, p.email_opt_in, p.status, 
        p.baseline_completed, p.onboarding_path
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    if (result.rows[0]) {
      // Add default values for fields expected by legacy code
      return {
        ...result.rows[0],
        medication_status: result.rows[0].medication_status || 'not_tracked',
        medication_status_updated: result.rows[0].medication_status_updated || null,
        top_concern: result.rows[0].top_concern || null
      };
    }
    return null;
  }

  // Check-in operations
  async createCheckin(checkinData) {
    if (this.useSchemaV2) {
      // Use Schema V2 compatibility layer
      console.log('🚀 Using Schema V2 for check-in creation');
      
      // Handle Airtable array format for user_id
      let userId = Array.isArray(checkinData.user_id) ? checkinData.user_id[0] : checkinData.user_id;
      
      // Fix for JSON-encoded user_id
      if (typeof userId === 'string' && userId.startsWith('{') && userId.endsWith('}')) {
        // Remove the JSON encoding
        userId = userId.replace(/[{}"]/g, '');
      }
      
      // Temporary direct implementation to bypass module loading issues
      try {
        // Check if compatibility service is properly loaded
        if (!this.compatibility || typeof this.compatibility.createDailyCheckin !== 'function') {
          console.error('Compatibility service not properly loaded, using direct V2 implementation');
          
          // Direct V2 implementation
          const { v4: uuidv4 } = require('uuid');
          const correlationId = uuidv4();
          const occurredAt = checkinData.date_submitted || new Date().toISOString().split('T')[0];
          
          // Create mood event
          const moodResult = await this.pool.query(`
            INSERT INTO health_events (
              user_id, event_type, event_subtype,
              event_data, occurred_at, correlation_id, source
            ) VALUES (
              $1, 'mood', 'daily_checkin',
              $2, $3, $4, 'web_app'
            ) RETURNING id
          `, [
            userId,
            JSON.stringify({
              mood: checkinData.mood_today,
              confidence: checkinData.confidence_today,
              anxiety_level: checkinData.anxiety_level,
              note: checkinData.user_note,
              primary_concern: checkinData.primary_concern_today
            }),
            occurredAt,
            correlationId
          ]);
          
          // Create medication event if tracked
          if (checkinData.medication_taken && checkinData.medication_taken !== 'not tracked') {
            await this.pool.query(`
              INSERT INTO health_events (
                user_id, event_type, event_subtype,
                event_data, occurred_at, correlation_id, source
              ) VALUES (
                $1, 'medication', 'daily_status',
                $2, $3, $4, 'web_app'
              )
            `, [
              userId,
              JSON.stringify({
                status: checkinData.medication_taken === 'yes' ? 'taken' : 'missed'
              }),
              occurredAt,
              correlationId
            ]);
          }
          
          // Return V1-compatible response
          return {
            id: correlationId,
            date_submitted: occurredAt,
            created_at: new Date().toISOString(),
            ...checkinData
          };
        }
        
        // Normal path - use compatibility service
        console.log('Using compatibility service');
        const result = await this.compatibility.createDailyCheckin(userId, checkinData);
        return result;
      } catch (error) {
        console.error('Check-in creation error:', error.message);
        throw error;
      }
    }

    // Fallback to V1 approach
    console.log('📝 Using Schema V1 for check-in creation');
    
    // Handle Airtable array format for user_id
    const processedData = { ...checkinData };
    if (Array.isArray(processedData.user_id)) {
      processedData.user_id = processedData.user_id[0];
    }
    
    // Extract all fields - NO WHITELIST FILTERING!
    const fields = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO daily_checkins (${fields.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (user_id, date_submitted) 
      DO UPDATE SET 
        ${fields.map(f => `${f} = EXCLUDED.${f}`).join(', ')},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Check-in creation error:', error);
      throw error;
    }
  }

  async getUserCheckins(userId, limit = 30) {
    if (this.useSchemaV2) {
      // Use Schema V2 compatibility layer
      console.log('🚀 Using Schema V2 for check-ins retrieval');
      const checkins = await this.compatibility.getDailyCheckins(userId, { limit });
      return {
        records: checkins.map(row => ({
          id: row.id,
          fields: row
        }))
      };
    }

    // Fallback to V1 approach
    console.log('📝 Using Schema V1 for check-ins retrieval');
    const query = `
      SELECT * FROM daily_checkins 
      WHERE user_id = $1 
      ORDER BY date_submitted DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return {
      records: result.rows.map(row => ({
        id: row.id,
        fields: row // All fields included, no filtering!
      }))
    };
  }

  async getRecentCheckins(limit = 100) {
    if (this.useSchemaV2) {
      // Schema V2 - join with both users and user_profiles
      const query = `
        SELECT 
          he.*,
          u.email as user_email,
          p.nickname,
          json_build_object(
            'mood_today', he.event_data->>'mood',
            'confidence_today', (he.event_data->>'confidence')::int,
            'user_note', he.event_data->>'note',
            'date_submitted', DATE(he.occurred_at),
            'user_id', u.email
          ) as checkin_data
        FROM health_events he
        JOIN users u ON he.user_id = u.id
        JOIN user_profiles p ON u.id = p.user_id
        WHERE he.event_type = 'mood' 
        AND he.event_subtype = 'daily_checkin'
        ORDER BY he.occurred_at DESC
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [limit]);
      return {
        records: result.rows.map(row => ({
          id: row.id,
          fields: {
            ...row.checkin_data,
            user_email: row.user_email,
            nickname: row.nickname
          }
        }))
      };
    }
    
    // V1 fallback - join with user_profiles for nickname
    const query = `
      SELECT 
        c.*, 
        u.email as user_email, 
        p.nickname 
      FROM daily_checkins c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY c.date_submitted DESC, c.created_at DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return {
      records: result.rows.map(row => ({
        id: row.id,
        fields: {
          ...row,
          user_id: row.user_email // For compatibility with existing code
        }
      }))
    };
  }

  // Insights operations
  async createInsight(insightData) {
    // Map legacy field names to Schema V2
    const mappedData = { ...insightData };
    if (mappedData.insight_title) {
      mappedData.title = mappedData.insight_title;
      delete mappedData.insight_title;
    }
    if (mappedData.insight_message) {
      mappedData.message = mappedData.insight_message;
      delete mappedData.insight_message;
    }
    if (mappedData.insight_id) {
      delete mappedData.insight_id; // Let the database generate the ID
    }
    if (mappedData.date && !mappedData.created_at) {
      mappedData.created_at = mappedData.date;
      delete mappedData.date;
    }
    
    const fields = Object.keys(mappedData);
    const values = Object.values(mappedData);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO insights (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Insight creation error:', error);
      throw error;
    }
  }

  async getUserInsights(userId, limit = 30) {
    const query = `
      SELECT * FROM insights 
      WHERE user_id = $1 
      ORDER BY date DESC, created_at DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  // === SCHEMA V2 METHODS ===
  
  // Health Events API
  async createHealthEvent(userId, eventType, eventSubtype, eventData, options = {}) {
    if (!this.useSchemaV2) {
      throw new Error('Schema V2 not enabled. Set USE_SCHEMA_V2=true to use health events.');
    }
    return await this.healthEvents.createEvent(userId, eventType, eventSubtype, eventData, options);
  }

  async getHealthTimeline(userId, options = {}) {
    if (!this.useSchemaV2) {
      throw new Error('Schema V2 not enabled. Set USE_SCHEMA_V2=true to use health timeline.');
    }
    return await this.healthEvents.getHealthTimeline(userId, options);
  }

  async getDailySummary(userId, date = null) {
    if (!this.useSchemaV2) {
      throw new Error('Schema V2 not enabled. Set USE_SCHEMA_V2=true to use daily summary.');
    }
    return await this.healthEvents.getDailySummary(userId, date);
  }

  async getAnalytics(userId, timeframe = 'week') {
    if (this.useSchemaV2) {
      return await this.compatibility.getAnalytics(userId, timeframe);
    } else {
      // Fallback to basic analytics for V1
      return await this.getBasicAnalytics(userId, timeframe);
    }
  }

  async getBasicAnalytics(userId, timeframe) {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    
    const result = await this.pool.query(`
      SELECT 
        date_submitted as date,
        mood_today,
        confidence_today,
        medication_taken,
        anxiety_level
      FROM daily_checkins 
      WHERE user_id = $1 
      AND date_submitted >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date_submitted
    `, [userId]);

    return {
      checkins: result.rows,
      total_checkins: result.rows.length,
      timeframe: timeframe
    };
  }

  // Utility methods
  async query(text, params) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
  }

  // Compatibility methods for existing code
  isUsingLocalDatabase() {
    return false; // Always false for PostgreSQL
  }

  async fetchCheckins(_, options) {
    // This method exists for compatibility but shouldn't be used
    console.warn('fetchCheckins called on PostgreSQL adapter - use getUserCheckins instead');
    return { ok: false };
  }
}

module.exports = PostgresAdapter;