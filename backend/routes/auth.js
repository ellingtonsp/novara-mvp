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
const oauthService = require('../services/oauth-service');
const { isProviderConfigured } = require('../config/oauth');

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

/**
 * POST /api/auth/apple
 * Handle Apple Sign In
 */
router.post('/apple', authLimiter, asyncHandler(async (req, res) => {
  if (!isProviderConfigured('apple')) {
    throw new AppError('Apple Sign In is not configured', 501);
  }

  const { identityToken, authorizationCode, user } = req.body;
  
  if (!identityToken) {
    throw new AppError('Identity token is required', 400);
  }

  console.log(`🍎 Apple Sign In attempt`);

  // Handle Apple authentication
  const result = await oauthService.handleAppleAuth(
    identityToken,
    authorizationCode,
    user
  );

  // Generate JWT token
  const token = generateToken(result.user);

  // Check if user needs to complete profile
  const needsProfileCompletion = oauthService.needsProfileCompletion(result.user);

  console.log(`✅ Apple Sign In successful: ${result.user.email} (${result.isNewUser ? 'new' : 'existing'} user)`);

  // Log authentication
  await logger.logAuth({
    user_id: result.user.id,
    event_type: result.isNewUser ? 'signup_apple' : 'login_apple',
    email: result.user.email
  });

  res.json({
    success: true,
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      nickname: result.user.nickname,
      baseline_completed: result.user.baseline_completed,
      primary_need: result.user.primary_need,
      cycle_stage: result.user.cycle_stage,
      confidence_meds: result.user.confidence_meds,
      confidence_costs: result.user.confidence_costs,
      confidence_overall: result.user.confidence_overall,
      created_at: result.user.created_at
    },
    isNewUser: result.isNewUser,
    needsProfileCompletion
  });
}));

/**
 * POST /api/auth/google
 * Handle Google Sign In (placeholder)
 */
router.post('/google', authLimiter, asyncHandler(async (req, res) => {
  if (!isProviderConfigured('google')) {
    throw new AppError('Google Sign In is not configured', 501);
  }

  throw new AppError('Google Sign In coming soon', 501);
}));

/**
 * GET /api/auth/providers
 * Get available auth providers
 */
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = [];
  
  if (isProviderConfigured('apple')) {
    providers.push({
      id: 'apple',
      name: 'Apple',
      enabled: true
    });
  }
  
  if (isProviderConfigured('google')) {
    providers.push({
      id: 'google', 
      name: 'Google',
      enabled: true
    });
  }

  res.json({
    success: true,
    providers
  });
}));

module.exports = router;