-- Novara PostgreSQL Schema V2
-- Event-sourced, domain-separated, scalable architecture
-- Designed for Option B with clear paths to Option C

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- CORE DOMAIN: Users & Authentication
-- =====================================================

-- Users table (simplified, focused)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (separated from auth concerns)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    email_opt_in BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Fertility journey context
    cycle_stage VARCHAR(50),
    primary_need VARCHAR(50),
    onboarding_path VARCHAR(20),
    baseline_completed BOOLEAN DEFAULT false,
    
    -- Preference scores (consider moving to separate table in Option C)
    confidence_meds INTEGER DEFAULT 5 CHECK (confidence_meds BETWEEN 1 AND 10),
    confidence_costs INTEGER DEFAULT 5 CHECK (confidence_costs BETWEEN 1 AND 10),
    confidence_overall INTEGER DEFAULT 5 CHECK (confidence_overall BETWEEN 1 AND 10),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- HEALTH EVENTS: Core event sourcing pattern
-- =====================================================

-- Base health events table (immutable, append-only)
CREATE TABLE health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'mood', 'medication', 'symptom', 'vital', etc.
    event_subtype VARCHAR(50), -- 'daily_mood', 'injection', 'side_effect', etc.
    
    -- Event data stored as JSONB for flexibility
    event_data JSONB NOT NULL,
    
    -- Temporal data
    occurred_at TIMESTAMP NOT NULL, -- When it actually happened
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When we recorded it
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'web_app', -- web_app, mobile_app, api, import
    source_version VARCHAR(20),
    
    -- Optional references
    related_event_id UUID, -- For corrections, updates
    correlation_id UUID, -- For grouping related events
    
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'mood', 'medication', 'symptom', 'assessment', 
        'vital', 'treatment', 'appointment', 'note'
    ))
);

-- Indexes for common queries
CREATE INDEX idx_health_events_user_date ON health_events(user_id, occurred_at DESC);
CREATE INDEX idx_health_events_type ON health_events(event_type, event_subtype);
CREATE INDEX idx_health_events_correlation ON health_events(correlation_id) WHERE correlation_id IS NOT NULL;

-- GIN index for JSONB queries (Option C: add more sophisticated indexes)
CREATE INDEX idx_health_events_data ON health_events USING GIN (event_data);

-- =====================================================
-- ASSESSMENTS: Structured mental health data
-- =====================================================

-- Assessment definitions (PHQ-4, GAD-7, custom)
CREATE TABLE assessment_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(10) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'standard', 'custom'
    questions JSONB NOT NULL, -- Array of question definitions
    scoring_logic JSONB NOT NULL, -- How to calculate scores
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(name, version)
);

-- Assessment responses
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessment_definitions(id),
    health_event_id UUID REFERENCES health_events(id), -- Link to event system
    
    responses JSONB NOT NULL, -- Question ID -> Answer mapping
    scores JSONB NOT NULL, -- Calculated scores
    
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MEDICATIONS: Dedicated medication tracking
-- =====================================================

-- User medications (current regimen)
CREATE TABLE user_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    medication_type VARCHAR(50), -- 'injection', 'oral', 'patch', etc.
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication adherence (linked to health events)
CREATE TABLE medication_adherence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES user_medications(id),
    health_event_id UUID NOT NULL REFERENCES health_events(id),
    
    scheduled_time TIMESTAMP,
    taken_time TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'partial')),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSIGHTS & RECOMMENDATIONS
-- =====================================================

-- AI-generated insights
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_category VARCHAR(50), -- 'trend', 'achievement', 'risk', 'recommendation'
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Structured data for the insight
    insight_data JSONB,
    
    -- What triggered this insight
    trigger_type VARCHAR(50), -- 'scheduled', 'event_based', 'ml_model'
    trigger_data JSONB,
    
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track user interactions with insights
CREATE TABLE insight_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL, -- 'viewed', 'dismissed', 'acted_on', 'shared'
    action_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, insight_id, action)
);

-- =====================================================
-- ANALYTICS VIEWS (Materialized for performance)
-- =====================================================

-- Daily aggregated metrics per user
CREATE MATERIALIZED VIEW user_daily_metrics AS
SELECT 
    user_id,
    DATE(occurred_at) as date,
    
    -- Mood metrics
    (SELECT event_data->>'mood' 
     FROM health_events he2 
     WHERE he2.user_id = he.user_id 
     AND DATE(he2.occurred_at) = DATE(he.occurred_at)
     AND he2.event_type = 'mood'
     ORDER BY he2.occurred_at DESC LIMIT 1) as latest_mood,
    
    -- Medication adherence
    COUNT(DISTINCT CASE 
        WHEN event_type = 'medication' AND event_data->>'status' = 'taken' 
        THEN id 
    END) as medications_taken,
    
    COUNT(DISTINCT CASE 
        WHEN event_type = 'medication' AND event_data->>'status' = 'missed' 
        THEN id 
    END) as medications_missed,
    
    -- Symptom count
    COUNT(DISTINCT CASE 
        WHEN event_type = 'symptom' 
        THEN id 
    END) as symptoms_reported,
    
    MAX(updated_at) as last_updated
FROM health_events he
GROUP BY user_id, DATE(occurred_at);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_user_daily_metrics ON user_daily_metrics(user_id, date);

-- Weekly rollup (example of time-series aggregation)
CREATE MATERIALIZED VIEW user_weekly_metrics AS
SELECT 
    user_id,
    DATE_TRUNC('week', date) as week_start,
    
    COUNT(DISTINCT date) as days_with_data,
    
    -- Adherence rate
    SUM(medications_taken) as total_medications_taken,
    SUM(medications_missed) as total_medications_missed,
    CASE 
        WHEN SUM(medications_taken) + SUM(medications_missed) > 0
        THEN ROUND(100.0 * SUM(medications_taken) / (SUM(medications_taken) + SUM(medications_missed)), 1)
        ELSE NULL
    END as adherence_rate,
    
    MAX(last_updated) as last_updated
FROM user_daily_metrics
GROUP BY user_id, DATE_TRUNC('week', date);

-- =====================================================
-- MIGRATION HELPERS
-- =====================================================

-- View to maintain backward compatibility with old schema
CREATE VIEW daily_checkins_legacy AS
SELECT 
    he.id,
    he.user_id,
    he.event_data->>'mood' as mood_today,
    (he.event_data->>'confidence')::INTEGER as confidence_today,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM health_events he2 
            WHERE he2.user_id = he.user_id 
            AND DATE(he2.occurred_at) = DATE(he.occurred_at)
            AND he2.event_type = 'medication'
            AND he2.event_data->>'status' = 'taken'
        ) THEN 'yes'
        WHEN EXISTS (
            SELECT 1 FROM health_events he2 
            WHERE he2.user_id = he.user_id 
            AND DATE(he2.occurred_at) = DATE(he.occurred_at)
            AND he2.event_type = 'medication'
            AND he2.event_data->>'status' IN ('missed', 'skipped')
        ) THEN 'no'
        ELSE 'not tracked'
    END as medication_taken,
    he.event_data->>'note' as user_note,
    DATE(he.occurred_at) as date_submitted,
    he.created_at
FROM health_events he
WHERE he.event_type = 'mood'
AND he.event_subtype = 'daily_checkin';

-- =====================================================
-- FUTURE-PROOFING (Paths to Option C)
-- =====================================================

-- Audit log table (can be moved to separate audit DB in Option C)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature flags (for gradual rollout)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    user_overrides JSONB, -- Specific user enables/disables
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMANCE & MAINTENANCE
-- =====================================================

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_medications_updated_at BEFORE UPDATE ON user_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_user_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_daily_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_weekly_metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE health_events IS 'Core event-sourced health data. Immutable, append-only.';
COMMENT ON COLUMN health_events.event_data IS 'Flexible JSONB storage. Structure depends on event_type.';
COMMENT ON TABLE user_daily_metrics IS 'Materialized view for fast daily analytics. Refresh every hour.';
COMMENT ON VIEW daily_checkins_legacy IS 'Backward compatibility view. Remove after frontend migration.';