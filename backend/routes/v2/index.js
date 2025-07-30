/**
 * Schema V2 Routes
 */

const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');

/**
 * Mount V2 sub-routes
 */
router.use('/health', healthRoutes);

/**
 * GET /api/v2/status
 * Get Schema V2 status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: {
      schema_v2_enabled: process.env.USE_SCHEMA_V2 === 'true',
      endpoints_available: [
        '/api/v2/health/daily-summary',
        '/api/v2/health/events'
      ]
    }
  });
});

module.exports = router;