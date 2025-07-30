/**
 * Compatibility Service
 * 
 * Provides backward compatibility between V1 and V2 schemas
 * Allows existing API endpoints to work with new event-sourced schema
 */

const { Pool } = require('pg');

class CompatibilityService {
  constructor(pool) {
    this.pool = pool;
    this.useV2 = process.env.USE_SCHEMA_V2 === 'true';
  }

  /**
   * Create daily check-in - compatible with both schemas
   */
  async createDailyCheckin(userId, checkinData) {
    if (this.useV2) {
      return await this.createDailyCheckinV2(userId, checkinData);
    } else {
      return await this.createDailyCheckinV1(userId, checkinData);
    }
  }

  async createDailyCheckinV1(userId, data) {
    // Original V1 approach - single table
    const result = await this.pool.query(`
      INSERT INTO daily_checkins (
        user_id, mood_today, confidence_today, anxiety_level,
        medication_taken, user_note, primary_concern_today,
        date_submitted, missed_doses, side_effects,
        injection_confidence, partner_involved_today
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      userId,
      data.mood_today,
      data.confidence_today,
      data.anxiety_level,
      data.medication_taken,
      data.user_note,
      data.primary_concern_today,
      data.date_submitted || new Date().toISOString().split('T')[0],
      data.missed_doses,
      data.side_effects,
      data.injection_confidence,
      data.partner_involved_today
    ]);

    return result.rows[0];
  }

  async createDailyCheckinV2(userId, data) {
    // V2 approach - event sourced
    const { v4: uuidv4 } = require('uuid');
    const correlationId = uuidv4();
    const occurredAt = data.date_submitted || new Date().toISOString().split('T')[0];
    
    const events = [];

    // 1. Create mood event
    if (data.mood_today || data.confidence_today || data.user_note) {
      const moodData = {};
      if (data.mood_today) moodData.mood = data.mood_today;
      if (data.confidence_today) moodData.confidence = data.confidence_today;
      if (data.anxiety_level) moodData.anxiety_level = data.anxiety_level;
      if (data.user_note) moodData.note = data.user_note;
      if (data.primary_concern_today) moodData.primary_concern = data.primary_concern_today;
      if (data.injection_confidence) moodData.injection_confidence = data.injection_confidence;
      if (data.partner_involved_today) moodData.partner_involved = data.partner_involved_today;

      const moodResult = await this.pool.query(`
        INSERT INTO health_events (
          user_id, event_type, event_subtype,
          event_data, occurred_at, correlation_id, source
        ) VALUES (
          $1, 'mood', 'daily_checkin',
          $2, $3, $4, 'api'
        ) RETURNING *
      `, [
        userId,
        JSON.stringify(moodData),
        occurredAt,
        correlationId
      ]);

      events.push(moodResult.rows[0]);
    }

    // 2. Create medication event if tracked
    if (data.medication_taken && data.medication_taken !== 'not tracked') {
      const medData = {
        status: data.medication_taken === 'yes' ? 'taken' : 'missed'
      };
      if (data.missed_doses) medData.missed_doses = data.missed_doses;

      const medResult = await this.pool.query(`
        INSERT INTO health_events (
          user_id, event_type, event_subtype,
          event_data, occurred_at, correlation_id, source
        ) VALUES (
          $1, 'medication', 'daily_status',
          $2, $3, $4, 'api'
        ) RETURNING *
      `, [
        userId,
        JSON.stringify(medData),
        occurredAt,
        correlationId
      ]);

      events.push(medResult.rows[0]);
    }

    // 3. Create symptom event for side effects
    if (data.side_effects && data.side_effects.length > 0) {
      const symptomResult = await this.pool.query(`
        INSERT INTO health_events (
          user_id, event_type, event_subtype,
          event_data, occurred_at, correlation_id, source
        ) VALUES (
          $1, 'symptom', 'side_effect',
          $2, $3, $4, 'api'
        ) RETURNING *
      `, [
        userId,
        JSON.stringify({
          symptoms: data.side_effects,
          related_to: 'medication'
        }),
        occurredAt,
        correlationId
      ]);

      events.push(symptomResult.rows[0]);
    }

    // Return V1-compatible format
    return this.formatV2AsV1(events, correlationId, occurredAt);
  }

  /**
   * Get daily check-ins - compatible with both schemas
   */
  async getDailyCheckins(userId, options = {}) {
    if (this.useV2) {
      return await this.getDailyCheckinsV2(userId, options);
    } else {
      return await this.getDailyCheckinsV1(userId, options);
    }
  }

  async getDailyCheckinsV1(userId, options) {
    let query = 'SELECT * FROM daily_checkins WHERE user_id = $1';
    const params = [userId];

    if (options.startDate) {
      query += ' AND date_submitted >= $2';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND date_submitted <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    query += ' ORDER BY date_submitted DESC';

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getDailyCheckinsV2(userId, options) {
    // Use the compatibility view
    let query = 'SELECT * FROM daily_checkins_legacy WHERE user_id = $1';
    const params = [userId];

    if (options.startDate) {
      query += ' AND date_submitted >= $2';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ` AND date_submitted <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    query += ' ORDER BY date_submitted DESC';

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get user profile - compatible with both schemas
   */
  async getUserProfile(userId) {
    if (this.useV2) {
      const result = await this.pool.query(`
        SELECT 
          u.id, u.email, u.created_at,
          p.nickname, p.timezone, p.status, p.cycle_stage,
          p.primary_need, p.onboarding_path, p.baseline_completed
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [userId]);

      return result.rows[0];
    } else {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0];
    }
  }

  /**
   * Create insight - compatible with both schemas
   */
  async createInsight(userId, insightData) {
    if (this.useV2) {
      const result = await this.pool.query(`
        INSERT INTO insights (
          user_id, insight_type, insight_category,
          title, message, priority,
          trigger_type, trigger_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `, [
        userId,
        insightData.insight_type || 'general',
        insightData.insight_category || 'recommendation',
        insightData.title,
        insightData.message,
        insightData.priority || 5,
        insightData.trigger_type || 'manual',
        JSON.stringify(insightData.trigger_data || {})
      ]);

      return result.rows[0];
    } else {
      const result = await this.pool.query(`
        INSERT INTO insights (
          user_id, insight_type, insight_title, 
          insight_message, priority
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING *
      `, [
        userId,
        insightData.insight_type,
        insightData.title,
        insightData.message,
        insightData.priority || 5
      ]);

      return result.rows[0];
    }
  }

  /**
   * Get insights - compatible with both schemas
   */
  async getInsights(userId, options = {}) {
    let query, params;

    if (this.useV2) {
      query = 'SELECT * FROM insights WHERE user_id = $1';
      params = [userId];
    } else {
      query = 'SELECT * FROM insights WHERE user_id = $1';
      params = [userId];
    }

    if (options.category) {
      query += ` AND insight_category = $${params.length + 1}`;
      params.push(options.category);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get analytics data - compatible with both schemas
   */
  async getAnalytics(userId, timeframe = 'week') {
    if (this.useV2) {
      return await this.getAnalyticsV2(userId, timeframe);
    } else {
      return await this.getAnalyticsV1(userId, timeframe);
    }
  }

  async getAnalyticsV1(userId, timeframe) {
    // Simple V1 analytics
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
      mood_trend: this.calculateMoodTrend(result.rows),
      adherence_rate: this.calculateAdherenceRate(result.rows)
    };
  }

  async getAnalyticsV2(userId, timeframe) {
    // Use materialized views for fast analytics
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    
    const metrics = await this.pool.query(`
      SELECT * FROM user_daily_metrics 
      WHERE user_id = $1 
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date
    `, [userId]);

    const events = await this.pool.query(`
      SELECT 
        event_type,
        event_subtype,
        event_data,
        DATE(occurred_at) as date
      FROM health_events 
      WHERE user_id = $1 
      AND occurred_at >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY occurred_at
    `, [userId]);

    return {
      daily_metrics: metrics.rows,
      events: events.rows,
      total_events: events.rows.length,
      adherence_rate: this.calculateAdherenceRateV2(metrics.rows),
      mood_trends: this.calculateMoodTrendsV2(events.rows)
    };
  }

  /**
   * Helper method to format V2 events as V1 checkin
   */
  formatV2AsV1(events, correlationId, occurredAt) {
    const moodEvent = events.find(e => e.event_type === 'mood');
    const medEvent = events.find(e => e.event_type === 'medication');
    const symptomEvent = events.find(e => e.event_type === 'symptom');

    const checkin = {
      id: correlationId,
      date_submitted: occurredAt,
      created_at: new Date().toISOString()
    };

    if (moodEvent) {
      const data = moodEvent.event_data;
      checkin.mood_today = data.mood;
      checkin.confidence_today = data.confidence;
      checkin.anxiety_level = data.anxiety_level;
      checkin.user_note = data.note;
      checkin.primary_concern_today = data.primary_concern;
      checkin.injection_confidence = data.injection_confidence;
      checkin.partner_involved_today = data.partner_involved;
    }

    if (medEvent) {
      const data = medEvent.event_data;
      checkin.medication_taken = data.status === 'taken' ? 'yes' : 'no';
      checkin.missed_doses = data.missed_doses;
    }

    if (symptomEvent) {
      const data = symptomEvent.event_data;
      checkin.side_effects = data.symptoms;
    }

    return checkin;
  }

  /**
   * Helper methods for analytics
   */
  calculateMoodTrend(checkins) {
    if (checkins.length < 2) return 0;
    
    const moods = checkins
      .map(c => this.moodToNumber(c.mood_today))
      .filter(m => m !== null);
    
    if (moods.length < 2) return 0;
    
    const recent = moods.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, moods.length);
    const earlier = moods.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, moods.length - 3);
    
    return recent - earlier;
  }

  calculateAdherenceRate(checkins) {
    const tracked = checkins.filter(c => c.medication_taken && c.medication_taken !== 'not tracked');
    if (tracked.length === 0) return null;
    
    const taken = tracked.filter(c => c.medication_taken === 'yes').length;
    return Math.round((taken / tracked.length) * 100);
  }

  calculateAdherenceRateV2(metrics) {
    if (metrics.length === 0) return null;
    
    const totalTaken = metrics.reduce((sum, m) => sum + (m.medications_taken || 0), 0);
    const totalMissed = metrics.reduce((sum, m) => sum + (m.medications_missed || 0), 0);
    const total = totalTaken + totalMissed;
    
    return total > 0 ? Math.round((totalTaken / total) * 100) : null;
  }

  calculateMoodTrendsV2(events) {
    const moodEvents = events
      .filter(e => e.event_type === 'mood' && e.event_data.mood)
      .map(e => ({
        date: e.date,
        mood: this.moodToNumber(e.event_data.mood),
        confidence: e.event_data.confidence
      }));

    return {
      mood_data: moodEvents,
      trend: this.calculateTrend(moodEvents.map(e => e.mood))
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const earlier = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 3);
    
    return recent - earlier;
  }

  moodToNumber(mood) {
    const moodMap = {
      'devastated': 1, 'heartbroken': 2, 'defeated': 3, 'struggling': 4,
      'discouraged': 5, 'uncertain': 6, 'hopeful': 7, 'confident': 8,
      'optimistic': 9, 'empowered': 10
    };
    return moodMap[mood] || null;
  }
}

module.exports = CompatibilityService;