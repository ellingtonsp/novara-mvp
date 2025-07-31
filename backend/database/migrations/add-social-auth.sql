-- Add social authentication support
-- This migration adds support for OAuth providers (Apple, Google, etc.)

-- Add auth provider columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create auth_providers table for multiple providers per user
CREATE TABLE IF NOT EXISTS user_auth_providers (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_auth_providers_user_id ON user_auth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_providers_provider ON user_auth_providers(provider);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_auth_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_auth_providers_updated_at 
BEFORE UPDATE ON user_auth_providers
FOR EACH ROW 
EXECUTE FUNCTION update_user_auth_providers_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_auth_providers IS 'Stores OAuth provider information for users. Supports multiple providers per user.';
COMMENT ON COLUMN user_auth_providers.provider IS 'OAuth provider name: apple, google, facebook, etc.';
COMMENT ON COLUMN user_auth_providers.provider_user_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN user_auth_providers.email_verified IS 'Whether the provider has verified this email address';