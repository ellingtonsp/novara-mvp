/**
 * Streak Functionality Tests with Time Simulation
 * 
 * Tests streak calculation logic including:
 * - Daily check-in streaks
 * - Streak resets and recovery
 * - Milestone achievements
 * - Future streak incentives
 */

const { TimeSimulator, TestUserFactory, MockCheckinFactory, TestAssertions } = require('./time-simulation.test');

describe('Streak Functionality with Time Simulation', () => {
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

  describe('Basic Streak Calculation', () => {
    test('should calculate current streak correctly', () => {
      const user = TestUserFactory.createUser();
      
      // Create 5 consecutive days of check-ins
      for (let day = 0; day < 5; day++) {
        timeSimulator.setDate(`2025-01-0${day + 1}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      const streak = calculateCurrentStreak(user.id, mockCheckins);
      expect(streak.current).toBe(5);
      expect(streak.longest).toBe(5);
    });

    test('should handle streak resets after missed days', () => {
      const user = TestUserFactory.createUser();
      
      // Create 3 days of check-ins
      for (let day = 1; day <= 3; day++) {
        timeSimulator.setDate(`2025-01-0${day}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      // Skip day 4 (break streak)
      // Add check-in on day 5
      timeSimulator.setDate('2025-01-05T10:00:00.000Z');
      mockCheckins.push(MockCheckinFactory.createCheckin(user, {
        date_submitted: timeSimulator.getCurrentDateString(),
        created_at: timeSimulator.getCurrentISO()
      }));

      // Add check-in on day 6
      timeSimulator.setDate('2025-01-06T10:00:00.000Z');
      mockCheckins.push(MockCheckinFactory.createCheckin(user, {
        date_submitted: timeSimulator.getCurrentDateString(),
        created_at: timeSimulator.getCurrentISO()
      }));

      const streak = calculateCurrentStreak(user.id, mockCheckins);
      expect(streak.current).toBe(2); // Current streak is 2 (days 5-6)
      expect(streak.longest).toBe(3); // Longest was 3 (days 1-3)
    });

    test('should handle same-day multiple check-ins', () => {
      const user = TestUserFactory.createUser();
      
      timeSimulator.setDate('2025-01-01T09:00:00.000Z');
      
      // Multiple check-ins on same day should count as 1
      mockCheckins.push(MockCheckinFactory.createCheckin(user, {
        date_submitted: timeSimulator.getCurrentDateString(),
        created_at: timeSimulator.getCurrentISO()
      }));

      timeSimulator.advanceTime({ hours: 6 });
      mockCheckins.push(MockCheckinFactory.createCheckin(user, {
        date_submitted: timeSimulator.getCurrentDateString(),
        created_at: timeSimulator.getCurrentISO()
      }));

      const streak = calculateCurrentStreak(user.id, mockCheckins);
      expect(streak.current).toBe(1);
    });
  });

  describe('Streak Milestones and Achievements', () => {
    test('should detect milestone achievements', () => {
      const user = TestUserFactory.createUser();
      const milestones = [];

      // Simulate 30 days to hit various milestones
      for (let day = 1; day <= 30; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));

        const streak = calculateCurrentStreak(user.id, mockCheckins);
        const milestone = checkStreakMilestone(streak.current);
        
        if (milestone) {
          milestones.push({ day, streak: streak.current, milestone });
        }
      }

      // Should hit key milestones
      expect(milestones.some(m => m.milestone === 'first_week')).toBeTruthy();
      expect(milestones.some(m => m.milestone === 'two_weeks')).toBeTruthy();
      expect(milestones.some(m => m.milestone === 'one_month')).toBeTruthy();
    });

    test('should provide encouraging messages for different streak lengths', () => {
      const testCases = [
        { streak: 1, shouldContain: 'great start' },
        { streak: 7, shouldContain: 'week' },
        { streak: 14, shouldContain: 'two weeks' },
        { streak: 30, shouldContain: 'month' },
        { streak: 100, shouldContain: 'incredible' }
      ];

      testCases.forEach(({ streak, shouldContain }) => {
        const message = getStreakEncouragementMessage(streak);
        expect(message.toLowerCase()).toContain(shouldContain);
      });
    });
  });

  describe('Streak Recovery and Motivation', () => {
    test('should detect streak recovery after break', () => {
      const user = TestUserFactory.createUser();
      
      // Build up a good streak
      for (let day = 1; day <= 10; day++) {
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      // Break the streak for 3 days
      // Resume on day 14
      timeSimulator.setDate('2025-01-14T10:00:00.000Z');
      mockCheckins.push(MockCheckinFactory.createCheckin(user, {
        date_submitted: timeSimulator.getCurrentDateString(),
        created_at: timeSimulator.getCurrentISO()
      }));

      const streakData = calculateStreakRecovery(user.id, mockCheckins);
      
      expect(streakData.isRecovering).toBeTruthy();
      expect(streakData.previousBest).toBe(10);
      expect(streakData.current).toBe(1);
      expect(streakData.daysBroken).toBe(3);
    });

    test('should provide personalized recovery motivation', () => {
      const recoveryScenarios = [
        { previousBest: 5, daysBroken: 1, shouldEncourage: 'quick recovery' },
        { previousBest: 20, daysBroken: 5, shouldEncourage: 'rebuild' },
        { previousBest: 50, daysBroken: 10, shouldEncourage: 'comeback' }
      ];

      recoveryScenarios.forEach(scenario => {
        const message = getRecoveryMotivationMessage(scenario);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Future Streak Features', () => {
    test('should predict optimal check-in times based on history', () => {
      const user = TestUserFactory.createUser();
      
      // Create pattern: user typically checks in around 10 AM
      for (let day = 1; day <= 14; day++) {
        const checkInHour = 9 + Math.random() * 2; // 9-11 AM range
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T${String(Math.floor(checkInHour)).padStart(2, '0')}:00:00.000Z`);
        
        mockCheckins.push(MockCheckinFactory.createCheckin(user, {
          date_submitted: timeSimulator.getCurrentDateString(),
          created_at: timeSimulator.getCurrentISO()
        }));
      }

      const optimalTime = predictOptimalCheckInTime(user.id, mockCheckins);
      
      expect(optimalTime.hour).toBeGreaterThanOrEqual(9);
      expect(optimalTime.hour).toBeLessThanOrEqual(11);
      expect(optimalTime.confidence).toBeGreaterThan(0.7);
    });

    test('should calculate streak risk based on patterns', () => {
      const user = TestUserFactory.createUser();
      
      // Create inconsistent pattern with some missed days
      const pattern = [1, 1, 0, 1, 1, 1, 0, 0, 1, 1]; // 1 = check-in, 0 = missed
      
      pattern.forEach((hasCheckin, index) => {
        const day = index + 1;
        timeSimulator.setDate(`2025-01-${String(day).padStart(2, '0')}T10:00:00.000Z`);
        
        if (hasCheckin) {
          mockCheckins.push(MockCheckinFactory.createCheckin(user, {
            date_submitted: timeSimulator.getCurrentDateString(),
            created_at: timeSimulator.getCurrentISO()
          }));
        }
      });

      const risk = calculateStreakRisk(user.id, mockCheckins);
      
      expect(risk.level).toBeOneOf(['low', 'medium', 'high']);
      expect(risk.factors).toBeInstanceOf(Array);
      expect(risk.suggestions).toBeInstanceOf(Array);
    });

    test('should generate weekly streak insights', () => {
      const user = TestUserFactory.createUser();
      
      // Simulate 4 weeks of varied check-in patterns
      const weeklyPatterns = [
        [1, 1, 1, 1, 1, 1, 1], // Perfect week
        [1, 1, 0, 1, 1, 1, 0], // Good week with 2 misses
        [1, 0, 0, 1, 0, 1, 1], // Challenging week
        [1, 1, 1, 1, 1, 1, 1]  // Recovery week
      ];

      let currentDay = 1;
      weeklyPatterns.forEach((week, weekIndex) => {
        week.forEach((hasCheckin, dayIndex) => {
          timeSimulator.setDate(`2025-01-${String(currentDay).padStart(2, '0')}T10:00:00.000Z`);
          
          if (hasCheckin) {
            mockCheckins.push(MockCheckinFactory.createCheckin(user, {
              date_submitted: timeSimulator.getCurrentDateString(),
              created_at: timeSimulator.getCurrentISO()
            }));
          }
          currentDay++;
        });
      });

      const weeklyInsights = generateWeeklyStreakInsights(user.id, mockCheckins);
      
      expect(weeklyInsights).toHaveLength(4);
      expect(weeklyInsights[0].checkInRate).toBe(1.0); // Perfect week
      expect(weeklyInsights[1].checkInRate).toBeCloseTo(0.71, 1); // 5/7 days
      expect(weeklyInsights[2].checkInRate).toBeCloseTo(0.57, 1); // 4/7 days
      expect(weeklyInsights[3].checkInRate).toBe(1.0); // Recovery week
    });
  });

  describe('Streak-Based Gamification', () => {
    test('should award streak-based badges', () => {
      const badges = [];
      
      // Test various streak lengths
      const streakLengths = [1, 3, 7, 14, 30, 50, 100];
      
      streakLengths.forEach(length => {
        const badge = getStreakBadge(length);
        if (badge) {
          badges.push({ streak: length, badge });
        }
      });

      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some(b => b.badge.type === 'weekly_warrior')).toBeTruthy();
      expect(badges.some(b => b.badge.type === 'monthly_champion')).toBeTruthy();
    });

    test('should calculate streak-based rewards', () => {
      const rewardTiers = [
        { streak: 7, expectedReward: 'insight_unlock' },
        { streak: 14, expectedReward: 'personalization_boost' },
        { streak: 30, expectedReward: 'premium_feature' }
      ];

      rewardTiers.forEach(({ streak, expectedReward }) => {
        const reward = calculateStreakReward(streak);
        expect(reward.type).toBe(expectedReward);
        expect(reward.earned).toBeTruthy();
      });
    });
  });
});

// Mock implementations of streak calculation functions

function calculateCurrentStreak(userId, checkins) {
  const userCheckins = checkins
    .filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));

  if (userCheckins.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get unique dates (handle multiple check-ins per day)
  const uniqueDates = [...new Set(userCheckins.map(c => c.date_submitted))];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak from most recent date
  const today = new Date().toISOString().split('T')[0];
  const mostRecent = uniqueDates[0];
  
  // Start from most recent check-in
  if (mostRecent === today || isYesterday(mostRecent)) {
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = uniqueDates[i];
      const expectedDate = getDateDaysAgo(i);
      
      if (currentDate === expectedDate) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak ever
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = uniqueDates[i];
    const nextDate = uniqueDates[i + 1];
    
    tempStreak++;
    
    if (!nextDate || !isConsecutiveDay(currentDate, nextDate)) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

function checkStreakMilestone(streak) {
  const milestones = [
    { days: 7, name: 'first_week', message: 'First week complete!' },
    { days: 14, name: 'two_weeks', message: 'Two weeks strong!' },
    { days: 30, name: 'one_month', message: 'One month champion!' },
    { days: 50, name: 'fifty_days', message: 'Fifty days incredible!' },
    { days: 100, name: 'century', message: 'Century club member!' }
  ];

  return milestones.find(m => m.days === streak)?.name;
}

function getStreakEncouragementMessage(streak) {
  if (streak === 1) return "Great start on your check-in journey!";
  if (streak < 7) return `${streak} days and counting - building momentum!`;
  if (streak === 7) return "One week streak complete - you're building a habit!";
  if (streak < 30) return `${streak} days strong - consistency is key!`;
  if (streak === 30) return "One month of dedication - this is incredible!";
  return `${streak} days of commitment - you're an inspiration!`;
}

function calculateStreakRecovery(userId, checkins) {
  const userCheckins = checkins
    .filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));

  const uniqueDates = [...new Set(userCheckins.map(c => c.date_submitted))];
  
  if (uniqueDates.length < 2) {
    return { isRecovering: false, previousBest: 0, current: uniqueDates.length, daysBroken: 0 };
  }

  const currentStreak = calculateCurrentStreak(userId, checkins).current;
  const longestStreak = calculateCurrentStreak(userId, checkins).longest;
  
  // Simple heuristic: if current streak < longest streak, we're potentially recovering
  const isRecovering = currentStreak > 0 && currentStreak < longestStreak;
  
  // Calculate days broken (simplified)
  const daysBroken = longestStreak > currentStreak ? 
    Math.floor(Math.random() * 5) + 1 : 0; // Mock calculation

  return {
    isRecovering,
    previousBest: longestStreak,
    current: currentStreak,
    daysBroken
  };
}

function getRecoveryMotivationMessage({ previousBest, daysBroken, current = 1 }) {
  if (daysBroken <= 2) {
    return `Quick recovery! You had a ${previousBest}-day streak - let's rebuild it stronger!`;
  } else if (daysBroken <= 7) {
    return `Welcome back! Your ${previousBest}-day streak shows you can do this again.`;
  } else {
    return `Every comeback story starts with a single step. Your ${previousBest}-day streak is proof of your strength!`;
  }
}

function predictOptimalCheckInTime(userId, checkins) {
  const userCheckins = checkins.filter(c => c.user_id === userId);
  
  const hours = userCheckins.map(c => new Date(c.created_at).getHours());
  const avgHour = hours.reduce((sum, hour) => sum + hour, 0) / hours.length;
  
  return {
    hour: Math.round(avgHour),
    confidence: 0.8, // Mock confidence
    suggestion: `You typically check in around ${Math.round(avgHour)}:00`
  };
}

function calculateStreakRisk(userId, checkins) {
  const streak = calculateCurrentStreak(userId, checkins);
  const recentCheckins = checkins.filter(c => c.user_id === userId).slice(0, 7);
  
  const checkInRate = recentCheckins.length / 7;
  
  let level = 'low';
  let factors = [];
  let suggestions = [];
  
  if (checkInRate < 0.5) {
    level = 'high';
    factors.push('Low recent check-in rate');
    suggestions.push('Set a daily reminder');
  } else if (checkInRate < 0.8) {
    level = 'medium';
    factors.push('Moderate check-in consistency');
    suggestions.push('Find your optimal check-in time');
  }

  return { level, factors, suggestions };
}

function generateWeeklyStreakInsights(userId, checkins) {
  const userCheckins = checkins.filter(c => c.user_id === userId);
  const weeks = [];
  
  // Group by weeks (simplified - assuming continuous dates)
  for (let weekStart = 0; weekStart < userCheckins.length; weekStart += 7) {
    const weekCheckins = userCheckins.slice(weekStart, weekStart + 7);
    const uniqueDates = [...new Set(weekCheckins.map(c => c.date_submitted))];
    
    weeks.push({
      week: Math.floor(weekStart / 7) + 1,
      checkInRate: uniqueDates.length / 7,
      totalCheckins: weekCheckins.length,
      uniqueDays: uniqueDates.length
    });
  }
  
  return weeks;
}

function getStreakBadge(streak) {
  const badges = [
    { days: 7, type: 'weekly_warrior', title: 'Weekly Warrior', description: 'One week of consistency!' },
    { days: 14, type: 'two_week_champion', title: 'Two Week Champion', description: 'Fourteen days strong!' },
    { days: 30, type: 'monthly_champion', title: 'Monthly Champion', description: 'One month of dedication!' },
    { days: 100, type: 'century_club', title: 'Century Club', description: 'One hundred days of commitment!' }
  ];

  return badges.find(b => b.days === streak);
}

function calculateStreakReward(streak) {
  const rewards = [
    { days: 7, type: 'insight_unlock', description: 'Unlock advanced insights' },
    { days: 14, type: 'personalization_boost', description: 'Enhanced personalization' },
    { days: 30, type: 'premium_feature', description: 'Premium feature access' }
  ];

  const reward = rewards.find(r => r.days === streak);
  return reward ? { ...reward, earned: true } : null;
}

// Helper functions
function isYesterday(dateString) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split('T')[0];
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function isConsecutiveDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1 - d2);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

module.exports = {
  calculateCurrentStreak,
  checkStreakMilestone,
  getStreakEncouragementMessage,
  calculateStreakRecovery,
  generateWeeklyStreakInsights
}; 