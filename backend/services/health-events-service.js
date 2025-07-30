/**
 * Health Events Service
 * Core service for the new event-sourced health data system
 */

const { v4: uuidv4 } = require('uuid');

class HealthEventsService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a health event
   * This is the core method - all health data goes through here
   */
  async createHealthEvent({
    userId,
    eventType,
    eventSubtype,
    eventData,
    occurredAt = new Date(),
    correlationId = null,
    source = 'web_app'
  }) {
    // Validate event type
    const validEventTypes = ['mood', 'medication', 'symptom', 'assessment', 'vital', 'treatment', 'appointment', 'note'];
    if (!validEventTypes.includes(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    // Insert the event
    const query = `
      INSERT INTO health_events (
        user_id, event_type, event_subtype, event_data,
        occurred_at, correlation_id, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      eventType,
      eventSubtype,
      JSON.stringify(eventData),
      occurredAt,
      correlationId,
      source
    ];

    const result = await this.db.query(query, values);
    const event = result.rows[0];

    // Trigger side effects based on event type
    await this.handleEventSideEffects(event);

    return event;
  }

  /**
   * Handle side effects for different event types
   * In Option C, this would publish to message queue
   */
  async handleEventSideEffects(event) {
    switch (event.event_type) {
      case 'mood':
        await this.handleMoodEvent(event);
        break;
      case 'medication':
        await this.handleMedicationEvent(event);
        break;
      case 'assessment':
        await this.handleAssessmentEvent(event);
        break;
      // Add more as needed
    }
  }

  /**
   * Create a daily check-in (backward compatible)
   */
  async createDailyCheckin({
    userId,
    moodToday,
    confidenceToday,
    medicationTaken,
    anxietyLevel,
    sideEffects,
    copingStrategies,
    userNote,
    ...additionalData
  }) {
    const correlationId = uuidv4(); // Group related events

    // Create mood event
    const moodEvent = await this.createHealthEvent({
      userId,
      eventType: 'mood',
      eventSubtype: 'daily_checkin',
      eventData: {
        mood: moodToday,
        confidence: confidenceToday,
        anxiety_level: anxietyLevel,
        note: userNote,
        ...additionalData
      },
      correlationId
    });

    // Create medication event if tracked
    if (medicationTaken && medicationTaken !== 'not tracked') {
      await this.createHealthEvent({
        userId,
        eventType: 'medication',
        eventSubtype: 'daily_status',
        eventData: {
          status: medicationTaken === 'yes' ? 'taken' : 'missed',
          all_medications: medicationTaken === 'yes'
        },
        correlationId
      });
    }

    // Create symptom events for side effects
    if (sideEffects && sideEffects.length > 0) {
      await this.createHealthEvent({
        userId,
        eventType: 'symptom',
        eventSubtype: 'side_effect',
        eventData: {
          symptoms: sideEffects,
          severity: null, // Could be enhanced
          related_to: 'medication'
        },
        correlationId
      });
    }

    // Log coping strategies as a note
    if (copingStrategies && copingStrategies.length > 0) {
      await this.createHealthEvent({
        userId,
        eventType: 'note',
        eventSubtype: 'coping_strategies',
        eventData: {
          strategies: copingStrategies,
          context: 'daily_checkin'
        },
        correlationId
      });
    }

    return {
      success: true,
      correlationId,
      primaryEventId: moodEvent.id
    };
  }

  /**
   * Get user's health timeline
   */
  async getHealthTimeline(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      eventTypes = null,
      limit = 100
    } = options;

    let query = `
      SELECT * FROM health_events
      WHERE user_id = $1
        AND occurred_at BETWEEN $2 AND $3
    `;
    
    const values = [userId, startDate, endDate];

    if (eventTypes && eventTypes.length > 0) {
      query += ` AND event_type = ANY($4)`;
      values.push(eventTypes);
    }

    query += ` ORDER BY occurred_at DESC LIMIT ${limit}`;

    const result = await this.db.query(query, values);
    return result.rows;
  }

  /**
   * Get aggregated daily metrics (uses materialized view)
   */
  async getDailyMetrics(userId, startDate, endDate) {
    const query = `
      SELECT * FROM user_daily_metrics
      WHERE user_id = $1
        AND date BETWEEN $2 AND $3
      ORDER BY date DESC
    `;

    const result = await this.db.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Record medication taken
   */
  async recordMedicationTaken(userId, medicationId, { takenAt = new Date(), notes = null } = {}) {
    // Get medication details
    const medQuery = `SELECT * FROM user_medications WHERE id = $1 AND user_id = $2`;
    const medResult = await this.db.query(medQuery, [medicationId, userId]);
    
    if (medResult.rows.length === 0) {
      throw new Error('Medication not found');
    }

    const medication = medResult.rows[0];

    // Create health event
    const event = await this.createHealthEvent({
      userId,
      eventType: 'medication',
      eventSubtype: medication.medication_type || 'oral',
      eventData: {
        medication_id: medicationId,
        medication_name: medication.medication_name,
        status: 'taken',
        scheduled_time: null, // Could be enhanced
        actual_time: takenAt.toISOString(),
        notes
      },
      occurredAt: takenAt
    });

    // Record in adherence table
    await this.db.query(`
      INSERT INTO medication_adherence (
        user_id, medication_id, health_event_id,
        taken_time, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, medicationId, event.id, takenAt, 'taken', notes]);

    return event;
  }

  /**
   * Complete an assessment (PHQ-4, etc.)
   */
  async completeAssessment(userId, assessmentType, responses) {
    // Get assessment definition
    const defQuery = `
      SELECT * FROM assessment_definitions 
      WHERE name = $1 AND active = true 
      ORDER BY version DESC LIMIT 1
    `;
    const defResult = await this.db.query(defQuery, [assessmentType]);
    
    if (defResult.rows.length === 0) {
      throw new Error('Assessment type not found');
    }

    const definition = defResult.rows[0];

    // Calculate scores based on scoring logic
    const scores = this.calculateAssessmentScores(definition, responses);

    // Create health event
    const event = await this.createHealthEvent({
      userId,
      eventType: 'assessment',
      eventSubtype: assessmentType.toLowerCase(),
      eventData: {
        assessment_id: definition.id,
        assessment_name: definition.name,
        responses,
        scores
      }
    });

    // Record in assessment_responses
    await this.db.query(`
      INSERT INTO assessment_responses (
        user_id, assessment_id, health_event_id,
        responses, scores, started_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      definition.id,
      event.id,
      JSON.stringify(responses),
      JSON.stringify(scores),
      new Date(Date.now() - 5 * 60 * 1000), // Assume 5 minutes to complete
      new Date()
    ]);

    return { event, scores };
  }

  /**
   * Helper: Calculate assessment scores
   */
  calculateAssessmentScores(definition, responses) {
    // This would use the scoring_logic from the definition
    // For now, simple PHQ-4 example
    if (definition.name === 'PHQ-4') {
      const anxietyScore = (responses.q1 || 0) + (responses.q2 || 0);
      const depressionScore = (responses.q3 || 0) + (responses.q4 || 0);
      const totalScore = anxietyScore + depressionScore;

      return {
        total: totalScore,
        anxiety: anxietyScore,
        depression: depressionScore,
        severity: totalScore >= 9 ? 'severe' : 
                  totalScore >= 6 ? 'moderate' : 
                  totalScore >= 3 ? 'mild' : 'minimal'
      };
    }

    return {};
  }

  /**
   * Handle mood event side effects
   */
  async handleMoodEvent(event) {
    const eventData = event.event_data;
    
    // Check for concerning patterns
    if (eventData.mood === 'very tough' || eventData.anxiety_level >= 8) {
      // In Option C, this would publish to insights service
      await this.createInsight({
        userId: event.user_id,
        type: 'support_needed',
        title: 'We noticed you might need extra support',
        message: 'Your recent check-in shows elevated stress levels.',
        triggerType: 'event_based',
        triggerData: { eventId: event.id }
      });
    }
  }

  /**
   * Handle medication event side effects
   */
  async handleMedicationEvent(event) {
    // Could trigger adherence calculations, reminders, etc.
    // In Option C, this would be handled by medication service
  }

  /**
   * Handle assessment completion
   */
  async handleAssessmentEvent(event) {
    const scores = event.event_data.scores;
    
    if (scores.severity === 'severe' || scores.severity === 'moderate') {
      await this.createInsight({
        userId: event.user_id,
        type: 'assessment_alert',
        title: 'Your mental health assessment needs attention',
        message: 'Consider reaching out to your care team.',
        priority: 8,
        triggerType: 'event_based',
        triggerData: { eventId: event.id, scores }
      });
    }
  }

  /**
   * Create an insight
   */
  async createInsight({
    userId,
    type,
    title,
    message,
    category = 'recommendation',
    priority = 5,
    triggerType = 'system',
    triggerData = {},
    expiresIn = 7 * 24 * 60 * 60 * 1000 // 7 days
  }) {
    const query = `
      INSERT INTO insights (
        user_id, insight_type, insight_category,
        title, message, priority,
        trigger_type, trigger_data, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const expiresAt = new Date(Date.now() + expiresIn);

    const result = await this.db.query(query, [
      userId, type, category, title, message, priority,
      triggerType, JSON.stringify(triggerData), expiresAt
    ]);

    return result.rows[0];
  }
}

module.exports = HealthEventsService;