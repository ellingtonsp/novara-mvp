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
 * Get user's recent check-ins
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 7 } = req.query;
  console.log(`📈 Fetching recent check-ins for user: ${req.user.email}`);

  // Find user
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
    checkins: checkins.map(record => ({
      id: record.id,
      mood_today: record.fields?.mood_today || record.mood_today,
      primary_concern_today: record.fields?.primary_concern_today || record.primary_concern_today,
      confidence_today: record.fields?.confidence_today || record.confidence_today,
      user_note: record.fields?.user_note || record.user_note,
      date_submitted: record.fields?.date_submitted || record.date_submitted,
      medication_taken: record.fields?.medication_taken || record.medication_taken,
      created_at: record.fields?.created_at || record.created_at
    })),
    count: checkins.length
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

module.exports = router;