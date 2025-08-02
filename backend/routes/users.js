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

  // Auto-detect baseline completion based on required attributes
  const hasAllRequiredAttributes = 
    userData.nickname &&
    userData.primary_need &&
    userData.cycle_stage &&
    userData.confidence_meds >= 1 && userData.confidence_meds <= 10 &&
    userData.confidence_costs >= 1 && userData.confidence_costs <= 10 &&
    userData.confidence_overall >= 1 && userData.confidence_overall <= 10;

  // Set baseline_completed based on actual data presence (can be overridden by explicit flag)
  if (req.body.baseline_completed !== undefined) {
    userData.baseline_completed = req.body.baseline_completed === true;
  } else {
    userData.baseline_completed = hasAllRequiredAttributes;
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
 * GET /api/users/profile
 * Alias for /api/users/me (for API consistency)
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ 
    success: true,
    email: user.email,
    nickname: user.nickname,
    confidence_meds: user.confidence_meds,
    confidence_costs: user.confidence_costs,
    confidence_overall: user.confidence_overall,
    medication_status: user.medication_status,
    medication_status_updated: user.medication_status_updated,
    primary_need: user.primary_need,
    cycle_stage: user.cycle_stage,
    cycle_stage_updated: user.cycle_stage_updated,
    timezone: user.timezone,
    email_opt_in: user.email_opt_in,
    onboarding_path: user.onboarding_path,
    baseline_completed: user.baseline_completed,
    created_at: user.created_at
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

  // Auto-detect baseline completion after updates
  const mergedUser = { ...user, ...updates };
  const hasAllRequiredAttributes = 
    mergedUser.nickname &&
    mergedUser.primary_need &&
    mergedUser.cycle_stage &&
    mergedUser.confidence_meds >= 1 && mergedUser.confidence_meds <= 10 &&
    mergedUser.confidence_costs >= 1 && mergedUser.confidence_costs <= 10 &&
    mergedUser.confidence_overall >= 1 && mergedUser.confidence_overall <= 10;

  // Only set baseline_completed if not explicitly provided
  if (updates.baseline_completed === undefined && hasAllRequiredAttributes) {
    updates.baseline_completed = true;
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
  
  // Calculate PHQ-4 from enhanced check-ins that have the data
  const phq4Checkins = lastWeekCheckins.filter(c => {
    const fields = c.fields || c;
    return fields.phq4_feeling_nervous !== undefined && 
           fields.phq4_feeling_nervous !== null;
  });
  
  if (phq4Checkins.length > 0) {
    // Get the most recent PHQ-4 score
    const latestPHQ4 = phq4Checkins[0];
    const fields = latestPHQ4.fields || latestPHQ4;
    currentPHQ4Score = (fields.phq4_feeling_nervous || 0) + 
                      (fields.phq4_stop_worrying || 0) + 
                      (fields.phq4_little_interest || 0) + 
                      (fields.phq4_feeling_down || 0);
    
    // Calculate trend if we have multiple PHQ-4 assessments
    if (phq4Checkins.length > 1) {
      const previousPHQ4 = phq4Checkins[1];
      const prevFields = previousPHQ4.fields || previousPHQ4;
      const previousScore = (prevFields.phq4_feeling_nervous || 0) + 
                          (prevFields.phq4_stop_worrying || 0) + 
                          (prevFields.phq4_little_interest || 0) + 
                          (prevFields.phq4_feeling_down || 0);
      
      if (currentPHQ4Score < previousScore) phq4Trend = 'improving';
      else if (currentPHQ4Score > previousScore) phq4Trend = 'worsening';
      else phq4Trend = 'stable';
    }
  }
  
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
  
  // Determine if user is new (less than 3 days of data)
  const isNewUser = checkins.length < 3;
  const currentStreak = calculateStreak(checkins);
  
  // Risk factors - only apply to users with sufficient history
  if (!isNewUser) {
    if (medicationAdherenceRate < 80 && totalMedicationCheckIns >= 3) {
      riskFactors.push('Medication adherence below target');
    }
    if (currentPHQ4Score !== null && currentPHQ4Score >= 6) {
      riskFactors.push('Elevated stress/anxiety levels');
    }
    if (insightEngagementRate < 50) {
      riskFactors.push('Low engagement with tracking');
    }
    // Only show streak broken if they had a streak before
    if (currentStreak === 0 && checkins.length >= 7) {
      riskFactors.push('Check-in streak broken');
    }
  }
  
  // Protective factors - adjust thresholds for new users
  if (isNewUser) {
    // New user encouragements
    if (checkins.length > 0) {
      protectiveFactors.push('Great start on your tracking journey');
    }
    if (checkins.length >= 2) {
      protectiveFactors.push('Building consistency early');
    }
  } else {
    // Established user protective factors
    if (medicationAdherenceRate >= 90 && totalMedicationCheckIns >= 3) {
      protectiveFactors.push('Excellent medication adherence');
    }
    if (currentPHQ4Score !== null && currentPHQ4Score < 3) {
      protectiveFactors.push('Strong mental well-being');
    }
    if (currentStreak >= 3 && checkins.length >= 7) {
      protectiveFactors.push('Consistent daily check-ins');
    }
    if (currentStreak >= 7) {
      protectiveFactors.push(`${currentStreak}-day check-in streak`);
    }
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
      averageMoodScore,
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
    baseline_completed: true
  };

  await userService.update(user.id, updates);

  res.json({
    success: true,
    message: 'Onboarding completed successfully'
  });
}));

/**
 * PATCH /api/users/baseline
 * Update user baseline data from onboarding
 */
router.patch('/baseline', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const {
    nickname,
    confidence_meds,
    confidence_costs,
    confidence_overall,
    worst_moment,
    partner_support,
    top_priority,
    primary_concern,
    biggest_worry
  } = req.body;

  // Build updates object
  const updates = {
    baseline_completed: true,
    confidence_meds: confidence_meds,
    confidence_costs: confidence_costs,
    confidence_overall: confidence_overall
  };

  // Add optional fields if provided
  if (nickname) updates.nickname = nickname;
  if (worst_moment) updates.worst_moment = worst_moment;
  if (partner_support !== undefined) updates.partner_support = partner_support;
  if (top_priority) updates.top_priority = top_priority;
  if (primary_concern) updates.primary_concern = primary_concern;
  if (biggest_worry) updates.biggest_worry = biggest_worry;

  await userService.update(user.id, updates);

  res.json({
    success: true,
    message: 'Baseline data updated successfully',
    user: {
      id: user.id,
      email: user.email,
      nickname: updates.nickname || user.nickname,
      baseline_completed: true
    }
  });
}));

/**
 * PATCH /api/users/cycle-stage
 * Update user cycle stage
 */
router.patch('/cycle-stage', authenticateToken, asyncHandler(async (req, res) => {
  const { cycle_stage } = req.body;
  
  if (!cycle_stage) {
    throw new AppError('cycle_stage is required', 400);
  }

  // Validate cycle stage value
  const validStages = ['considering', 'ivf_prep', 'stimulation', 'retrieval', 'transfer', 'tww', 'pregnant', 'between_cycles'];
  if (!validStages.includes(cycle_stage)) {
    throw new AppError('Invalid cycle stage', 400);
  }

  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update user's cycle stage
  const updateData = {
    cycle_stage,
    cycle_stage_updated: new Date().toISOString()
  };

  await userService.update(user.id, updateData);
  console.log(`✅ Updated cycle stage for ${req.user.email}: ${cycle_stage}`);

  // Import helper function
  const { getMedicationStatusFromCycleStage } = require('../utils/question-generator');
  
  // Calculate derived medication status for response
  const derivedMedicationStatus = getMedicationStatusFromCycleStage(cycle_stage);

  res.json({
    success: true,
    message: 'Cycle stage updated successfully',
    cycle_stage,
    derived_medication_status: derivedMedicationStatus,
    cycle_stage_updated: updateData.cycle_stage_updated
  });
}));

/**
 * PATCH /api/users/medication-status
 * Update user medication status
 */
router.patch('/medication-status', authenticateToken, asyncHandler(async (req, res) => {
  const { medication_status } = req.body;
  
  if (!medication_status) {
    throw new AppError('medication_status is required', 400);
  }

  // Validate medication status value
  const validStatuses = ['taking', 'starting_soon', 'not_taking', 'between_cycles', 'finished_treatment', 'pregnancy_support'];
  if (!validStatuses.includes(medication_status)) {
    throw new AppError('Invalid medication status', 400);
  }

  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update user's medication status
  const updateData = {
    medication_status,
    medication_status_updated: new Date().toISOString()
  };

  await userService.update(user.id, updateData);
  console.log(`✅ Updated medication status for ${req.user.email}: ${medication_status}`);

  res.json({
    success: true,
    message: 'Medication status updated successfully',
    medication_status,
    medication_status_updated: updateData.medication_status_updated
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