/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, generateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/error-handler');
const userService = require('../services/user-service');
const checkinService = require('../services/checkin-service');

/**
 * POST /api/users
 * Create new user (signup + auto-login)
 */
router.post('/', asyncHandler(async (req, res) => {
  // Validate and sanitize email
  const rawEmail = req.body.email;
  if (!rawEmail) {
    throw new AppError('Email is required', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitizedEmail = rawEmail.toString().trim().toLowerCase();
  
  if (!emailRegex.test(sanitizedEmail)) {
    throw new AppError('Invalid email format', 400);
  }

  if (sanitizedEmail.length > 254) { // RFC 5321 limit
    throw new AppError('Email address too long', 400);
  }

  // Validate and sanitize nickname
  const nickname = req.body.nickname ? req.body.nickname.toString().trim() : '';
  if (nickname.length > 50) {
    throw new AppError('Nickname too long (max 50 characters)', 400);
  }

  const userData = {
    email: sanitizedEmail,
    nickname: nickname,
    confidence_meds: req.body.confidence_meds || 5,
    confidence_costs: req.body.confidence_costs || 5,
    confidence_overall: req.body.confidence_overall || 5,
    timezone: req.body.timezone,
    email_opt_in: req.body.email_opt_in !== false, // Default true
    status: 'active'
  };

  // ON-01: Add A/B test tracking fields
  if (req.body.onboarding_path && (req.body.onboarding_path === 'control' || req.body.onboarding_path === 'test')) {
    userData.onboarding_path = req.body.onboarding_path;
  }
  if (req.body.baseline_completed !== undefined) {
    userData.baseline_completed = req.body.baseline_completed === true;
  }

  // Only add optional fields if they have values
  if (req.body.primary_need && req.body.primary_need !== '') {
    userData.primary_need = req.body.primary_need;
  }
  if (req.body.cycle_stage && req.body.cycle_stage !== '') {
    userData.cycle_stage = req.body.cycle_stage;
  }
  if (req.body.top_concern && req.body.top_concern !== '') {
    userData.top_concern = req.body.top_concern;
  }
  if (req.body.medication_status && req.body.medication_status !== '') {
    userData.medication_status = req.body.medication_status;
  }

  // Create user
  const newUser = await userService.create(userData);

  // Generate JWT token for immediate login
  const token = generateToken(newUser);

  res.status(201).json({ 
    success: true, 
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      confidence_meds: newUser.confidence_meds,
      confidence_costs: newUser.confidence_costs,
      confidence_overall: newUser.confidence_overall,
      primary_need: newUser.primary_need,
      cycle_stage: newUser.cycle_stage,
      top_concern: newUser.top_concern,
      timezone: newUser.timezone,
      email_opt_in: newUser.email_opt_in,
      baseline_completed: newUser.baseline_completed || false,
      onboarding_path: newUser.onboarding_path,
      created_at: newUser.created_at
    }
  });
}));

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
    : 0;

  // Count total medication check-ins (not just last week)
  const totalMedicationCheckIns = checkins.filter(c => {
    const status = c.fields?.medication_taken || c.medication_taken;
    return status && status !== 'not tracked';
  }).length;

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

  // PHQ-4 score - only available if user has completed PHQ-4 assessments
  // PHQ-4 is a specific questionnaire, not derived from mood scores
  let currentPHQ4Score = null;
  let phq4Trend = null;
  
  // TODO: Check for actual PHQ-4 assessment data
  // For now, we don't have PHQ-4 assessments implemented
  
  // Determine trends
  const medicationAdherenceTrend = 'stable'; // Would need historical data to calculate

  // Calculate engagement metrics
  const totalDays = Math.max(1, Math.floor((now - new Date(user.created_at)) / (1000 * 60 * 60 * 24)));
  const insightEngagementRate = Math.min(100, Math.round((checkins.length / totalDays) * 100));
  
  // Calculate completion probability based on engagement and adherence
  let cycleCompletionProbability = 50; // Base probability
  if (medicationAdherenceRate >= 90) cycleCompletionProbability += 15;
  else if (medicationAdherenceRate >= 80) cycleCompletionProbability += 10;
  else if (medicationAdherenceRate >= 70) cycleCompletionProbability += 5;
  
  // Only factor in PHQ-4 if available
  if (currentPHQ4Score !== null) {
    if (currentPHQ4Score < 3) cycleCompletionProbability += 15;
    else if (currentPHQ4Score < 6) cycleCompletionProbability += 10;
    else if (currentPHQ4Score < 9) cycleCompletionProbability += 5;
  }
  
  if (insightEngagementRate >= 70) cycleCompletionProbability += 10;
  else if (insightEngagementRate >= 50) cycleCompletionProbability += 5;
  
  cycleCompletionProbability = Math.min(95, cycleCompletionProbability);

  // Determine risk and protective factors
  const riskFactors = [];
  const protectiveFactors = [];
  
  if (medicationAdherenceRate < 80 && totalMedicationCheckIns >= 3) {
    riskFactors.push('Medication adherence below target');
  }
  if (currentPHQ4Score !== null && currentPHQ4Score >= 6) {
    riskFactors.push('Elevated stress/anxiety levels');
  }
  if (insightEngagementRate < 50) {
    riskFactors.push('Low engagement with tracking');
  }
  if (calculateStreak(checkins) === 0) {
    riskFactors.push('Check-in streak broken');
  }
  
  if (medicationAdherenceRate >= 90 && totalMedicationCheckIns >= 3) {
    protectiveFactors.push('Excellent medication adherence');
  }
  if (currentPHQ4Score !== null && currentPHQ4Score < 3) {
    protectiveFactors.push('Strong mental well-being');
  }
  if (insightEngagementRate >= 70) {
    protectiveFactors.push('Consistent daily check-ins');
  }
  if (calculateStreak(checkins) >= 7) {
    protectiveFactors.push(`${calculateStreak(checkins)}-day check-in streak`);
  }

  // Default factors if none identified
  if (riskFactors.length === 0) {
    riskFactors.push('Continue monitoring for patterns');
  }
  if (protectiveFactors.length === 0) {
    protectiveFactors.push('Building healthy tracking habits');
  }

  // Build comprehensive metrics response matching frontend expectations
  res.json({
    success: true,
    metrics: {
      // Adherence metrics
      medicationAdherenceRate: totalMedicationCheckIns >= 3 ? medicationAdherenceRate : 0,
      medicationAdherenceTrend,
      missedDosesLastWeek: medicationData.length - medicationTaken,
      totalMedicationCheckIns,
      
      // Mental health metrics
      currentPHQ4Score,
      phq4Trend,
      anxietyAverage: currentPHQ4Score !== null ? Math.round(currentPHQ4Score / 2) : null, // Only available with PHQ-4 data
      
      // Engagement metrics
      checkInStreak: calculateStreak(checkins),
      totalCheckIns: checkins.length,
      insightEngagementRate,
      checklistCompletionRate: 70, // Placeholder - would need checklist data
      
      // Support utilization
      copingStrategiesUsed: ['Daily tracking', 'Medication reminders', 'Mood monitoring'],
      mostEffectiveStrategy: 'Daily tracking',
      partnerInvolvementRate: 0, // Placeholder - would need partner data
      
      // Predictive metrics
      cycleCompletionProbability,
      riskFactors,
      protectiveFactors
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