// Temporary hotfix to replace postgres-adapter.js
// This version has the compatibility logic directly embedded

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
    
    this.useSchemaV2 = process.env.USE_SCHEMA_V2 === 'true';
    
    this.pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
      } else {
        console.log('✅ PostgreSQL connected successfully');
        console.log(`🔧 Schema V2: ${this.useSchemaV2 ? 'ENABLED' : 'DISABLED'}`);
      }
    });
  }

  // Check-in operations with direct V2 implementation
  async createCheckin(checkinData) {
    if (this.useSchemaV2) {
      console.log('🚀 Using direct Schema V2 implementation');
      
      // Handle Airtable array format for user_id
      let userId = Array.isArray(checkinData.user_id) ? checkinData.user_id[0] : checkinData.user_id;
      
      // Fix for JSON-encoded user_id
      if (typeof userId === 'string' && userId.startsWith('{') && userId.endsWith('}')) {
        userId = userId.replace(/[{}\"]/g, '');
      }
      
      // Direct V2 implementation
      const { v4: uuidv4 } = require('uuid');
      const correlationId = uuidv4();
      const occurredAt = checkinData.date_submitted || new Date().toISOString().split('T')[0];
      
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create mood event
        if (checkinData.mood_today || checkinData.confidence_today) {
          await client.query(`
            INSERT INTO health_events (
              user_id, event_type, event_subtype,
              event_data, occurred_at, correlation_id, source
            ) VALUES (
              $1, 'mood', 'daily_checkin',
              $2, $3, $4, 'web_app'
            )
          `, [
            userId,
            JSON.stringify({
              mood: checkinData.mood_today,
              confidence: checkinData.confidence_today,
              anxiety_level: checkinData.anxiety_level,
              note: checkinData.user_note,
              primary_concern: checkinData.primary_concern_today,
              appointment_within_3_days: checkinData.appointment_within_3_days,
              appointment_anxiety: checkinData.appointment_anxiety,
              coping_strategies_used: checkinData.coping_strategies_used,
              wish_knew_more_about: checkinData.wish_knew_more_about,
              phq4_feeling_nervous: checkinData.phq4_feeling_nervous,
              phq4_stop_worrying: checkinData.phq4_stop_worrying,
              phq4_little_interest: checkinData.phq4_little_interest,
              phq4_feeling_down: checkinData.phq4_feeling_down,
              physical_symptoms: checkinData.physical_symptoms,
              symptom_severity: checkinData.symptom_severity
            }),
            occurredAt,
            correlationId
          ]);
        }
        
        // Create medication event if tracked
        if (checkinData.medication_taken && checkinData.medication_taken !== 'not tracked') {
          await client.query(`
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
        
        await client.query('COMMIT');
        
        // Return V1-compatible response
        return {
          id: correlationId,
          fields: {
            ...checkinData,
            id: correlationId,
            date_submitted: occurredAt,
            created_at: new Date().toISOString()
          }
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Check-in creation error:', error);
        throw error;
      } finally {
        client.release();
      }
    }

    // V1 fallback - not used in staging
    throw new Error('V1 check-ins not supported');
  }

  // Other required methods...
  async findUserByEmail(email) {
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
      return {
        ...result.rows[0],
        medication_status: 'not_tracked',
        medication_status_updated: null,
        top_concern: null
      };
    }
    return null;
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
      return {
        ...result.rows[0],
        medication_status: 'not_tracked',
        medication_status_updated: null,
        top_concern: null
      };
    }
    return null;
  }

  async createUser(userData) {
    const { email, nickname, password, ...profileData } = userData;

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userResult = await client.query(`
        INSERT INTO users (email)
        VALUES ($1)
        RETURNING id, email, created_at
      `, [email]);
      
      const user = userResult.rows[0];
      
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
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        ...profileFields
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        throw new Error('User with this email already exists');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUser(userId, updates) {
    const userFields = ['email'];
    // Only include fields that exist in the user_profiles table
    const profileFields = [
      'nickname', 'timezone', 'email_opt_in', 'status',
      'cycle_stage', 'primary_need', 'onboarding_path',
      'baseline_completed', 'confidence_meds', 'confidence_costs',
      'confidence_overall'
    ];
    
    const userUpdates = {};
    const profileUpdates = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (userFields.includes(key)) {
        userUpdates[key] = value;
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = value;
      }
      // Silently ignore fields that don't exist in the schema
    });
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
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
      
      return await this.findUserById(userId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateCheckin(checkinId, updateData) {
    if (this.useSchemaV2) {
      console.log('🚀 Updating check-in with Schema V2');
      
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Build event data
        const eventData = {
          mood: updateData.mood_today || '',
          confidence: parseInt(updateData.confidence_today) || 0,
          note: updateData.user_note || '',
          primary_concern: updateData.primary_concern_today || '',
          anxiety_level: updateData.anxiety_level || 0,
          medication_taken: updateData.medication_taken || false
        };
        
        // Add optional fields if present
        if (updateData.appointment_within_3_days) {
          eventData.appointment_within_3_days = updateData.appointment_within_3_days;
        }
        if (updateData.appointment_anxiety !== undefined) {
          eventData.appointment_anxiety = updateData.appointment_anxiety;
        }
        if (updateData.coping_strategies_used) {
          eventData.coping_strategies_used = updateData.coping_strategies_used;
        }
        if (updateData.sleep_hours !== undefined) {
          eventData.sleep_hours = updateData.sleep_hours;
        }
        if (updateData.energy_level !== undefined) {
          eventData.energy_level = updateData.energy_level;
        }
        if (updateData.side_effects) {
          eventData.side_effects = updateData.side_effects;
        }
        if (updateData.emotion_score !== undefined) {
          eventData.emotion_score = updateData.emotion_score;
        }
        if (updateData.physical_symptoms_score !== undefined) {
          eventData.physical_symptoms_score = updateData.physical_symptoms_score;
        }
        
        // Update the health event
        const result = await client.query(`
          UPDATE health_events
          SET 
            event_data = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND event_type = 'daily_checkin'
          RETURNING id, occurred_at::date::text as date_submitted
        `, [checkinId, JSON.stringify(eventData)]);
        
        await client.query('COMMIT');
        
        // Return the updated checkin
        return {
          id: checkinId,
          ...updateData,
          date_submitted: result.rows[0].date_submitted
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Legacy V1 implementation
      const query = `
        UPDATE daily_checkins 
        SET 
          mood_today = $2,
          confidence_today = $3,
          user_note = $4,
          primary_concern_today = $5,
          medication_taken = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [
        checkinId,
        updateData.mood_today,
        updateData.confidence_today,
        updateData.user_note || null,
        updateData.primary_concern_today || null,
        updateData.medication_taken || false
      ];
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    }
  }

  async getUserCheckins(userId, limit = 30) {
    const query = `
      SELECT 
        he.id,
        he.occurred_at::date::text as date_submitted,
        he.recorded_at as created_at,
        he.event_data->>'mood' as mood_today,
        (he.event_data->>'confidence')::int as confidence_today,
        he.event_data->>'note' as user_note,
        he.event_data->>'primary_concern' as primary_concern_today,
        (he.event_data->>'anxiety_level')::int as anxiety_level,
        he.event_data->>'appointment_within_3_days' as appointment_within_3_days,
        (he.event_data->>'appointment_anxiety')::int as appointment_anxiety,
        he.event_data->'coping_strategies_used' as coping_strategies_used,
        he.event_data->'wish_knew_more_about' as wish_knew_more_about,
        (he.event_data->>'phq4_feeling_nervous')::int as phq4_feeling_nervous,
        (he.event_data->>'phq4_stop_worrying')::int as phq4_stop_worrying,
        (he.event_data->>'phq4_little_interest')::int as phq4_little_interest,
        (he.event_data->>'phq4_feeling_down')::int as phq4_feeling_down,
        he.event_data->'physical_symptoms' as physical_symptoms,
        he.event_data->'symptom_severity' as symptom_severity,
        CASE 
          WHEN med.event_data->>'status' = 'taken' THEN 'yes'
          WHEN med.event_data->>'status' = 'missed' THEN 'no'
          ELSE NULL
        END as medication_taken
      FROM health_events he
      LEFT JOIN health_events med ON 
        med.user_id = he.user_id 
        AND med.event_type = 'medication'
        AND med.occurred_at::date = he.occurred_at::date
      WHERE he.user_id = $1 
      AND he.event_type = 'mood'
      ORDER BY he.occurred_at DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return {
      records: result.rows.map(row => ({
        id: row.id,
        fields: row
      }))
    };
  }

  async getRecentCheckins(limit = 100) {
    const query = `
      SELECT 
        he.id,
        he.occurred_at::date::text as date_submitted,
        he.recorded_at as created_at,
        he.event_data->>'mood' as mood_today,
        (he.event_data->>'confidence')::int as confidence_today,
        he.event_data->>'note' as user_note,
        u.email as user_email,
        p.nickname
      FROM health_events he
      JOIN users u ON he.user_id = u.id
      JOIN user_profiles p ON u.id = p.user_id
      WHERE he.event_type = 'mood'
      ORDER BY he.occurred_at DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return {
      records: result.rows.map(row => ({
        id: row.id,
        fields: {
          ...row,
          user_id: row.user_email
        }
      }))
    };
  }

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
      delete mappedData.insight_id;
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
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
  }

  isUsingLocalDatabase() {
    return false;
  }

  async fetchCheckins(_, options) {
    console.warn('fetchCheckins called on PostgreSQL adapter - use getUserCheckins instead');
    return { ok: false };
  }
}

module.exports = PostgresAdapter;