/**
 * Airtable Schema Utilities
 * Filters data to match production Airtable schema
 */

// Production Airtable schema whitelist
const PRODUCTION_AIRTABLE_SCHEMA = {
  Users: [
    'email', 'nickname', 'created_at', 'last_checkin_date', 'status', 
    'timezone', 'medication_status', 'medication_status_updated', 
    'confidence_meds', 'confidence_costs', 'confidence_overall', 
    'primary_need', 'cycle_stage', 'email_opt_in', 'onboarding_path', 
    'baseline_completed', 'baseline_submission_date', 'top_concern'
  ],
  DailyCheckins: [
    'user_id', 'mood_today', 'confidence_today', 'anxiety_level', 
    'user_note', 'date_submitted', 'primary_concern_today', 
    'medication_taken', 'missed_doses', 'side_effects', 
    'partner_involved_today', 'injection_confidence', 'coping_strategies',
    'sentiment', 'sentiment_confidence', 'sentiment_scores', 
    'sentiment_processing_time', 'temperature', 'created_at'
  ],
  Insights: [
    'user_id', 'insight_type', 'insight_title', 'insight_message', 
    'insight_id', 'date', 'mood_trend', 'confidence_trend', 
    'top_concerns', 'status', 'triggered_by', 'context_data'
  ],
  FMVAnalytics: [
    'user_id', 'event_type', 'event_timestamp', 'event_data', 
    'date', 'page_view', 'feature_used', 'session_id', 'device_type'
  ]
};

/**
 * Filter object to only include fields in production schema
 */
function filterForProductionSchema(table, data) {
  const allowedFields = PRODUCTION_AIRTABLE_SCHEMA[table];
  
  if (!allowedFields) {
    console.warn(`⚠️ No schema defined for table: ${table}`);
    return data;
  }
  
  const filtered = {};
  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      filtered[key] = value;
    }
  }
  
  const removedFields = Object.keys(data).filter(key => !allowedFields.includes(key));
  if (removedFields.length > 0) {
    console.log(`🔍 Filtered out fields for ${table}:`, removedFields);
  }
  
  return filtered;
}

/**
 * Check if a field exists in production schema
 */
function isFieldInProductionSchema(table, field) {
  const allowedFields = PRODUCTION_AIRTABLE_SCHEMA[table];
  return allowedFields ? allowedFields.includes(field) : false;
}

/**
 * Get all fields for a table
 */
function getTableFields(table) {
  return PRODUCTION_AIRTABLE_SCHEMA[table] || [];
}

module.exports = {
  PRODUCTION_AIRTABLE_SCHEMA,
  filterForProductionSchema,
  isFieldInProductionSchema,
  getTableFields
};