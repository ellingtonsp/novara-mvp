const { Pool } = require('pg');
const crypto = require('crypto');

class PostgresAdapter {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection
    this.pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
      } else {
        console.log('✅ PostgreSQL connected successfully');
      }
    });
  }

  // User operations
  async createUser(userData) {
    const {
      email, nickname, password, ...otherFields
    } = userData;

    // Note: For now, we're not storing passwords in PostgreSQL
    // The app uses passwordless auth flow
    const fields = ['email', 'nickname', ...Object.keys(otherFields)];
    const values = [email, nickname, ...Object.values(otherFields)];
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO users (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING id, email, nickname, confidence_meds, confidence_costs, 
                confidence_overall, primary_need, cycle_stage, top_concern,
                timezone, email_opt_in, status, medication_status,
                baseline_completed, onboarding_path, created_at
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async findUserByEmail(email) {
    const query = `
      SELECT id, email, nickname, confidence_meds, confidence_costs, 
             confidence_overall, primary_need, cycle_stage, top_concern,
             timezone, email_opt_in, status, medication_status,
             baseline_completed, onboarding_path, created_at
      FROM users 
      WHERE email = $1
    `;
    
    const result = await this.pool.query(query, [email]);
    return result.rows[0];
  }

  async updateUser(userId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, ...values]);
    return result.rows[0];
  }

  // Check-in operations
  async createCheckin(checkinData) {
    // Extract all fields - NO WHITELIST FILTERING!
    const fields = Object.keys(checkinData);
    const values = Object.values(checkinData);
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
    const query = `
      SELECT c.*, u.email as user_email, u.nickname 
      FROM daily_checkins c
      JOIN users u ON c.user_id = u.id
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
    const fields = Object.keys(insightData);
    const values = Object.values(insightData);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO insights (${fields.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (user_id, insight_id) DO NOTHING
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
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