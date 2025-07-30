/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Verify JWT token and attach user to request
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      nickname: user.nickname 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

module.exports = {
  authenticateToken,
  generateToken
};