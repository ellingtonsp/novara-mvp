// Try to load better-sqlite3 if available (optional dependency)
let Database;
try {
  Database = require('better-sqlite3');
} catch (error) {
  console.log('📦 better-sqlite3 not available - SQLite features disabled');
  Database = null;
}
const path = require('path');
const fs = require('fs');

class SQLiteAdapter {
  constructor() {
    // Check if Database is available
    if (!Database) {
      throw new Error('SQLite adapter cannot be used without better-sqlite3. Please use Airtable adapter for production.');
    }
    
    const dbPath = path.join(__dirname, '../data/novara-local.db');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize database with better concurrency handling
    this.db = new Database(dbPath, { 
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
      readonly: false,
      fileMustExist: false
    });
    
    // Set WAL mode for better concurrent access (especially in CloudDocs)
    try {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');
    } catch (error) {
      console.warn('⚠️ Could not set optimal SQLite pragmas:', error.message);
    }
    
    this.initSchema();
    
    console.log('🗄️ SQLite database initialized:', dbPath);
  }

  initSchema() {
    // Create tables with Airtable-compatible structure
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        confidence_meds INTEGER DEFAULT 5,
        confidence_costs INTEGER DEFAULT 5,
        confidence_overall INTEGER DEFAULT 5,
        primary_need TEXT,
        cycle_stage TEXT,
        top_concern TEXT,
        timezone TEXT,
        email_opt_in BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'active',
        medication_status TEXT,              -- NEW: Medication status flag
        medication_status_updated DATETIME, -- NEW: When status was last updated
        baseline_completed BOOLEAN DEFAULT 0, -- ON-01: A/B test baseline completion flag
        onboarding_path TEXT,              -- ON-01: Track which onboarding path user took
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        mood_today TEXT NOT NULL,
        confidence_today INTEGER NOT NULL,
        primary_concern_today TEXT,
        medication_confidence_today INTEGER,
        medication_concern_today TEXT,
        financial_stress_today INTEGER,
        financial_concern_today TEXT,
        journey_readiness_today INTEGER,
        top_concern_today TEXT,
        journey_reflection_today TEXT,  -- NEW: Universal reflection field
        medication_momentum TEXT,       -- NEW: Positive medication feedback
        financial_momentum TEXT,        -- NEW: Positive financial feedback  
        journey_momentum TEXT,          -- NEW: Positive journey feedback
        user_note TEXT,
        date_submitted DATE NOT NULL,
        sentiment TEXT,                 -- NEW: CM-01 sentiment analysis result
        sentiment_confidence REAL,      -- NEW: CM-01 sentiment confidence score
        sentiment_scores TEXT,          -- NEW: CM-01 detailed sentiment scores (JSON)
        sentiment_processing_time REAL, -- NEW: CM-01 processing time in ms
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Migrate existing database to add new columns if they don't exist
      PRAGMA table_info(daily_checkins);
    `);
    
    // Add new columns if they don't exist (for existing databases)
    const addColumnIfNotExists = (tableName, columnName, columnType) => {
      try {
        this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
        console.log(`✅ Added column ${columnName} to ${tableName}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          // Column already exists, that's fine
        } else {
          console.log(`ℹ️ Column ${columnName} may already exist in ${tableName}`);
        }
      }
    };
    
    // Add new columns for enhanced questionnaire
    addColumnIfNotExists('daily_checkins', 'journey_reflection_today', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'medication_momentum', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'financial_momentum', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'journey_momentum', 'TEXT');
    
    // Enhanced dimension tracking fields
    addColumnIfNotExists('daily_checkins', 'medication_confidence_today', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'financial_confidence_today', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'journey_confidence_today', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'medication_emergency_check', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'financial_emergency_check', 'TEXT');
    
    // CM-01 sentiment analysis fields
    addColumnIfNotExists('daily_checkins', 'sentiment', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'sentiment_confidence', 'REAL');
    addColumnIfNotExists('daily_checkins', 'sentiment_scores', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'sentiment_processing_time', 'REAL');
    
    // Medication tracking field (matches Airtable Single Select)
    addColumnIfNotExists('daily_checkins', 'medication_taken', 'TEXT');
    
    // Enhanced check-in fields
    addColumnIfNotExists('daily_checkins', 'anxiety_level', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'appointment_within_3_days', 'TEXT');
    addColumnIfNotExists('daily_checkins', 'appointment_anxiety', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'coping_strategies_used', 'TEXT'); // JSON array
    addColumnIfNotExists('daily_checkins', 'wish_knew_more_about', 'TEXT'); // JSON array
    addColumnIfNotExists('daily_checkins', 'physical_symptoms', 'TEXT'); // JSON array
    addColumnIfNotExists('daily_checkins', 'symptom_severity', 'TEXT'); // JSON object
    
    // PHQ-4 fields
    addColumnIfNotExists('daily_checkins', 'phq4_feeling_nervous', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_stop_worrying', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_little_interest', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_feeling_down', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_total_score', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_anxiety_score', 'INTEGER');
    addColumnIfNotExists('daily_checkins', 'phq4_depression_score', 'INTEGER');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS insights (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        insight_title TEXT NOT NULL,
        insight_message TEXT NOT NULL,
        insight_id TEXT NOT NULL,
        date DATE NOT NULL,
        context_data TEXT,
        action_label TEXT,
        action_type TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS insight_engagement (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        action TEXT NOT NULL,
        insight_id TEXT,
        timestamp DATE NOT NULL,
        date_submitted DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS fmv_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_timestamp DATE NOT NULL,
        date DATE NOT NULL,
        event_data TEXT,
        insight_type TEXT,
        insight_title TEXT,
        insight_id TEXT,
        feedback_type TEXT,
        feedback_context TEXT,
        mood_selected TEXT,
        confidence_level INTEGER,
        concern_mentioned BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, date_submitted DESC);
      CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id);
    `);
  }

  // Generate Airtable-compatible record IDs
  generateRecordId() {
    return `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mimic Airtable's linked record format for user_id arrays
  formatLinkedRecord(userId) {
    return Array.isArray(userId) ? userId[0] : userId;
  }

  // === USER OPERATIONS ===
  
  async createUser(userData) {
    const id = this.generateRecordId();
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, nickname, confidence_meds, confidence_costs, confidence_overall, 
                        primary_need, cycle_stage, top_concern, timezone, email_opt_in, status,
                        baseline_completed, onboarding_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id, userData.email, userData.nickname, userData.confidence_meds || 5, 
        userData.confidence_costs || 5, userData.confidence_overall || 5,
        userData.primary_need, userData.cycle_stage, userData.top_concern,
        userData.timezone, userData.email_opt_in !== false ? 1 : 0, 
        userData.status || 'active',
        userData.baseline_completed === true ? 1 : 0,
        userData.onboarding_path || null
      );
      
      // Return in Airtable format
      return {
        id,
        fields: { ...userData, id }
      };
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async findUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user) return null;
    
    // Return in format expected by server.js
    return {
      id: user.id,
      ...user
    };
  }

  // NEW: Update user method for medication status and other profile updates
  async updateUser(userId, updateData) {
    try {
      // Convert boolean fields to integers for SQLite
      const processedData = { ...updateData };
      if (processedData.baseline_completed !== undefined) {
        processedData.baseline_completed = processedData.baseline_completed === true ? 1 : 0;
      }
      if (processedData.email_opt_in !== undefined) {
        processedData.email_opt_in = processedData.email_opt_in === true ? 1 : 0;
      }
      
      // Build dynamic SQL based on provided fields
      const fields = Object.keys(processedData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => processedData[field]);
      
      const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
      const result = stmt.run(...values, userId);
      
      if (result.changes === 0) {
        throw new Error('User not found or no changes made');
      }
      
      console.log(`✅ SQLite: Updated user ${userId} with:`, processedData);
      
      // Return updated user
      const updatedUser = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      return {
        id: updatedUser.id,
        fields: { ...updatedUser }
      };
    } catch (error) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  // === CHECK-IN OPERATIONS ===
  
  async createCheckin(checkinData) {
    const id = this.generateRecordId();
    const userId = this.formatLinkedRecord(checkinData.user_id);
    
    // Prepare all fields including enhanced fields
    const fields = {
      id,
      user_id: userId,
      mood_today: checkinData.mood_today,
      confidence_today: checkinData.confidence_today,
      primary_concern_today: checkinData.primary_concern_today,
      medication_confidence_today: checkinData.medication_confidence_today,
      medication_concern_today: checkinData.medication_concern_today,
      financial_stress_today: checkinData.financial_stress_today,
      financial_concern_today: checkinData.financial_concern_today,
      journey_readiness_today: checkinData.journey_readiness_today,
      top_concern_today: checkinData.top_concern_today,
      journey_reflection_today: checkinData.journey_reflection_today,
      medication_momentum: checkinData.medication_momentum,
      financial_momentum: checkinData.financial_momentum,
      journey_momentum: checkinData.journey_momentum,
      user_note: checkinData.user_note,
      date_submitted: checkinData.date_submitted || new Date().toISOString().split('T')[0],
      sentiment: checkinData.sentiment,
      sentiment_confidence: checkinData.sentiment_confidence,
      sentiment_scores: checkinData.sentiment_scores,
      sentiment_processing_time: checkinData.sentiment_processing_time,
      medication_taken: checkinData.medication_taken,
      // Enhanced fields
      anxiety_level: checkinData.anxiety_level,
      appointment_within_3_days: checkinData.appointment_within_3_days,
      appointment_anxiety: checkinData.appointment_anxiety,
      coping_strategies_used: Array.isArray(checkinData.coping_strategies_used) ? JSON.stringify(checkinData.coping_strategies_used) : checkinData.coping_strategies_used,
      wish_knew_more_about: Array.isArray(checkinData.wish_knew_more_about) ? JSON.stringify(checkinData.wish_knew_more_about) : checkinData.wish_knew_more_about,
      physical_symptoms: Array.isArray(checkinData.physical_symptoms) ? JSON.stringify(checkinData.physical_symptoms) : checkinData.physical_symptoms,
      symptom_severity: typeof checkinData.symptom_severity === 'object' ? JSON.stringify(checkinData.symptom_severity) : checkinData.symptom_severity,
      // PHQ-4 fields
      phq4_feeling_nervous: checkinData.phq4_feeling_nervous,
      phq4_stop_worrying: checkinData.phq4_stop_worrying,
      phq4_little_interest: checkinData.phq4_little_interest,
      phq4_feeling_down: checkinData.phq4_feeling_down,
      phq4_total_score: checkinData.phq4_total_score,
      phq4_anxiety_score: checkinData.phq4_anxiety_score,
      phq4_depression_score: checkinData.phq4_depression_score
    };
    
    // Build dynamic SQL based on provided fields
    const fieldNames = Object.keys(fields).filter(key => fields[key] !== undefined);
    const placeholders = fieldNames.map(() => '?').join(', ');
    const values = fieldNames.map(key => fields[key]);
    
    const sql = `
      INSERT INTO daily_checkins (${fieldNames.join(', ')})
      VALUES (${placeholders})
    `;
    
    try {
      const stmt = this.db.prepare(sql);
      stmt.run(...values);
      
      // Return in Airtable format
      return {
        id,
        fields: { ...checkinData, id, user_id: userId }
      };
    } catch (error) {
      throw new Error(`Check-in creation failed: ${error.message}`);
    }
  }

  async getUserCheckins(userId, limit = 7) {
    const stmt = this.db.prepare(`
      SELECT * FROM daily_checkins 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const checkins = stmt.all(userId, limit);
    
    // Return in Airtable format
    return {
      records: checkins.map(checkin => ({
        id: checkin.id,
        fields: checkin
      }))
    };
  }

  // === INSIGHT OPERATIONS ===
  
  async createInsight(insightData) {
    const id = this.generateRecordId();
    const userId = this.formatLinkedRecord(insightData.user_id);
    
    const stmt = this.db.prepare(`
      INSERT INTO insights (id, user_id, insight_type, insight_title, insight_message, insight_id,
                           date, context_data, action_label, action_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        stmt.run(
          id, userId, insightData.insight_type, insightData.insight_title,
          insightData.insight_message, insightData.insight_id, 
          insightData.date || new Date().toISOString().split('T')[0],
          insightData.context_data, insightData.action_label, 
          insightData.action_type, insightData.status || 'active'
        );
        
        console.log(`✅ Insight created successfully on attempt ${attempt}: ${id}`);
        return {
          id,
          fields: { ...insightData, id, user_id: userId }
        };
      } catch (error) {
        lastError = error;
        
        if (error.message.includes('readonly database') || error.message.includes('database is locked')) {
          console.warn(`⚠️ Database access issue (attempt ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            continue;
          }
        }
        
        // For non-retry-able errors or max retries reached
        break;
      }
    }
    
    // If we get here, all retries failed
    console.error('❌ Failed to create insight after all retries:', lastError.message);
    throw new Error(`Insight creation failed: ${lastError.message}`);
  }

  // === ENGAGEMENT OPERATIONS ===
  
  async createEngagement(engagementData) {
    const id = this.generateRecordId();
    const userId = this.formatLinkedRecord(engagementData.user_id);
    
    const stmt = this.db.prepare(`
      INSERT INTO insight_engagement (id, user_id, insight_type, action, insight_id, timestamp, date_submitted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id, userId, engagementData.insight_type, engagementData.action,
        engagementData.insight_id, engagementData.timestamp, engagementData.date_submitted
      );
      
      return {
        id,
        fields: { ...engagementData, id, user_id: userId }
      };
    } catch (error) {
      throw new Error(`Engagement creation failed: ${error.message}`);
    }
  }

  // === ANALYTICS OPERATIONS ===
  
  async createAnalyticsEvent(analyticsData) {
    const id = this.generateRecordId();
    const userId = this.formatLinkedRecord(analyticsData.user_id);
    
    const stmt = this.db.prepare(`
      INSERT INTO fmv_analytics (id, user_id, event_type, event_timestamp, date, event_data,
                                insight_type, insight_title, insight_id, feedback_type,
                                feedback_context, mood_selected, confidence_level, concern_mentioned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id, userId, analyticsData.event_type, analyticsData.event_timestamp,
        analyticsData.date, analyticsData.event_data, analyticsData.insight_type,
        analyticsData.insight_title, analyticsData.insight_id, analyticsData.feedback_type,
        analyticsData.feedback_context, analyticsData.mood_selected, 
        analyticsData.confidence_level, analyticsData.concern_mentioned
      );
      
      return {
        id,
        fields: { ...analyticsData, id, user_id: userId }
      };
    } catch (error) {
      throw new Error(`Analytics event creation failed: ${error.message}`);
    }
  }

  // === UTILITY OPERATIONS ===
  
  // Clear all data (for testing)
  clearAllData() {
    this.db.exec(`
      DELETE FROM fmv_analytics;
      DELETE FROM insight_engagement;
      DELETE FROM insights;
      DELETE FROM daily_checkins;
      DELETE FROM users;
    `);
    console.log('🗑️ All local database data cleared');
  }

  // Get database statistics
  getStats() {
    const users = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
    const checkins = this.db.prepare('SELECT COUNT(*) as count FROM daily_checkins').get();
    const insights = this.db.prepare('SELECT COUNT(*) as count FROM insights').get();
    
    return {
      users: users.count,
      checkins: checkins.count,
      insights: insights.count
    };
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = SQLiteAdapter; 