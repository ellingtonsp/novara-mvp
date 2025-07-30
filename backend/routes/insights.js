/**
 * Insights Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/error-handler');
const insightsService = require('../services/insights-service');
const userService = require('../services/user-service');

/**
 * GET /api/insights/daily
 * Get daily insights for the user
 */
router.get('/daily', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`🧠 Generating daily insights for user: ${req.user.email}`);

  // Find user
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  try {
    // Generate insights
    const insight = await insightsService.generateDailyInsights(user.id);
    
    console.log(`✅ Generated insight type: ${insight.type} for user: ${req.user.email}`);

    res.json({
      success: true,
      insight,
      analysis_data: {
        user_id: user.id,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.statusCode === 403) {
      // User hasn't completed onboarding
      return res.status(403).json({
        success: false,
        error: error.message,
        requires_onboarding_completion: true,
        user_status: {
          onboarding_path: user.onboarding_path,
          baseline_completed: user.baseline_completed,
          has_primary_need: !!user.primary_need,
          has_cycle_stage: !!user.cycle_stage
        }
      });
    }
    throw error;
  }
}));

/**
 * GET /api/insights
 * Get user's saved insights
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  
  console.log(`📚 Fetching insights for user: ${req.user.email}`);

  // Find user
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get insights
  const insights = await insightsService.getUserInsights(user.id, parseInt(limit));
  
  console.log(`✅ Retrieved ${insights.length} insights for user: ${req.user.email}`);

  res.json({
    success: true,
    insights,
    count: insights.length
  });
}));

/**
 * GET /api/insights/engagement
 * Get engagement insights (admin or analytics view)
 */
router.get('/engagement', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`📊 Generating engagement insights`);

  // For now, any authenticated user can view engagement insights
  // In production, add admin check here
  
  const engagementData = await insightsService.generateEngagementInsights();
  
  console.log(`✅ Generated engagement insights: ${engagementData.summary.activeUsers} active users`);

  res.json({
    success: true,
    engagement: engagementData
  });
}));

/**
 * POST /api/insights/generate
 * Force generation of new insight
 */
router.post('/generate', authenticateToken, asyncHandler(async (req, res) => {
  console.log(`🔄 Force generating insight for user: ${req.user.email}`);

  // Find user
  const user = await userService.findByEmail(req.user.email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate new insight
  const insight = await insightsService.generateDailyInsights(user.id);
  
  console.log(`✅ Force generated insight type: ${insight.type}`);

  res.json({
    success: true,
    insight,
    message: 'New insight generated successfully'
  });
}));

module.exports = router;