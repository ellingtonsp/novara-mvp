/**
 * OAuth Service
 * Handles social authentication
 */

const appleSignin = require('apple-signin-auth');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/error-handler');
const userService = require('./user-service');
const { oauthConfig } = require('../config/oauth');
const config = require('../config');

class OAuthService {
  /**
   * Verify Apple ID token and create/login user
   */
  async handleAppleAuth(idToken, authorizationCode, user) {
    try {
      // Verify the identity token with Apple
      const appleIdTokenClaims = await appleSignin.verifyIdToken(idToken, {
        audience: oauthConfig.apple.clientID,
        ignoreExpiration: false
      });

      // Extract user info
      const email = appleIdTokenClaims.email;
      const appleUserId = appleIdTokenClaims.sub;
      
      // Parse user data if provided (first sign in)
      let firstName = '';
      let lastName = '';
      if (user) {
        try {
          const userData = typeof user === 'string' ? JSON.parse(user) : user;
          firstName = userData.name?.firstName || '';
          lastName = userData.name?.lastName || '';
        } catch (e) {
          console.log('Could not parse Apple user data:', e);
        }
      }

      // Check if user exists
      let existingUser = await userService.findByEmail(email);
      
      if (existingUser) {
        // User exists - check if they used Apple before
        const authProviders = await this.getUserAuthProviders(existingUser.id);
        const hasAppleAuth = authProviders.some(p => p.provider === 'apple');
        
        if (!hasAppleAuth) {
          // Link Apple to existing account
          await this.linkAuthProvider(existingUser.id, {
            provider: 'apple',
            provider_user_id: appleUserId,
            email: email,
            email_verified: true,
            first_name: firstName,
            last_name: lastName
          });
        }
        
        return {
          user: existingUser,
          isNewUser: false
        };
      } else {
        // Create new user with Apple auth
        const nickname = firstName || email.split('@')[0];
        
        const newUser = await userService.create({
          email: email,
          nickname: nickname,
          status: 'active',
          email_opt_in: true,
          // Don't set these - let user complete profile
          baseline_completed: false,
          // Set default confidence scores
          confidence_meds: 5,
          confidence_costs: 5,
          confidence_overall: 5
        });

        // Link Apple auth
        await this.linkAuthProvider(newUser.id, {
          provider: 'apple',
          provider_user_id: appleUserId,
          email: email,
          email_verified: true,
          first_name: firstName,
          last_name: lastName
        });

        return {
          user: newUser,
          isNewUser: true
        };
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      throw new AppError('Failed to authenticate with Apple', 401);
    }
  }

  /**
   * Handle Google OAuth (placeholder for future implementation)
   */
  async handleGoogleAuth(profile) {
    // Similar logic to Apple auth
    throw new AppError('Google auth not yet implemented', 501);
  }

  /**
   * Get user's linked auth providers
   */
  async getUserAuthProviders(userId) {
    const db = require('../config/database').getDatabaseAdapter();
    
    if (db.isPostgres || db.isUsingLocalDatabase()) {
      const result = await db.localDb.query(
        'SELECT * FROM user_auth_providers WHERE user_id = $1',
        [userId]
      );
      return result.rows || [];
    }
    
    // For Airtable, return empty array (social auth requires PostgreSQL)
    return [];
  }

  /**
   * Link an auth provider to a user
   */
  async linkAuthProvider(userId, providerData) {
    const db = require('../config/database').getDatabaseAdapter();
    
    if (!db.isPostgres && !db.isUsingLocalDatabase()) {
      throw new AppError('Social authentication requires PostgreSQL', 500);
    }

    const { 
      provider, 
      provider_user_id, 
      email, 
      email_verified,
      first_name,
      last_name,
      profile_image_url 
    } = providerData;

    try {
      await db.localDb.query(
        `INSERT INTO user_auth_providers 
         (user_id, provider, provider_user_id, email, email_verified, 
          first_name, last_name, profile_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (provider, provider_user_id) 
         DO UPDATE SET 
           email = EXCLUDED.email,
           email_verified = EXCLUDED.email_verified,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           profile_image_url = EXCLUDED.profile_image_url,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, provider, provider_user_id, email, email_verified, 
         first_name, last_name, profile_image_url]
      );
    } catch (error) {
      console.error('Error linking auth provider:', error);
      throw new AppError('Failed to link authentication provider', 500);
    }
  }

  /**
   * Check if user needs profile completion
   */
  needsProfileCompletion(user) {
    return !user.baseline_completed || 
           !user.primary_need || 
           !user.cycle_stage;
  }
}

// Export singleton instance
const oauthService = new OAuthService();
module.exports = oauthService;