-- Schema V2 Additional Components
-- Run this after the main schema to add functions, triggers, and views

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_user_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_daily_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_weekly_metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MISSING COLUMNS (add if not exist)
-- =====================================================

-- Add updated_at to tables that need it
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_medications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE health_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_medications_updated_at ON user_medications;
CREATE TRIGGER update_user_medications_updated_at BEFORE UPDATE ON user_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Daily aggregated metrics per user
DROP MATERIALIZED VIEW IF EXISTS user_daily_metrics CASCADE;
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
    
    MAX(created_at) as last_updated
FROM health_events he
GROUP BY user_id, DATE(occurred_at);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_user_daily_metrics ON user_daily_metrics(user_id, date);

-- Weekly rollup
DROP MATERIALIZED VIEW IF EXISTS user_weekly_metrics CASCADE;
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
-- COMPATIBILITY VIEW
-- =====================================================

-- View to maintain backward compatibility with old schema
DROP VIEW IF EXISTS daily_checkins_legacy CASCADE;
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