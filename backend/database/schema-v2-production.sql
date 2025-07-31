-- Novara PostgreSQL Schema V2 for Production
-- Event-sourced architecture matching staging environment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    email_opt_in BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    cycle_stage VARCHAR(50),
    primary_need VARCHAR(50),
    onboarding_path VARCHAR(20),
    baseline_completed BOOLEAN DEFAULT false,
    confidence_meds INTEGER DEFAULT 5 CHECK (confidence_meds >= 1 AND confidence_meds <= 10),
    confidence_costs INTEGER DEFAULT 5 CHECK (confidence_costs >= 1 AND confidence_costs <= 10),
    confidence_overall INTEGER DEFAULT 5 CHECK (confidence_overall >= 1 AND confidence_overall <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health events table (core event sourcing)
CREATE TABLE IF NOT EXISTS health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    event_data JSONB NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'web_app',
    source_version VARCHAR(20),
    related_event_id UUID,
    correlation_id UUID
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    category VARCHAR(50),
    tags TEXT[],
    insight_data JSONB,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_events_user_date ON health_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_events_type ON health_events(event_type, event_subtype);
CREATE INDEX IF NOT EXISTS idx_health_events_data ON health_events USING gin(event_data);
CREATE INDEX IF NOT EXISTS idx_health_events_correlation ON health_events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(insight_type, user_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();