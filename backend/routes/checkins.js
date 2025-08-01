/**
 * Check-in Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/error-handler');
const checkinService = require('../services/checkin-service');
const userService = require('../services/user-service');
const logger = require('../utils/logger');
const { generatePersonalizedCheckInQuestions } = require('../utils/question-generator');

/**
 * POST /api/checkins
 * Submit daily check-in
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  console.log('📝 Daily check-in submission received:', req.body);
  
  const { 
    mood_today, 
    primary_concern_today, 
    confidence_today, 
    user_note,
    date_submitted,
    sentiment_analysis,
    medication_taken,
    ...additionalFormFields
  } = req.body;

  // Validation
  if (!mood_today || !confidence_today) {
    throw new AppError('Missing required fields: mood_today and confidence_today are required', 400);
  }

  if (confidence_today < 1 || confidence_today > 10) {
    throw new AppError('confidence_today must be between 1 and 10', 400);
  }

  // Find user
  console.log('🔍 JWT user:', req.user);
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  console.log('✅ Found user record:', user.id);

  // Prepare check-in data
  const checkinData = {
    user_id: user.id,
    mood_today,
    confidence_today: parseInt(confidence_today),
    date_submitted: date_submitted || new Date().toISOString().split('T')[0],
    primary_concern_today,
    user_note,
    medication_taken,
    ...additionalFormFields
  };

  // Check for duplicate
  const existingCheckin = await checkinService.findByUserAndDate(
    user.id, 
    checkinData.date_submitted
  );

  if (existingCheckin) {
    console.log('⚠️ Check-in already exists for today');
    return res.status(409).json({
      success: false,
      error: 'You have already submitted a check-in for today. Please try again tomorrow.',
      existing_checkin: {
        id: existingCheckin.id,
        mood_today: existingCheckin.mood_today,
        confidence_today: existingCheckin.confidence_today,
        date_submitted: existingCheckin.date_submitted
      }
    });
  }

  // Create check-in
  const result = await checkinService.create(checkinData);
  console.log('✅ Daily check-in saved successfully:', result.id);

  // Prepare response
  const responseData = {
    success: true,
    checkin: {
      id: result.id,
      ...result.fields || result,
      mood_today: result.mood_today || checkinData.mood_today,
      confidence_today: result.confidence_today || checkinData.confidence_today,
      date_submitted: result.date_submitted || checkinData.date_submitted,
      medication_taken: result.medication_taken || checkinData.medication_taken,
      created_at: result.created_at || new Date().toISOString()
    },
    message: sentiment_analysis?.sentiment === 'positive'
      ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
      : 'Daily check-in completed successfully! 🌟'
  };

  if (sentiment_analysis) {
    responseData.sentiment_analysis = {
      sentiment: sentiment_analysis.sentiment,
      confidence: sentiment_analysis.confidence,
      celebration_triggered: sentiment_analysis.sentiment === 'positive'
    };
  }

  res.status(201).json(responseData);
}));

/**
 * GET /api/checkins
 * Get current user's check-ins
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  console.log(`📈 Fetching recent check-ins for user: ${req.user.email}`);

  // Get current user
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get check-ins
  const result = await checkinService.getUserCheckins(user.id, parseInt(limit));
  const checkins = result.records || [];
  
  console.log(`✅ Retrieved ${checkins.length} check-ins for user: ${req.user.email}`);

  res.json({
    success: true,
    records: checkins,
    count: checkins.length
  });
}));

/**
 * GET /api/checkins/last-values
 * Get last check-in values for form defaults
 */
router.get('/last-values', authenticateToken, asyncHandler(async (req, res) => {
  console.log('📊 Fetching last check-in values for user:', req.user.email);

  // Find user record
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get the most recent check-in for this user
  const result = await checkinService.getUserCheckins(user.id, 1);
  const userRecords = result.records || [];

  if (userRecords.length === 0) {
    console.log('No previous check-ins found for user:', req.user.email);
    return res.json({
      success: true,
      hasValues: false,
      message: 'No previous check-ins found'
    });
  }

  // Extract last values from the most recent check-in
  const lastCheckin = userRecords[0];
  const fields = lastCheckin.fields || lastCheckin;

  // Build response with last values
  const lastValues = {
    mood_today: fields.mood_today || null,
    confidence_today: fields.confidence_today || null,
    medication_taken: fields.medication_taken || null,
    primary_concern_today: fields.primary_concern_today || null,
    user_note: fields.user_note || null,
    journey_reflection_today: fields.journey_reflection_today || null,
    
    // Include dimension-specific values if present
    medication_confidence_today: fields.medication_confidence_today || null,
    medication_readiness_today: fields.medication_readiness_today || null,
    financial_confidence_today: fields.financial_confidence_today || null,
    journey_confidence_today: fields.journey_confidence_today || null,
    
    // Include any other tracked fields
    symptom_tracking: fields.symptom_tracking || null,
    cycle_day: fields.cycle_day || null,
    
    // Metadata
    last_checkin_date: fields.date_submitted || lastCheckin.date_submitted,
    days_since_last_checkin: Math.floor(
      (Date.now() - new Date(fields.date_submitted || lastCheckin.date_submitted).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
  };

  console.log('✅ Found last check-in values from:', lastValues.last_checkin_date);

  res.json({
    success: true,
    hasValues: true,
    lastValues,
    message: 'Last check-in values retrieved successfully'
  });
}));

/**
 * GET /api/checkins/questions
 * Get personalized check-in questions
 */
router.get('/questions', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`🎯 Generating personalized questions for user: ${req.user.email}`);

  // Find user to get their onboarding data
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate personalized questions based on their concerns
  const questions = generatePersonalizedCheckInQuestions(user);
  
  console.log(`✅ Generated ${questions.length} personalized questions for ${req.user.email}`);
  console.log('📝 Question contexts:', questions.map(q => q.context || 'baseline').join(', '));

  res.json({
    success: true,
    questions,
    metadata: {
      total_questions: questions.length,
      required_questions: questions.filter(q => q.required).length,
      dimension_focus: questions.find(q => q.context && q.context.includes('focus'))?.context || 'baseline'
    }
  });
}));

/**
 * GET /api/checkins/user/:userId
 * Get check-ins for specific user (admin or self only)
 */
router.get('/user/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 30 } = req.query;

  // Verify user can access this data
  const requestingUser = await userService.findByEmail(req.user.email);
  if (!requestingUser || (requestingUser.id !== userId && !requestingUser.is_admin)) {
    throw new AppError('Unauthorized to view this user\'s check-ins', 403);
  }

  // Get check-ins
  const result = await checkinService.getUserCheckins(userId, parseInt(limit));
  const checkins = result.records || [];

  res.json({
    success: true,
    records: checkins,
    count: checkins.length
  });
}));

/**
 * GET /api/checkins/:checkinId
 * Get specific check-in
 */
router.get('/:checkinId', authenticateToken, asyncHandler(async (req, res) => {
  const { checkinId } = req.params;

  // Get check-in
  const checkin = await checkinService.findById(checkinId);
  if (!checkin) {
    throw new AppError('Check-in not found', 404);
  }

  // Verify user owns this check-in
  const user = await userService.findByEmail(req.user.email);
  if (!user || checkin.user_id !== user.id) {
    throw new AppError('Unauthorized to view this check-in', 403);
  }

  res.json({
    success: true,
    checkin
  });
}));

/**
 * PUT /api/checkins/:checkinId
 * Update specific check-in
 */
router.put('/:checkinId', authenticateToken, asyncHandler(async (req, res) => {
  const { checkinId } = req.params;
  const updateData = req.body;

  // Get check-in
  const checkin = await checkinService.findById(checkinId);
  if (!checkin) {
    throw new AppError('Check-in not found', 404);
  }

  // Verify user owns this check-in
  const user = await userService.findByEmail(req.user.email);
  if (!user || checkin.user_id !== user.id) {
    throw new AppError('Unauthorized to update this check-in', 403);
  }

  // Update check-in
  const result = await checkinService.update(checkinId, {
    ...updateData,
    user_id: user.id
  });

  console.log('✅ Check-in updated successfully:', checkinId);

  res.json({
    success: true,
    checkin: result,
    message: 'Check-in updated successfully! 🌟'
  });
}));

/**
 * DELETE /api/checkins/:checkinId
 * Delete specific check-in (for testing/admin)
 */
router.delete('/:checkinId', authenticateToken, asyncHandler(async (req, res) => {
  const { checkinId } = req.params;

  // Get check-in
  const checkin = await checkinService.findById(checkinId);
  if (!checkin) {
    throw new AppError('Check-in not found', 404);
  }

  // Verify user owns this check-in
  const user = await userService.findByEmail(req.user.email);
  if (!user || checkin.user_id !== user.id) {
    throw new AppError('Unauthorized to delete this check-in', 403);
  }

  // Delete check-in
  await checkinService.delete(checkinId);

  res.json({
    success: true,
    message: 'Check-in deleted successfully'
  });
}));

/**
 * GET /api/checkins/last-values
 * Get last check-in values for form defaults
 */
router.get('/last-values', authenticateToken, asyncHandler(async (req, res) => {
  console.log('📊 Fetching last check-in values for user:', req.user.email);

  // Find user record
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get the most recent check-in for this user
  const result = await checkinService.getUserCheckins(user.id, 1);
  const userRecords = result.records || [];

  if (userRecords.length === 0) {
    console.log('No previous check-ins found for user:', req.user.email);
    return res.json({
      success: true,
      hasValues: false,
      message: 'No previous check-ins found'
    });
  }

  // Extract last values from the most recent check-in
  const lastCheckin = userRecords[0];
  const fields = lastCheckin.fields || lastCheckin;

  // Build response with last values
  const lastValues = {
    mood_today: fields.mood_today || null,
    confidence_today: fields.confidence_today || null,
    medication_taken: fields.medication_taken || null,
    primary_concern_today: fields.primary_concern_today || null,
    user_note: fields.user_note || null,
    journey_reflection_today: fields.journey_reflection_today || null,
    
    // Include dimension-specific values if present
    medication_confidence_today: fields.medication_confidence_today || null,
    medication_readiness_today: fields.medication_readiness_today || null,
    financial_confidence_today: fields.financial_confidence_today || null,
    journey_confidence_today: fields.journey_confidence_today || null,
    
    // Include any other tracked fields
    symptom_tracking: fields.symptom_tracking || null,
    cycle_day: fields.cycle_day || null,
    
    // Metadata
    last_checkin_date: fields.date_submitted || lastCheckin.date_submitted,
    days_since_last_checkin: Math.floor(
      (Date.now() - new Date(fields.date_submitted || lastCheckin.date_submitted).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
  };

  console.log('✅ Found last check-in values from:', lastValues.last_checkin_date);

  res.json({
    success: true,
    hasValues: true,
    lastValues,
    message: 'Last check-in values retrieved successfully'
  });
}));

/**
 * GET /api/checkins/questions
 * Get personalized check-in questions
 */
router.get('/questions', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`🎯 Generating personalized questions for user: ${req.user.email}`);

  // Find user to get their onboarding data
  const user = await userService.findByEmail(req.user.email);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate personalized questions based on their concerns
  const questions = generatePersonalizedCheckInQuestions(user);
  
  console.log(`✅ Generated ${questions.length} personalized questions for ${req.user.email}`);
  console.log('📝 Question contexts:', questions.map(q => q.context || 'baseline').join(', '));

  res.json({
    success: true,
    questions,
    metadata: {
      total_questions: questions.length,
      required_questions: questions.filter(q => q.required).length,
      dimension_focus: questions.find(q => q.context && q.context.includes('focus'))?.context || 'baseline'
    }
  });
}));

module.exports = router;