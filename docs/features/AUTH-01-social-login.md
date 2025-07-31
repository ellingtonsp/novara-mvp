# AUTH-01: Social and Apple Login Implementation

## Feature Overview
Enable users to sign in using their existing social media accounts (Google, Facebook) and Apple ID, reducing friction in the onboarding process.

## Objectives
- Reduce sign-up friction by eliminating password creation
- Increase conversion rates with one-click authentication
- Maintain security while improving user experience
- Support account linking for existing users

## Supported Providers
1. **Apple Sign In** (Priority 1)
   - Required for iOS App Store
   - Works on web and mobile
   - Privacy-focused (Hide My Email feature)

2. **Google Sign In** (Priority 2)
   - Largest user base
   - Good for professional users
   - Easy implementation

3. **Facebook Login** (Priority 3)
   - Social connectivity
   - Optional based on user research

## Technical Requirements

### Backend
- OAuth 2.0 implementation
- JWT token generation for social logins
- Account linking logic for existing emails
- User profile data mapping
- PostgreSQL schema updates for auth providers

### Frontend
- Social login buttons on sign-in/sign-up pages
- Loading states during OAuth flow
- Error handling for cancelled/failed auth
- Account linking UI for existing users

### Security Considerations
- Validate OAuth tokens server-side
- Store provider IDs securely
- Handle email verification status from providers
- Implement rate limiting on auth endpoints

## Database Schema Changes
```sql
-- Add to user_profiles table
ALTER TABLE user_profiles ADD COLUMN auth_provider VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN provider_id VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Create auth_providers table for multiple providers per user
CREATE TABLE user_auth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'apple', 'google', 'facebook'
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);
```

## Implementation Steps

### Phase 1: Backend OAuth Setup
1. Install OAuth libraries (passport.js strategies)
2. Configure OAuth apps with providers
3. Implement OAuth callback endpoints
4. Add JWT generation for social logins

### Phase 2: Database Updates
1. Run schema migrations
2. Update user service to handle social auth
3. Implement account linking logic

### Phase 3: Frontend Integration
1. Add social login buttons to AuthModal
2. Implement OAuth redirect flows
3. Handle callback and token storage
4. Update user context for social auth

### Phase 4: Apple Sign In Special Handling
1. Configure Apple Developer account
2. Implement Sign in with Apple JS
3. Handle private relay emails
4. Test on iOS and web

### Phase 5: Testing & Polish
1. End-to-end testing of each provider
2. Error state handling
3. Account linking flows
4. Performance optimization

## Success Metrics
- Increase in sign-up conversion rate
- Reduction in password reset requests
- User satisfaction scores
- Time to complete sign-up

## Rollout Plan
1. Internal testing with team
2. Beta release to 10% of users
3. Monitor metrics and feedback
4. Full rollout if metrics are positive