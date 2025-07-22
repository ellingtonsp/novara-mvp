// Novara API Server - Railway Fixed Version
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Trust Railway proxy
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Simple rate limiting for Railway
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userData = requestCounts.get(ip);
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    userData.count++;
  }
  
  if (userData.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Novara API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Novara API is running',
    health: '/api/health',
    docs: 'https://github.com/ellingtonsp/novara-mvp'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Novara API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;
