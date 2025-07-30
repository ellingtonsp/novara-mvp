/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rate-limit');
const { asyncHandler, AppError } = require('../middleware/error-handler');
const userService = require('../services/user-service');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log(`🔐 Login attempt for: ${sanitizedEmail}`);

  // Find user
  const user = await userService.findByEmail(sanitizedEmail);
  
  if (!user) {
    throw new AppError('User not found. Please sign up first.', 404);
  }

  console.log(`✅ User found: ${user.nickname || 'User'} (${user.id})`);

  // Generate JWT token
  const token = generateToken(user);

  // Log authentication
  await logger.logAuth({
    user_id: user.id,
    event_type: 'login',
    email: sanitizedEmail
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname || 'User',
      confidence_meds: user.confidence_meds,
      confidence_costs: user.confidence_costs,
      confidence_overall: user.confidence_overall,
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed,
      primary_need: user.primary_need,
      cycle_stage: user.cycle_stage,
      timezone: user.timezone || 'America/Los_Angeles'
    }
  });
}));

/**
 * POST /api/auth/signup
 * Create new user account
 */
router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  const { email, nickname, ...profileData } = req.body;
  
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log(`📝 Signup attempt for: ${sanitizedEmail}`);

  // Prepare user data
  const userData = {
    email: sanitizedEmail,
    nickname: nickname?.trim() || sanitizedEmail.split('@')[0],
    created_at: new Date().toISOString(),
    status: 'active',
    email_opt_in: true,
    ...profileData
  };

  // Create user
  const user = await userService.create(userData);
  console.log(`✅ User created successfully: ${user.id}`);

  // Generate JWT token
  const token = generateToken(user);

  // Log authentication
  await logger.logAuth({
    user_id: user.id,
    event_type: 'signup',
    email: sanitizedEmail
  });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      confidence_meds: user.confidence_meds || 5,
      confidence_costs: user.confidence_costs || 5,
      confidence_overall: user.confidence_overall || 5,
      onboarding_path: user.onboarding_path,
      baseline_completed: user.baseline_completed || false,
      primary_need: user.primary_need,
      cycle_stage: user.cycle_stage,
      timezone: user.timezone || 'America/Los_Angeles'
    },
    message: 'Account created successfully!'
  });
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // But we can log the event for analytics
  if (req.user) {
    await logger.logAuth({
      user_id: req.user.id,
      event_type: 'logout',
      email: req.user.email
    });
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

module.exports = router;