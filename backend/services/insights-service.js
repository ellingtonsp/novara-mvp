/**
 * Insights Service
 * Handles insights generation and management
 */

const { getDatabaseAdapter } = require('../config/database');
const { AppError } = require('../middleware/error-handler');
const userService = require('./user-service');
const checkinService = require('./checkin-service');
const config = require('../config');

class InsightsService {
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
   * Generate daily insights for a user
   */
  async generateDailyInsights(userId) {
    // Get user data
    const user = await userService.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = !!user.baseline_completed || 
                                  (user.onboarding_path === 'control' && 
                                   user.primary_need && 
                                   user.cycle_stage) ||
                                  (user.confidence_meds && user.confidence_costs && 
                                   user.confidence_overall && user.primary_need && 
                                   user.cycle_stage);
    
    if (!hasCompletedOnboarding) {
      throw new AppError('Complete your profile to unlock personalized insights', 403);
    }

    // Get recent check-ins
    const checkinsResult = await checkinService.getUserCheckins(userId, 7);
    const checkins = checkinsResult.records || [];

    if (checkins.length === 0) {
      return {
        type: 'no_data',
        title: 'Start Your Journey',
        message: 'Complete your first daily check-in to receive personalized insights!',
        icon: '🌟',
        confidence: 0.5
      };
    }

    // Generate insight based on check-in patterns
    const insight = this.analyzeCheckinsForInsight(checkins, user);
    
    // Save insight to database
    const savedInsight = await this.saveInsight(userId, insight);
    
    return savedInsight;
  }

  /**
   * Analyze check-ins to generate insight
   */
  analyzeCheckinsForInsight(checkins, user) {
    // Map check-ins to simplified format
    const checkinsData = checkins.map(record => ({
      mood: record.fields?.mood_today || record.mood_today,
      confidence: record.fields?.confidence_today || record.confidence_today,
      medication_taken: record.fields?.medication_taken || record.medication_taken,
      note: record.fields?.user_note || record.user_note,
      date: record.fields?.date_submitted || record.date_submitted
    }));

    // Calculate mood trend
    const moodMap = {
      'devastated': 1, 'heartbroken': 2, 'defeated': 3, 'struggling': 4,
      'discouraged': 5, 'uncertain': 6, 'hopeful': 7, 'confident': 8,
      'optimistic': 9, 'empowered': 10
    };

    const moodScores = checkinsData.map(c => moodMap[c.mood] || 5);
    const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    const recentMood = moodScores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, moodScores.length);
    const moodTrend = recentMood - avgMood;

    // Check medication adherence
    const medicationData = checkinsData.filter(c => c.medication_taken && c.medication_taken !== 'not tracked');
    const adherenceRate = medicationData.length > 0 
      ? medicationData.filter(c => c.medication_taken === 'yes').length / medicationData.length 
      : null;

    // Calculate confidence score based on available data
    const calculateConfidence = () => {
      if (checkinsData.length === 0) return 0.5;
      if (checkinsData.length === 1) return 0.6;
      if (checkinsData.length < 3) return 0.7;
      if (checkinsData.length < 7) return 0.8;
      return 0.9;
    };

    const confidence = calculateConfidence();

    // Generate appropriate insight
    if (moodTrend > 1) {
      return {
        type: 'mood_improvement',
        title: 'Your mood is improving! 📈',
        message: 'Keep up the great work. Your recent check-ins show positive momentum.',
        icon: '🌈',
        confidence
      };
    } else if (adherenceRate !== null && adherenceRate === 1) {
      return {
        type: 'perfect_adherence',
        title: 'Perfect medication adherence! 💯',
        message: 'You\'ve been consistent with your medications. This dedication is key to your success.',
        icon: '⭐',
        confidence
      };
    } else if (checkinsData.length >= 5) {
      return {
        type: 'consistency',
        title: 'You\'re building healthy habits! 🎯',
        message: `${checkinsData.length} check-ins this week shows your commitment to tracking your journey.`,
        icon: '✨',
        confidence
      };
    } else {
      return {
        type: 'encouragement',
        title: 'Every step counts! 👣',
        message: 'Remember, small consistent actions lead to big changes over time.',
        icon: '💪',
        confidence
      };
    }
  }

  /**
   * Save insight to database
   */
  async saveInsight(userId, insight) {
    const insightData = {
      user_id: userId,
      insight_type: 'daily_insight',
      insight_title: insight.title,
      insight_message: insight.message,
      insight_id: `daily_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      context_data: JSON.stringify({ 
        insight_type: insight.type,
        icon: insight.icon 
      })
    };

    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      // For PostgreSQL, use different field names
      const dbData = this.db.isPostgres ? {
        user_id: userId,
        insight_type: 'daily_insight',
        title: insight.title,
        message: insight.message,
        priority: 5,
        insight_data: {
          insight_id: insightData.insight_id,
          insight_type: insight.type,
          icon: insight.icon,
          date: insightData.date
        }
      } : insightData;
      
      const savedInsight = await this.db.localDb.createInsight(dbData);
      return {
        ...insight,
        id: savedInsight.id,
        insight_id: insightData.insight_id
      };
    }

    // Airtable
    const result = await this.db.airtableRequest('Insights', 'POST', {
      fields: {
        ...insightData,
        user_id: [userId] // Array format for Airtable
      }
    });

    return {
      ...insight,
      id: result.id,
      insight_id: insightData.insight_id
    };
  }

  /**
   * Get user's insights
   */
  async getUserInsights(userId, limit = 30) {
    if (this.db.isPostgres || this.db.isUsingLocalDatabase()) {
      return await this.db.localDb.getUserInsights(userId, limit);
    }

    // Airtable
    const url = `${config.airtable.baseUrl}/Insights?filterByFormula=user_id='${userId}'&sort[0][field]=date&sort[0][direction]=desc&maxRecords=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.airtable.apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new AppError('Failed to retrieve insights', response.status);
    }
    
    const result = await response.json();
    return result.records || [];
  }

  /**
   * Generate engagement insights
   */
  async generateEngagementInsights() {
    // Get recent check-ins across all users
    const recentCheckins = await checkinService.getRecentCheckins(100);
    const checkins = recentCheckins.records || [];

    // Group by user
    const userGroups = {};
    checkins.forEach(record => {
      const userId = record.fields?.user_id || record.user_id;
      if (!userGroups[userId]) {
        userGroups[userId] = [];
      }
      userGroups[userId].push(record);
    });

    // Calculate engagement metrics
    const activeUsers = Object.keys(userGroups).length;
    const totalCheckins = checkins.length;
    const avgCheckinsPerUser = activeUsers > 0 ? totalCheckins / activeUsers : 0;

    // Find most engaged users
    const engagementScores = Object.entries(userGroups).map(([userId, userCheckins]) => ({
      userId,
      checkinsCount: userCheckins.length,
      lastCheckin: userCheckins[0]?.fields?.date_submitted || userCheckins[0]?.date_submitted
    }));

    engagementScores.sort((a, b) => b.checkinsCount - a.checkinsCount);

    return {
      summary: {
        activeUsers,
        totalCheckins,
        avgCheckinsPerUser: Math.round(avgCheckinsPerUser * 10) / 10,
        period: 'last_100_checkins'
      },
      topUsers: engagementScores.slice(0, 10),
      insights: this.generateEngagementMessages(activeUsers, avgCheckinsPerUser)
    };
  }

  /**
   * Generate engagement messages
   */
  generateEngagementMessages(activeUsers, avgCheckinsPerUser) {
    const insights = [];

    if (activeUsers > 50) {
      insights.push({
        type: 'high_engagement',
        message: `Great engagement! ${activeUsers} users are actively tracking their journey.`,
        icon: '🎉'
      });
    }

    if (avgCheckinsPerUser > 5) {
      insights.push({
        type: 'consistent_usage',
        message: 'Users are highly engaged with an average of ' + Math.round(avgCheckinsPerUser) + ' check-ins each.',
        icon: '📈'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'growing_community',
        message: 'The Novara community is growing. Every check-in helps build better insights!',
        icon: '🌱'
      });
    }

    return insights;
  }
}

// Export singleton instance
const insightsService = new InsightsService();
module.exports = insightsService;