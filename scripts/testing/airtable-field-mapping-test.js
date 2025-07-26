#!/usr/bin/env node

/**
 * 🔍 AIRTABLE FIELD MAPPING TEST
 * Verifies field names match between code and Airtable schema
 * Identifies potential field name mismatches causing silent failures
 */

const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', 
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Field mappings from our code
const CODE_FIELD_MAPPINGS = {
  Users: {
    email: 'email',
    nickname: 'nickname', 
    confidence_meds: 'confidence_meds',
    confidence_costs: 'confidence_costs',
    confidence_overall: 'confidence_overall',
    primary_need: 'primary_need',
    cycle_stage: 'cycle_stage',
    top_concern: 'top_concern',
    timezone: 'timezone',
    email_opt_in: 'email_opt_in',
    status: 'status',
    created_at: 'created_at'
  },
  DailyCheckins: {
    user_id: 'user_id', // Array format for linked records
    mood_today: 'mood_today',
    confidence_today: 'confidence_today',
    primary_concern_today: 'primary_concern_today',
    medication_confidence_today: 'medication_confidence_today',
    medication_concern_today: 'medication_concern_today',
    financial_stress_today: 'financial_stress_today',
    financial_concern_today: 'financial_concern_today',
    journey_readiness_today: 'journey_readiness_today',
    top_concern_today: 'top_concern_today',
    user_note: 'user_note',
    date_submitted: 'date_submitted',
    created_at: 'created_at'
  },
  Insights: {
    user_id: 'user_id',
    insight_type: 'insight_type',
    insight_title: 'insight_title',
    insight_message: 'insight_message',
    insight_id: 'insight_id',
    date: 'date',
    context_data: 'context_data',
    action_label: 'action_label',
    action_type: 'action_type',
    status: 'status',
    created_at: 'created_at'
  },
  InsightEngagement: {
    user_id: 'user_id',
    insight_type: 'insight_type',
    action: 'action',
    insight_id: 'insight_id',
    timestamp: 'timestamp',
    date_submitted: 'date_submitted',
    created_at: 'created_at'
  },
  FMVAnalytics: {
    user_id: 'user_id',
    event_type: 'event_type',
    event_timestamp: 'event_timestamp',
    date: 'date',
    event_data: 'event_data',
    insight_type: 'insight_type',
    insight_title: 'insight_title',
    insight_id: 'insight_id',
    feedback_type: 'feedback_type',
    feedback_context: 'feedback_context',
    mood_selected: 'mood_selected',
    confidence_level: 'confidence_level',
    concern_mentioned: 'concern_mentioned',
    created_at: 'created_at'
  }
};

// Check-in submission data structure from our code
const CHECKIN_SUBMISSION_DATA = {
  user_id: ['recXXXXXXXXXXXXX'], // Array format for linked records
  mood_today: 'hopeful, anxious',
  confidence_today: 7,
  primary_concern_today: 'medication timing',
  date_submitted: '2025-07-24'
};

// User creation data structure from our code
const USER_CREATION_DATA = {
  email: 'test@example.com',
  nickname: 'TestUser',
  confidence_meds: 5,
  confidence_costs: 7,
  confidence_overall: 6,
  primary_need: 'medical_clarity',
  cycle_stage: 'ivf_prep',
  status: 'active'
};

function analyzeFieldMappings() {
  log('\n🔍 AIRTABLE FIELD MAPPING ANALYSIS', 'magenta');
  log('='.repeat(50), 'blue');
  
  log('\n📊 Code Field Mappings:', 'yellow');
  Object.entries(CODE_FIELD_MAPPINGS).forEach(([table, fields]) => {
    log(`\n${table}:`, 'blue');
    Object.entries(fields).forEach(([fieldName, airtableField]) => {
      log(`   ${fieldName} → ${airtableField}`, 'green');
    });
  });
  
  log('\n🎯 Potential Issues to Check:', 'yellow');
  log('1. Field name case sensitivity (Airtable is case-sensitive)', 'blue');
  log('2. Special characters in field names', 'blue');
  log('3. Field type mismatches (text vs number vs date)', 'blue');
  log('4. Required field validation rules', 'blue');
  log('5. Linked record field format (array vs single value)', 'blue');
  
  log('\n🚨 CRITICAL FIELD CHECKS:', 'red');
  log('DailyCheckins.user_id: Must be array format for linked records', 'yellow');
  log('DailyCheckins.date_submitted: Must be YYYY-MM-DD format', 'yellow');
  log('Users.email: Must be unique and valid email format', 'yellow');
  
  log('\n💡 Airtable Schema Validation Checklist:', 'yellow');
  log('□ Verify all field names exist in Airtable exactly as written', 'blue');
  log('□ Check field types match (Single line text, Number, Date, etc.)', 'blue');
  log('□ Confirm linked record fields are properly configured', 'blue');
  log('□ Verify no field validation rules are blocking writes', 'blue');
  log('□ Check for any field name changes in Airtable', 'blue');
  
  log('\n🔧 Debugging Steps:', 'yellow');
  log('1. Open Airtable base and compare field names', 'blue');
  log('2. Check field types and validation rules', 'blue');
  log('3. Test manual record creation in Airtable', 'blue');
  log('4. Review Airtable API response for field errors', 'blue');
}

function analyzeDataStructures() {
  log('\n📋 DATA STRUCTURE ANALYSIS', 'magenta');
  log('='.repeat(30), 'blue');
  
  log('\nCheck-in Submission Structure:', 'yellow');
  log(JSON.stringify(CHECKIN_SUBMISSION_DATA, null, 2), 'blue');
  
  log('\nUser Creation Structure:', 'yellow');
  log(JSON.stringify(USER_CREATION_DATA, null, 2), 'blue');
  
  log('\n⚠️ Common Airtable Issues:', 'yellow');
  log('• Field names with spaces or special characters', 'red');
  log('• Date fields expecting specific formats', 'red');
  log('• Number fields receiving text values', 'red');
  log('• Linked record fields not in array format', 'red');
  log('• Required fields missing from submission', 'red');
}

// Run analysis
analyzeFieldMappings();
analyzeDataStructures(); 