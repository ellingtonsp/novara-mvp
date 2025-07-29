-- Evidence-Based Schema Updates for Enhanced Data Capture
-- Based on research findings for improving IVF outcomes

-- 1. Enhanced daily_checkins table
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS anxiety_level INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS took_all_medications BOOLEAN DEFAULT true;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS missed_doses INTEGER DEFAULT 0;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS injection_confidence INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS side_effects TEXT; -- JSON array
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS side_effect_severity TEXT; -- JSON object
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS appointment_within_3_days BOOLEAN DEFAULT false;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS appointment_anxiety INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS questions_prepared BOOLEAN;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS coping_strategies_used TEXT; -- JSON array
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS partner_involved_today BOOLEAN DEFAULT false;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS wish_knew_more_about TEXT; -- JSON array

-- 2. PHQ-4 Assessment tracking
CREATE TABLE IF NOT EXISTS phq4_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  anxiety_score INTEGER NOT NULL,
  depression_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL, -- 'minimal', 'mild', 'moderate', 'severe'
  assessment_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 3. Medication adherence tracking with more detail
CREATE TABLE IF NOT EXISTS medication_adherence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  taken_time TEXT,
  missed BOOLEAN DEFAULT false,
  side_effects TEXT, -- JSON array
  notes TEXT,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 4. Appointment feedback for learning what helps
CREATE TABLE IF NOT EXISTS appointment_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_type TEXT NOT NULL,
  
  -- Preparation effectiveness
  checklist_items_used TEXT, -- JSON array
  most_helpful_item TEXT,
  wished_had_prepared TEXT,
  
  -- Communication quality
  questions_asked INTEGER,
  questions_answered_clearly INTEGER,
  felt_heard BOOLEAN,
  
  -- Outcomes
  decisions_made TEXT, -- JSON array
  next_steps_clear BOOLEAN,
  confidence_before INTEGER,
  confidence_after INTEGER,
  
  -- Would help others
  advice_for_others TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 5. Intervention effectiveness tracking
CREATE TABLE IF NOT EXISTS intervention_effectiveness (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  intervention_type TEXT NOT NULL, -- 'breathing', 'meditation', 'partner_discussion', etc.
  pre_intervention_metric INTEGER, -- anxiety, confidence, etc.
  post_intervention_metric INTEGER,
  metric_type TEXT, -- 'anxiety', 'confidence', 'mood'
  effectiveness_score INTEGER, -- calculated improvement
  would_recommend BOOLEAN,
  usage_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 6. Cycle outcome tracking (for correlation analysis)
CREATE TABLE IF NOT EXISTS cycle_outcomes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE,
  cycle_completed BOOLEAN,
  outcome TEXT, -- 'pregnant', 'not_pregnant', 'cancelled', 'abandoned'
  
  -- Aggregated metrics during cycle
  avg_medication_adherence REAL,
  avg_anxiety_level REAL,
  avg_confidence REAL,
  total_checkins INTEGER,
  phq4_start_score INTEGER,
  phq4_end_score INTEGER,
  
  -- Support utilization
  coping_strategies_count INTEGER,
  partner_involvement_rate REAL,
  professional_support_used BOOLEAN,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_user_anxiety ON daily_checkins(user_id, anxiety_level);
CREATE INDEX IF NOT EXISTS idx_checkins_user_adherence ON daily_checkins(user_id, took_all_medications);
CREATE INDEX IF NOT EXISTS idx_phq4_user_date ON phq4_assessments(user_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_medication_user_date ON medication_adherence(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_user_date ON appointment_feedback(user_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_intervention_user_type ON intervention_effectiveness(user_id, intervention_type);
CREATE INDEX IF NOT EXISTS idx_cycle_outcomes_user ON cycle_outcomes(user_id, cycle_start_date DESC);

-- 8. Views for easy metric calculation
CREATE VIEW IF NOT EXISTS user_adherence_metrics AS
SELECT 
  user_id,
  COUNT(*) as total_medication_days,
  SUM(CASE WHEN took_all_medications THEN 1 ELSE 0 END) as adherent_days,
  ROUND(CAST(SUM(CASE WHEN took_all_medications THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as adherence_rate,
  SUM(missed_doses) as total_missed_doses,
  DATE('now', '-7 days') as week_start,
  DATE('now') as week_end
FROM daily_checkins
WHERE date_submitted >= DATE('now', '-7 days')
GROUP BY user_id;

CREATE VIEW IF NOT EXISTS user_mental_health_trends AS
SELECT 
  dc.user_id,
  AVG(dc.anxiety_level) as avg_anxiety_last_week,
  AVG(dc.confidence_today) as avg_confidence_last_week,
  phq.total_score as latest_phq4_score,
  phq.risk_level as latest_risk_level,
  CASE 
    WHEN AVG(dc.anxiety_level) < LAG(AVG(dc.anxiety_level)) OVER (PARTITION BY dc.user_id ORDER BY DATE(dc.date_submitted, '-7 days')) 
    THEN 'improving'
    WHEN AVG(dc.anxiety_level) > LAG(AVG(dc.anxiety_level)) OVER (PARTITION BY dc.user_id ORDER BY DATE(dc.date_submitted, '-7 days'))
    THEN 'worsening'
    ELSE 'stable'
  END as anxiety_trend
FROM daily_checkins dc
LEFT JOIN (
  SELECT user_id, total_score, risk_level, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY assessment_date DESC) as rn
  FROM phq4_assessments
) phq ON dc.user_id = phq.user_id AND phq.rn = 1
WHERE dc.date_submitted >= DATE('now', '-7 days')
GROUP BY dc.user_id;

-- 9. Function to calculate check-in streak
-- Note: SQLite doesn't support stored procedures, so this would be calculated in application code
-- This is the logic that would be implemented:
/*
function calculateStreak(userId) {
  SELECT 
    user_id,
    date_submitted,
    ROW_NUMBER() OVER (ORDER BY date_submitted DESC) as rn,
    DATE(date_submitted) - ROW_NUMBER() OVER (ORDER BY date_submitted DESC) as streak_group
  FROM daily_checkins
  WHERE user_id = userId
  ORDER BY date_submitted DESC;
  
  -- Then count consecutive days in the most recent streak_group
}
*/