-- Novara PostgreSQL Schema
-- Version: 1.0.0
-- Description: Complete schema including all Enhanced form fields

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (for clean migration)
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with all current fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    
    -- Confidence metrics
    confidence_meds INTEGER DEFAULT 5 CHECK (confidence_meds BETWEEN 1 AND 10),
    confidence_costs INTEGER DEFAULT 5 CHECK (confidence_costs BETWEEN 1 AND 10),
    confidence_overall INTEGER DEFAULT 5 CHECK (confidence_overall BETWEEN 1 AND 10),
    
    -- User preferences and state
    primary_need VARCHAR(50),
    cycle_stage VARCHAR(50) CHECK (cycle_stage IN ('trying', 'stimulation', 'retrieval', 'transfer', 'waiting', 'between_cycles', 'pregnant', 'paused')),
    top_concern VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    email_opt_in BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Medication tracking
    medication_status VARCHAR(50),
    medication_status_updated TIMESTAMP,
    
    -- Onboarding
    baseline_completed BOOLEAN DEFAULT false,
    onboarding_path VARCHAR(20) CHECK (onboarding_path IN ('control', 'fast_lane')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily check-ins with ALL fields
CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Core fields (currently working)
    mood_today VARCHAR(20) NOT NULL CHECK (mood_today IN ('amazing', 'good', 'okay', 'tough', 'very tough', 'hopeful', 'anxious', 'neutral', 'grateful', 'tired', 'worried')),
    confidence_today INTEGER NOT NULL CHECK (confidence_today BETWEEN 1 AND 10),
    medication_taken VARCHAR(20) DEFAULT 'not tracked' CHECK (medication_taken IN ('yes', 'no', 'not tracked')),
    user_note TEXT,
    primary_concern_today VARCHAR(50),
    date_submitted DATE NOT NULL,
    
    -- Enhanced fields (currently lost in localStorage)
    anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
    side_effects TEXT[], -- Array of side effects
    missed_doses INTEGER CHECK (missed_doses >= 0),
    injection_confidence INTEGER CHECK (injection_confidence BETWEEN 1 AND 10),
    appointment_within_3_days BOOLEAN,
    appointment_anxiety INTEGER CHECK (appointment_anxiety BETWEEN 1 AND 10),
    coping_strategies_used TEXT[], -- Array of strategies
    partner_involved_today BOOLEAN,
    wish_knew_more_about TEXT[], -- Array of info needs
    
    -- PHQ-4 Assessment results
    phq4_score INTEGER CHECK (phq4_score BETWEEN 0 AND 12),
    phq4_anxiety INTEGER CHECK (phq4_anxiety BETWEEN 0 AND 6),
    phq4_depression INTEGER CHECK (phq4_depression BETWEEN 0 AND 6),
    
    -- Sentiment analysis (from CM-01)
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_confidence DECIMAL(3,2) CHECK (sentiment_confidence BETWEEN 0 AND 1),
    sentiment_scores JSONB,
    sentiment_processing_time INTEGER,
    
    -- Legacy fields for compatibility
    medication_confidence_today INTEGER CHECK (medication_confidence_today BETWEEN 1 AND 10),
    medication_concern_today TEXT,
    financial_stress_today INTEGER CHECK (financial_stress_today BETWEEN 1 AND 10),
    financial_concern_today TEXT,
    journey_readiness_today INTEGER CHECK (journey_readiness_today BETWEEN 1 AND 10),
    top_concern_today VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one check-in per user per day
    UNIQUE(user_id, date_submitted)
);

-- Insights table
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_title TEXT NOT NULL,
    insight_message TEXT NOT NULL,
    insight_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    context_data JSONB,
    action_label VARCHAR(100),
    action_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for quick lookups
    UNIQUE(user_id, insight_id)
);

-- Auth tokens for JWT management
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for token lookups
    INDEX idx_token_hash (token_hash)
);

-- Performance indexes
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date_submitted DESC);
CREATE INDEX idx_checkins_date ON daily_checkins(date_submitted DESC);
CREATE INDEX idx_checkins_mood ON daily_checkins(mood_today);
CREATE INDEX idx_checkins_medication ON daily_checkins(medication_taken) WHERE medication_taken != 'not tracked';
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_insights_user_date ON insights(user_id, date DESC);
CREATE INDEX idx_insights_type ON insights(insight_type);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON daily_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with preferences and state';
COMMENT ON TABLE daily_checkins IS 'Daily check-in data including mood, medication, and enhanced metrics';
COMMENT ON TABLE insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE auth_tokens IS 'JWT token management for authentication';

COMMENT ON COLUMN daily_checkins.side_effects IS 'Array of side effects like ["Headache", "Nausea", "Fatigue"]';
COMMENT ON COLUMN daily_checkins.coping_strategies_used IS 'Array of strategies like ["Exercise", "Meditation", "Talk to partner"]';
COMMENT ON COLUMN daily_checkins.wish_knew_more_about IS 'Array of info needs like ["Side effects", "Success rates", "Next steps"]';