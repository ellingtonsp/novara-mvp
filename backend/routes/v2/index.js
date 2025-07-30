/**
 * Schema V2 Routes
 * TODO: Complete implementation from server.js
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/error-handler');

/**
 * GET /api/v2/status
 * Get Schema V2 status
 */
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: {
      schema_v2_enabled: process.env.USE_SCHEMA_V2 === 'true',
      message: 'V2 endpoints to be implemented'
    }
  });
}));

// TODO: Implement remaining V2 endpoints from server.js

module.exports = router;