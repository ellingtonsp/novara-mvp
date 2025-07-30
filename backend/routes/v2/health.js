/**
 * V2 Health Routes
 * Handles health events and daily summaries for Schema V2
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/error-handler');
const userService = require('../../services/user-service');
const { getDatabaseAdapter } = require('../../config/database');

/**
 * GET /api/v2/health/daily-summary
 * Get daily health summary for a user
 */
router.get('/daily-summary', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const databaseAdapter = getDatabaseAdapter();
  if (!databaseAdapter.isPostgres || !process.env.USE_SCHEMA_V2) {
    throw new AppError('Schema V2 not available. Enable with USE_SCHEMA_V2=true', 503);
  }

  const date = req.query.date || null; // Today if not specified
  
  // For now, return a mock response since getDailySummary is not implemented
  // TODO: Implement getDailySummary in postgres-adapter
  const summary = {
    date: date || new Date().toISOString().split('T')[0],
    user_id: user.id,
    check_in_completed: false,
    mood_score: null,
    confidence_score: null,
    medication_taken: null,
    events: [],
    insights: []
  };

  res.json({
    success: true,
    summary,
    schema_version: 'v2'
  });
}));

/**
 * POST /api/v2/health/events
 * Create a new health event
 */
router.post('/events', authenticateToken, asyncHandler(async (req, res) => {
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const databaseAdapter = getDatabaseAdapter();
  if (!databaseAdapter.isPostgres || !process.env.USE_SCHEMA_V2) {
    throw new AppError('Schema V2 not available. Enable with USE_SCHEMA_V2=true', 503);
  }

  const { event_type, event_data, occurred_at } = req.body;
  
  if (!event_type) {
    throw new AppError('event_type is required', 400);
  }

  // For now, return a mock response since createHealthEvent is not implemented
  // TODO: Implement createHealthEvent in postgres-adapter
  const event = {
    id: Date.now().toString(),
    user_id: user.id,
    event_type,
    event_data: event_data || {},
    occurred_at: occurred_at || new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    event,
    schema_version: 'v2'
  });
}));

module.exports = router;