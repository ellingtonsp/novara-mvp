/**
 * Weekly Insights Tests with Time Simulation
 * 
 * Tests weekly insight generation including:
 * - Pattern recognition over time
 * - Insight evolution and adaptation
 * - Trend analysis and predictions
 * - Personalized weekly summaries
 */

const { TimeSimulator, TestUserFactory, MockCheckinFactory, TestAssertions } = require('./time-simulation.test');

describe('Weekly Insights with Time Simulation', () => {
  let timeSimulator;
  let mockCheckins = [];

  beforeEach(() => {
    timeSimulator = new TimeSimulator('2025-01-01T00:00:00.000Z');
    timeSimulator.start();
    mockCheckins = [];
  });

  afterEach(() => {
    timeSimulator.stop();
    mockCheckins = [];
  });

  describe('Pattern Recognition Over Time', () => {
    test('should identify improving confidence trends', () => {
      const user = TestUserFactory.createUser();
      
      // Simulate 4 weeks of gradually improving confidence
      const weeklyConfidencePatterns = [
        [3, 3, 4, 3, 4, 3, 4], // Week 1: Low confidence (avg 3.4)
        [4, 4, 5, 4, 5, 5, 4], // Week 2: Improving (avg 4.4) 
        [5, 6, 5, 6, 6, 5, 6], // Week 3: Good progress (avg 5.6)
        [6, 7, 6, 7, 7, 6, 7]  // Week 4: Strong confidence (avg 6.6)
      ];

      let dayCounter = 1;
      weeklyConfidencePatterns.forEach((week, weekIndex) => {
        week.forEach((confidence, dayIndex) => {
          timeSimulator.setDate(`2025-01-${String(dayCounter).padStart(2, '0')}T10:00:00.000Z`);
          
          mockCheckins.push(MockCheckinFactory.createCheckin(user, {
            confidence_today: confidence,
            medication_confidence_today: confidence,
            date_submitted: timeSimulator.getCurrentDateString(),
            created_at: timeSimulator.getCurrentISO()
          }));
          
          dayCounter++;
        });
      });

      const weeklyInsights = generateWeeklyInsights(user, mockCheckins);
      
      expect(weeklyInsights).toHaveLength(4);
      expect(weeklyInsights[0].trend).toBe('improving');
      expect(weeklyInsights[3].achievement).toBeDefined();
      expect(weeklyInsights[3].achievement.type).toBe('confidence_growth');
    });

    test('should detect cyclical patterns in mood and energy', () => {
      const user = TestUserFactory.createStimulationUser();
      
      // Simulate medication cycle pattern: high energy early in week, lower towards end
      const cyclicalPattern = [
        // Week 1: Start of stimulation cycle
        { mood: ['energetic', 'hopeful'], confidence: 7 },
        { mood: ['energetic', 'focused'], confidence: 7 },
        { mood: ['optimistic', 'focused'], confidence: 6 },
        { mood: ['tired', 'hopeful'], confidence: 6 },
        { mood: ['tired', 'anxious'], confidence: 5 },
        { mood: ['exhausted', 'anxious'], confidence: 4 },
        { mood: ['exhausted', 'overwhelmed'], confidence: 4 },
        
        // Week 2: Similar pattern
        { mood: ['energetic', 'hopeful'], confidence: 7 },
        { mood: ['energetic', 'focused'], confidence: 7 },
        { mood: ['optimistic', 'focused'], confidence: 6 },
        { mood: ['tired', 'hopeful'], confidence: 5 },
        { mood: ['tired', 'anxious'], confidence: 5 },
        { mood: ['exhausted', 'anxious'], confidence: 4 },
        { mood: ['exhausted', 'overwhelmed'], confidence: 3 }
      ];

      cyclicalPattern.forEach((day, index) => {
        timeSimulator.setDate(`2025-01-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`);
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          mood_today: day.mood,
          confidence_today: day.confidence,
          medication_confidence_today: day.confidence,
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      });

      const weeklyInsights = generateWeeklyInsights(user, mockCheckins);
      const patterns = detectCyclicalPatterns(mockCheckins);
      
      expect(patterns.weekly_cycle).toBeDefined();
      expect(patterns.weekly_cycle.confidence_dip).toBeTruthy();
      expect(weeklyInsights[1].pattern_insight).toContain('week');
    });
  });

  describe('Insight Evolution and Adaptation', () => {
    test('should provide increasingly sophisticated insights over time', () => {
      const user = TestUserFactory.createUser();
      
      // Week 1: Basic insights
      for (let day = 1; day <= 7; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createPositiveCheckin(user));
      }

      let insights = generateWeeklyInsights(user, mockCheckins);
      expect(insights[0].sophistication_level).toBe('basic');
      expect(insights[0].insights.length).toBeLessThanOrEqual(2);

      // Week 8: More sophisticated insights with more data
      for (let week = 2; week <= 8; week++) {
        for (let day = 1; day <= 7; day++) {
          const currentDay = (week - 1) * 7 + day;
          timeSimulator.setDate(`2025-01-${String(currentDay).padStart(2, '0')}T10:00:00.000Z`);
          
          // Vary check-ins to provide richer data
          const checkinType = Math.random() > 0.5 ? 'positive' : 'mixed';
          const checkin = checkinType === 'positive' ? 
            MockCheckinFactory.createPositiveCheckin(user) :
            MockCheckinFactory.createMixedSentimentCheckin(user);
          
          mockCheckins.push(checkin);
        }
      }

      insights = generateWeeklyInsights(user, mockCheckins);
      const latestInsight = insights[insights.length - 1];
      
      expect(latestInsight.sophistication_level).toBe('advanced');
      expect(latestInsight.insights.length).toBeGreaterThanOrEqual(3);
      expect(latestInsight.predictions).toBeDefined();
    });

    test('should adapt insights based on cycle stage progression', () => {
      const user = TestUserFactory.createUser({ cycle_stage: 'ivf_prep' });
      
      // Week 1-2: IVF Prep stage
      for (let day = 1; day <= 14; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          medication_readiness_today: 5,
          medication_preparation_concern: 'nervous about starting',
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      let insights = generateWeeklyInsights(user, mockCheckins);
      expect(insights[1].focus_area).toBe('preparation');
      expect(insights[1].stage_specific_insights).toContain('readiness');

      // Week 3-4: User progresses to stimulation
      user.cycle_stage = 'stimulation';
      for (let day = 15; day <= 28; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          medication_confidence_today: 6,
          medication_concern_today: 'managing side effects',
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      insights = generateWeeklyInsights(user, mockCheckins);
      const stimulationInsights = insights.slice(2);
      
      expect(stimulationInsights[0].focus_area).toBe('active_treatment');
      expect(stimulationInsights[0].stage_specific_insights).toContain('confidence');
    });
  });

  describe('Trend Analysis and Predictions', () => {
    test('should predict confidence trajectory based on trends', () => {
      const user = TestUserFactory.createUser();
      
      // Create upward confidence trend
      const confidenceTrend = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
      
      confidenceTrend.forEach((confidence, index) => {
        timeSimulator.setDate(`2025-01-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          confidence_today: confidence,
          medication_confidence_today: confidence,
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      });

      const insights = generateWeeklyInsights(user, mockCheckins);
      const latestInsight = insights[insights.length - 1];
      
      expect(latestInsight.predictions.confidence_trajectory).toBe('strongly_improving');
      expect(latestInsight.predictions.next_week_confidence).toBeGreaterThan(8);
      expect(latestInsight.predictions.milestone_predictions).toBeDefined();
    });

    test('should predict potential challenges based on patterns', () => {
      const user = TestUserFactory.createStimulationUser();
      
      // Create pattern showing weekend dips in confidence
      const weekPattern = [7, 7, 6, 5, 4, 3, 3]; // Mon-Sun pattern
      
      // Repeat pattern for 3 weeks
      for (let week = 0; week < 3; week++) {
        weekPattern.forEach((confidence, dayIndex) => {
          const currentDay = week * 7 + dayIndex + 1;
          timeSimulator.setDate(`2025-01-${String(currentDay).padStart(2, '0')}T10:00:00.000Z`);
          
          mockCheckins.push(MockCheckinFactory.createCheckin(user, {
            confidence_today: confidence,
            medication_confidence_today: confidence,
            date_submitted: timeSimulator.getCurrentDateString(),
            created_at: timeSimulator.getCurrentISO()
          }));
        });
      }

      const insights = generateWeeklyInsights(user, mockCheckins);
      const latestInsight = insights[insights.length - 1];
      
      expect(latestInsight.risk_predictions.weekend_confidence_dip).toBeTruthy();
      expect(latestInsight.preemptive_support).toBeDefined();
      expect(latestInsight.preemptive_support.timing).toContain('weekend');
    });
  });

  describe('Personalized Weekly Summaries', () => {
    test('should generate comprehensive weekly summary with achievements', () => {
      const user = TestUserFactory.createUser();
      
      // Create a successful week with mixed experiences
      const weeklyData = [
        { confidence: 5, mood: ['hopeful', 'anxious'], insight_feedback: 'helpful' },
        { confidence: 6, mood: ['optimistic', 'focused'], insight_feedback: 'helpful' },
        { confidence: 4, mood: ['tired', 'overwhelmed'], insight_feedback: 'not_helpful' },
        { confidence: 7, mood: ['energetic', 'hopeful'], insight_feedback: 'helpful' },
        { confidence: 8, mood: ['confident', 'excited'], insight_feedback: 'very_helpful' },
        { confidence: 7, mood: ['calm', 'focused'], insight_feedback: 'helpful' },
        { confidence: 8, mood: ['proud', 'grateful'], insight_feedback: 'very_helpful' }
      ];

      weeklyData.forEach((day, index) => {
        timeSimulator.setDate(`2025-01-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`);
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          confidence_today: day.confidence,
          mood_today: day.mood,
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      });

      const weeklySummary = generateWeeklySummary(user, mockCheckins);
      
      expect(weeklySummary.check_in_streak).toBe(7);
      expect(weeklySummary.average_confidence).toBeCloseTo(6.4, 1);
      expect(weeklySummary.confidence_range.high).toBe(8);
      expect(weeklySummary.confidence_range.low).toBe(4);
      expect(weeklySummary.mood_patterns).toBeDefined();
      expect(weeklySummary.achievements).toContain('completed_full_week');
      expect(weeklySummary.growth_areas).toBeDefined();
    });

    test('should provide actionable recommendations based on weekly data', () => {
      const user = TestUserFactory.createUser();
      
      // Create pattern showing medication concerns
      for (let day = 1; day <= 7; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          confidence_today: 4,
          medication_confidence_today: 2, // Consistently low
          medication_concern_today: 'confused about timing and dosages',
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      const weeklySummary = generateWeeklySummary(user, mockCheckins);
      const recommendations = generateWeeklyRecommendations(weeklySummary, user);
      
      expect(recommendations.priority_actions).toContain('medication_clarity');
      expect(recommendations.suggested_resources).toBeDefined();
      expect(recommendations.next_week_focus).toBe('medication_confidence');
      expect(recommendations.timeline).toBeDefined();
    });
  });

  describe('Insight Quality and Helpfulness Tracking', () => {
    test('should track insight helpfulness over time and adapt', () => {
      const user = TestUserFactory.createUser();
      const insightFeedback = [];
      
      // Simulate 2 weeks of insights with feedback
      for (let day = 1; day <= 14; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        
        const feedback = day <= 7 ? 'not_helpful' : 'helpful'; // Improvement after week 1
        insightFeedback.push({
          day,
          feedback,
          insight_type: 'daily_insight',
          copy_variant: 'medication_concern'
        });
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      const qualityAnalysis = analyzeInsightQuality(insightFeedback);
      const weeklyInsights = generateWeeklyInsights(user, mockCheckins, insightFeedback);
      
      expect(qualityAnalysis.week1_helpfulness).toBeLessThan(0.5);
      expect(qualityAnalysis.week2_helpfulness).toBeGreaterThan(0.8);
      expect(qualityAnalysis.improvement_trend).toBe('positive');
      
      expect(weeklyInsights[1].insight_quality_metrics).toBeDefined();
      expect(weeklyInsights[1].adaptation_notes).toContain('improved');
    });
  });
});

// Mock implementations for weekly insight generation

function generateWeeklyInsights(user, checkins, insightFeedback = []) {
  const weeks = groupCheckinsByWeek(checkins);
  const insights = [];

  weeks.forEach((weekCheckins, weekIndex) => {
    const weekNumber = weekIndex + 1;
    const weekStart = new Date(weekCheckins[0].date_submitted);
    const weekEnd = new Date(weekCheckins[weekCheckins.length - 1].date_submitted);
    
    const weeklyStats = calculateWeeklyStats(weekCheckins);
    const trends = analyzeTrends(weekCheckins, checkins);
    const patterns = detectWeeklyPatterns(weekCheckins);
    
    const insight = {
      week: weekNumber,
      date_range: { start: weekStart, end: weekEnd },
      sophistication_level: weekNumber <= 2 ? 'basic' : weekNumber <= 6 ? 'intermediate' : 'advanced',
      focus_area: determineFocusArea(user, weekCheckins),
      stage_specific_insights: generateStageSpecificInsights(user, weekCheckins),
      trend: trends.overall_direction,
      insights: generateWeeklyInsightMessages(weeklyStats, trends, patterns),
      achievements: detectWeeklyAchievements(weekCheckins, weekIndex),
      predictions: weekNumber >= 3 ? generatePredictions(checkins, weekIndex) : null,
      pattern_insight: patterns.description,
      risk_predictions: assessRiskPredictions(weekCheckins, patterns),
      preemptive_support: generatePreemptiveSupport(patterns),
      insight_quality_metrics: analyzeWeeklyInsightQuality(insightFeedback, weekNumber),
      adaptation_notes: generateAdaptationNotes(insightFeedback, weekNumber)
    };

    insights.push(insight);
  });

  return insights;
}

function generateWeeklySummary(user, checkins) {
  const weekCheckins = checkins.slice(-7); // Last 7 days
  
  const confidenceValues = weekCheckins.map(c => c.confidence_today);
  const avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
  
  return {
    check_in_streak: weekCheckins.length,
    average_confidence: avgConfidence,
    confidence_range: {
      high: Math.max(...confidenceValues),
      low: Math.min(...confidenceValues)
    },
    mood_patterns: analyzeMoodPatterns(weekCheckins),
    achievements: detectWeeklyAchievements(weekCheckins, 0),
    growth_areas: identifyGrowthAreas(weekCheckins)
  };
}

function generateWeeklyRecommendations(summary, user) {
  const recommendations = {
    priority_actions: [],
    suggested_resources: [],
    next_week_focus: null,
    timeline: 'next_7_days'
  };

  if (summary.average_confidence < 5) {
    recommendations.priority_actions.push('confidence_building');
    recommendations.next_week_focus = 'confidence_growth';
  }

  // Check for medication patterns
  if (summary.growth_areas.includes('medication_confidence')) {
    recommendations.priority_actions.push('medication_clarity');
    recommendations.next_week_focus = 'medication_confidence';
    recommendations.suggested_resources.push('medication_guide');
  }

  return recommendations;
}

function analyzeInsightQuality(feedbackData) {
  const week1 = feedbackData.filter(f => f.day <= 7);
  const week2 = feedbackData.filter(f => f.day > 7 && f.day <= 14);
  
  const calculateHelpfulness = (feedback) => {
    const helpful = feedback.filter(f => f.feedback === 'helpful' || f.feedback === 'very_helpful').length;
    return helpful / feedback.length;
  };

  const week1Helpfulness = calculateHelpfulness(week1);
  const week2Helpfulness = calculateHelpfulness(week2);

  return {
    week1_helpfulness: week1Helpfulness,
    week2_helpfulness: week2Helpfulness,
    improvement_trend: week2Helpfulness > week1Helpfulness ? 'positive' : 'negative'
  };
}

// Helper functions

function groupCheckinsByWeek(checkins) {
  const weeks = [];
  let currentWeek = [];
  
  checkins.forEach((checkin, index) => {
    currentWeek.push(checkin);
    
    if ((index + 1) % 7 === 0 || index === checkins.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  return weeks;
}

function calculateWeeklyStats(weekCheckins) {
  const confidenceValues = weekCheckins.map(c => c.confidence_today);
  
  return {
    avg_confidence: confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length,
    confidence_trend: confidenceValues[confidenceValues.length - 1] - confidenceValues[0],
    check_in_count: weekCheckins.length,
    mood_diversity: [...new Set(weekCheckins.flatMap(c => c.mood_today))].length
  };
}

function analyzeTrends(weekCheckins, allCheckins) {
  const weekConfidence = weekCheckins.map(c => c.confidence_today);
  const avgWeekConfidence = weekConfidence.reduce((sum, val) => sum + val, 0) / weekConfidence.length;
  
  const previousWeekCheckins = allCheckins.slice(-14, -7);
  const prevAvgConfidence = previousWeekCheckins.length > 0 ?
    previousWeekCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / previousWeekCheckins.length : 0;

  return {
    overall_direction: avgWeekConfidence > prevAvgConfidence ? 'improving' : 'declining',
    confidence_change: avgWeekConfidence - prevAvgConfidence
  };
}

function detectWeeklyPatterns(weekCheckins) {
  // Simplified pattern detection
  const confidenceByDay = weekCheckins.map(c => c.confidence_today);
  const hasWeekendDip = confidenceByDay.slice(-2).every(c => c < confidenceByDay.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5);
  
  return {
    weekend_confidence_dip: hasWeekendDip,
    description: hasWeekendDip ? 'Confidence tends to dip on weekends' : 'Stable confidence throughout week'
  };
}

function determineFocusArea(user, weekCheckins) {
  if (user.cycle_stage === 'ivf_prep' || user.cycle_stage === 'considering') {
    return 'preparation';
  } else if (['stimulation', 'retrieval', 'transfer', 'tww'].includes(user.cycle_stage)) {
    return 'active_treatment';
  } else if (user.cycle_stage === 'pregnant') {
    return 'pregnancy_support';
  } else {
    return 'general_support';
  }
}

function generateStageSpecificInsights(user, weekCheckins) {
  const focusArea = determineFocusArea(user, weekCheckins);
  
  const insights = {
    'preparation': 'Building readiness and confidence for upcoming treatment',
    'active_treatment': 'Managing confidence and expectations during active treatment',
    'pregnancy_support': 'Supporting positive pregnancy experience',
    'general_support': 'Maintaining emotional well-being throughout journey'
  };

  return insights[focusArea] || insights['general_support'];
}

function generateWeeklyInsightMessages(stats, trends, patterns) {
  const messages = [];
  
  if (stats.avg_confidence >= 7) {
    messages.push('Your confidence has been strong this week!');
  } else if (stats.avg_confidence < 4) {
    messages.push('This week showed some challenges - let\'s focus on building confidence.');
  }

  if (trends.overall_direction === 'improving') {
    messages.push('Great progress - your confidence is trending upward!');
  }

  if (patterns.weekend_confidence_dip) {
    messages.push('Consider some weekend self-care to maintain momentum.');
  }

  return messages;
}

function detectWeeklyAchievements(weekCheckins, weekIndex) {
  const achievements = [];
  
  if (weekCheckins.length === 7) {
    achievements.push('completed_full_week');
  }

  const avgConfidence = weekCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / weekCheckins.length;
  if (avgConfidence >= 7) {
    achievements.push('high_confidence_week');
  }

  if (weekIndex >= 3) {
    achievements.push('consistency_milestone');
  }

  return achievements;
}

function generatePredictions(allCheckins, currentWeekIndex) {
  const recentCheckins = allCheckins.slice(-14); // Last 2 weeks
  const avgConfidence = recentCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / recentCheckins.length;
  
  return {
    confidence_trajectory: avgConfidence >= 6 ? 'strongly_improving' : 'needs_support',
    next_week_confidence: Math.min(10, avgConfidence + 0.5),
    milestone_predictions: ['confidence_growth', 'consistency_achievement']
  };
}

function assessRiskPredictions(weekCheckins, patterns) {
  return {
    weekend_confidence_dip: patterns.weekend_confidence_dip,
    low_engagement_risk: weekCheckins.length < 5
  };
}

function generatePreemptiveSupport(patterns) {
  if (patterns.weekend_confidence_dip) {
    return {
      timing: 'weekend',
      suggestion: 'Plan some relaxing activities for the weekend',
      resources: ['self_care_guide', 'weekend_support']
    };
  }
  return null;
}

function analyzeMoodPatterns(weekCheckins) {
  const allMoods = weekCheckins.flatMap(c => c.mood_today);
  const moodCounts = allMoods.reduce((counts, mood) => {
    counts[mood] = (counts[mood] || 0) + 1;
    return counts;
  }, {});

  return {
    most_common: Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0],
    diversity: Object.keys(moodCounts).length,
    positive_ratio: allMoods.filter(m => ['hopeful', 'optimistic', 'energetic', 'confident'].includes(m)).length / allMoods.length
  };
}

function identifyGrowthAreas(weekCheckins) {
  const areas = [];
  
  const avgMedConfidence = weekCheckins
    .map(c => c.medication_confidence_today)
    .filter(Boolean)
    .reduce((sum, val, _, arr) => sum + val / arr.length, 0);
    
  if (avgMedConfidence < 5) {
    areas.push('medication_confidence');
  }

  const avgOverallConfidence = weekCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / weekCheckins.length;
  if (avgOverallConfidence < 5) {
    areas.push('overall_confidence');
  }

  return areas;
}

function analyzeWeeklyInsightQuality(feedbackData, weekNumber) {
  const weekFeedback = feedbackData.filter(f => 
    f.day > (weekNumber - 1) * 7 && f.day <= weekNumber * 7
  );
  
  if (weekFeedback.length === 0) return null;
  
  const helpfulCount = weekFeedback.filter(f => 
    f.feedback === 'helpful' || f.feedback === 'very_helpful'
  ).length;
  
  return {
    helpfulness_rate: helpfulCount / weekFeedback.length,
    total_feedback: weekFeedback.length,
    improvement_needed: helpfulCount / weekFeedback.length < 0.7
  };
}

function generateAdaptationNotes(feedbackData, weekNumber) {
  if (weekNumber === 1) return null;
  
  const currentWeekQuality = analyzeWeeklyInsightQuality(feedbackData, weekNumber);
  const previousWeekQuality = analyzeWeeklyInsightQuality(feedbackData, weekNumber - 1);
  
  if (!currentWeekQuality || !previousWeekQuality) return null;
  
  if (currentWeekQuality.helpfulness_rate > previousWeekQuality.helpfulness_rate) {
    return 'Insight quality improved based on feedback adaptation';
  } else {
    return 'Continue refining insight personalization';
  }
}

function detectCyclicalPatterns(checkins) {
  // Simplified cyclical pattern detection
  const weeklyStats = [];
  
  for (let i = 0; i < checkins.length; i += 7) {
    const weekCheckins = checkins.slice(i, i + 7);
    const avgConfidence = weekCheckins.reduce((sum, c) => sum + c.confidence_today, 0) / weekCheckins.length;
    weeklyStats.push(avgConfidence);
  }
  
  // Check for weekly dip pattern
  const hasWeeklyDip = weeklyStats.length >= 2 && 
    weeklyStats.every(weekAvg => {
      const weekCheckins = checkins.slice(weeklyStats.indexOf(weekAvg) * 7, (weeklyStats.indexOf(weekAvg) + 1) * 7);
      const weekendAvg = weekCheckins.slice(-2).reduce((sum, c) => sum + c.confidence_today, 0) / 2;
      return weekendAvg < weekAvg;
    });

  return {
    weekly_cycle: {
      confidence_dip: hasWeeklyDip,
      pattern_strength: hasWeeklyDip ? 0.8 : 0.2
    }
  };
}

module.exports = {
  generateWeeklyInsights,
  generateWeeklySummary,
  generateWeeklyRecommendations,
  analyzeInsightQuality,
  detectCyclicalPatterns
}; 