/**
 * OAuth Configuration
 * Handles social authentication providers
 */

const config = require('./index');

// OAuth provider configurations
const oauthConfig = {
  apple: {
    clientID: process.env.APPLE_CLIENT_ID || 'com.novara.health',
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
    callbackURL: process.env.APPLE_CALLBACK_URL || `${config.server.baseUrl}/api/auth/apple/callback`,
    scope: ['name', 'email']
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${config.server.baseUrl}/api/auth/google/callback`,
    scope: ['profile', 'email']
  }
};

// Helper to check if a provider is configured
const isProviderConfigured = (provider) => {
  const config = oauthConfig[provider];
  if (!config) return false;
  
  switch (provider) {
    case 'apple':
      return !!(config.teamID && config.keyID && config.privateKey);
    case 'google':
      return !!(config.clientID && config.clientSecret);
    default:
      return false;
  }
};

module.exports = {
  oauthConfig,
  isProviderConfigured
};