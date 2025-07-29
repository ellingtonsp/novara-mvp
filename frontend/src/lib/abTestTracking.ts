// A/B Test Tracking for Check-in Preferences
// Tracks user retention and engagement based on check-in frequency choice

import { track } from './analytics';

interface CheckinPreferenceMetrics {
  userId: string;
  preference: 'quick_daily' | 'comprehensive_daily';
  retentionDays: number;
  totalCheckins: number;
  streakDays: number;
  comprehensiveCheckins: number;
  quickCheckins: number;
  adherenceRate: number;
  outcomeMetricsImprovement: number;
}

export function trackCheckinPreferenceOutcome(metrics: CheckinPreferenceMetrics) {
  // Track overall metrics
  track('checkin_preference_outcome', {
    ...metrics,
    retention_category: metrics.retentionDays >= 30 ? 'high' : 
                       metrics.retentionDays >= 14 ? 'medium' : 'low',
    engagement_level: metrics.totalCheckins / metrics.retentionDays > 0.8 ? 'high' :
                      metrics.totalCheckins / metrics.retentionDays > 0.5 ? 'medium' : 'low'
  });
}

export function trackWeeklyReminderResponse(response: 'accepted' | 'dismissed' | 'ignored') {
  track('weekly_reminder_response', {
    user_id: localStorage.getItem('user_id') || '',
    response,
    days_since_last_comprehensive: getDaysSinceLastComprehensive(),
    current_preference: getCurrentPreference(),
    timestamp: new Date().toISOString()
  });
}

export function trackCheckinTypeConversion(from: string, to: string, trigger: string) {
  track('checkin_type_conversion', {
    user_id: localStorage.getItem('user_id') || '',
    from_type: from,
    to_type: to,
    trigger, // 'user_initiated', 'weekly_reminder', 'preference_toggle'
    checkins_before_conversion: getCheckinsCount(),
    timestamp: new Date().toISOString()
  });
}

// Helper functions
function getDaysSinceLastComprehensive(): number {
  const email = localStorage.getItem('user_email'); // Assume we store this
  const lastComprehensive = localStorage.getItem(`last_comprehensive_${email}`);
  if (!lastComprehensive) return -1;
  
  return Math.floor((Date.now() - new Date(lastComprehensive).getTime()) / (1000 * 60 * 60 * 24));
}

function getCurrentPreference(): string {
  const email = localStorage.getItem('user_email');
  const savedPref = localStorage.getItem(`checkin_preference_${email}`);
  if (!savedPref) return 'unknown';
  
  try {
    const pref = JSON.parse(savedPref);
    return pref.type;
  } catch {
    return 'unknown';
  }
}

function getCheckinsCount(): number {
  const email = localStorage.getItem('user_email');
  return parseInt(localStorage.getItem(`checkin_count_${email}`) || '0');
}

// A/B Test Cohort Assignment
export function assignCheckinPreferenceCohort(): 'control' | 'treatment' {
  // Use consistent hashing to ensure same user always gets same cohort
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // 50/50 split
  const cohort = Math.abs(hash) % 2 === 0 ? 'control' : 'treatment';
  
  // Track cohort assignment
  track('checkin_preference_cohort_assigned', {
    user_id: userId,
    cohort,
    timestamp: new Date().toISOString()
  });
  
  return cohort;
}

// Calculate retention metrics
export async function calculateRetentionMetrics() {
  const email = localStorage.getItem('user_email');
  const firstCheckinDate = localStorage.getItem(`first_checkin_${email}`);
  
  if (!firstCheckinDate) return null;
  
  const daysSinceFirst = Math.floor((Date.now() - new Date(firstCheckinDate).getTime()) / (1000 * 60 * 60 * 24));
  const totalCheckins = parseInt(localStorage.getItem(`checkin_count_${email}`) || '0');
  const currentStreak = parseInt(localStorage.getItem(`checkin_streak_${email}`) || '0');
  
  return {
    retentionDays: daysSinceFirst,
    totalCheckins,
    currentStreak,
    averageCheckinsPerWeek: (totalCheckins / daysSinceFirst) * 7,
    isRetained: daysSinceFirst >= 7 && totalCheckins >= 5
  };
}