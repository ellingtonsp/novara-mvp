/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/error-handler');
const userService = require('../services/user-service');
const checkinService = require('../services/checkin-service');

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      status: user.status,
      timezone: user.timezone,
      confidence_meds: user.confidence_meds,
      confidence_costs: user.confidence_costs,
      confidence_overall: user.confidence_overall,
      primary_need: user.primary_need,
      cycle_stage: user.cycle_stage,
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed,
      email_opt_in: user.email_opt_in,
      created_at: user.created_at
    }
  });
}));

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Fields that can be updated
  const allowedUpdates = [
    'nickname', 'timezone', 'confidence_meds', 'confidence_costs',
    'confidence_overall', 'primary_need', 'cycle_stage', 'email_opt_in',
    'baseline_completed', 'medication_status', 'top_concern'
  ];

  const updates = {};
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedUser = await userService.update(user.id, updates);

  res.json({
    success: true,
    user: updatedUser,
    message: 'Profile updated successfully'
  });
}));

/**
 * GET /api/users/metrics
 * Get user metrics and analytics
 */
router.get('/metrics', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`📊 Fetching metrics for user: ${req.user.email}`);

  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get check-ins
  const checkinsResult = await checkinService.getUserCheckins(user.id, 100);
  const checkins = checkinsResult.records || [];
  
  console.log(`📊 Found ${checkins.length} check-ins for metrics`);

  // Calculate metrics
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter check-ins by time period
  const lastWeekCheckins = checkins.filter(c => {
    const date = new Date(c.fields?.date_submitted || c.date_submitted);
    return date >= lastWeek;
  });
  
  const lastMonthCheckins = checkins.filter(c => {
    const date = new Date(c.fields?.date_submitted || c.date_submitted);
    return date >= lastMonth;
  });

  // Medication adherence
  const medicationData = lastWeekCheckins.filter(c => {
    const status = c.fields?.medication_taken || c.medication_taken;
    return status && status !== 'not tracked';
  });
  
  const medicationTaken = medicationData.filter(c => {
    const status = c.fields?.medication_taken || c.medication_taken;
    return status === 'yes';
  }).length;
  
  const medicationAdherenceRate = medicationData.length > 0 
    ? Math.round((medicationTaken / medicationData.length) * 100) 
    : null;

  // Mood metrics
  const moodMap = {
    'devastated': 1, 'heartbroken': 2, 'defeated': 3, 'struggling': 4,
    'discouraged': 5, 'uncertain': 6, 'hopeful': 7, 'confident': 8,
    'optimistic': 9, 'empowered': 10
  };
  
  const moodScores = lastWeekCheckins.map(c => {
    const mood = c.fields?.mood_today || c.mood_today;
    return moodMap[mood] || 5;
  });
  
  const averageMoodScore = moodScores.length > 0
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : 5;

  res.json({
    success: true,
    metrics: {
      total_checkins: checkins.length,
      last_week_checkins: lastWeekCheckins.length,
      last_month_checkins: lastMonthCheckins.length,
      medication_adherence_rate: medicationAdherenceRate,
      medication_tracking_enabled: user.medication_status !== 'not_tracked',
      average_mood_score: Math.round(averageMoodScore * 10) / 10,
      current_streak: calculateStreak(checkins),
      user_since: user.created_at
    }
  });
}));

/**
 * POST /api/users/complete-onboarding
 * Mark onboarding as complete
 */
router.post('/complete-onboarding', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updates = {
    baseline_completed: true,
    baseline_submission_date: new Date().toISOString()
  };

  await userService.update(user.id, updates);

  res.json({
    success: true,
    message: 'Onboarding completed successfully'
  });
}));

/**
 * Helper function to calculate check-in streak
 */
function calculateStreak(checkins) {
  if (checkins.length === 0) return 0;
  
  // Sort by date descending
  const sorted = checkins.sort((a, b) => {
    const dateA = new Date(a.fields?.date_submitted || a.date_submitted);
    const dateB = new Date(b.fields?.date_submitted || b.date_submitted);
    return dateB - dateA;
  });
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const checkin of sorted) {
    const checkinDate = new Date(checkin.fields?.date_submitted || checkin.date_submitted);
    checkinDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

module.exports = router;