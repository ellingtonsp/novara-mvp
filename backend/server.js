// Novara API Server
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Novara API'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;
