#!/usr/bin/env node

/**
 * Validate Check-in Fields
 * Ensures all check-in form fields are properly saved and retrieved
 */

console.log('🔍 Check-in Field Validation');
console.log('=' .repeat(60));

// Quick check-in fields (minimal set)
const QUICK_CHECKIN_FIELDS = [
  'mood_today',
  'confidence_today', 
  'medication_taken',
  'user_note',
  'date_submitted'
];

// Enhanced check-in fields (comprehensive set)
const ENHANCED_CHECKIN_FIELDS = [
  // Basic fields
  ...QUICK_CHECKIN_FIELDS,
  'primary_concern_today',
  
  // Enhanced fields from frontend
  'anxiety_level',
  'side_effects',
  'missed_doses',
  'injection_confidence',
  'appointment_within_3_days',
  'appointment_anxiety',
  'coping_strategies_used',
  'partner_involved_today',
  'wish_knew_more_about',
  
  // PHQ-4 fields
  'phq4_feeling_nervous',
  'phq4_stop_worrying',
  'phq4_little_interest',
  'phq4_feeling_down'
];

// Fields that should be calculated/derived
const CALCULATED_FIELDS = [
  'sentiment',
  'sentiment_confidence',
  'sentiment_scores',
  'id',
  'created_at'
];

// Fields mentioned in PRODUCTION_AIRTABLE_SCHEMA
const AIRTABLE_SCHEMA_FIELDS = [
  'user_id',
  'mood_today', 
  'confidence_today',
  'primary_concern_today',
  'user_note',
  'date_submitted',
  'medication_taken',
  'medication_confidence_today',
  'medication_concern_today',
  'financial_stress_today',
  'financial_concern_today',
  'journey_readiness_today',
  'top_concern_today',
  'sentiment',
  'sentiment_confidence', 
  'sentiment_scores',
  'sentiment_processing_time',
  'created_at'
];

console.log('\\n📋 FIELD ANALYSIS:');
console.log('\\nQuick Check-in sends these fields:');
QUICK_CHECKIN_FIELDS.forEach(field => console.log(`  ✓ ${field}`));

console.log('\\nEnhanced Check-in sends these additional fields:');
const enhancedOnly = ENHANCED_CHECKIN_FIELDS.filter(f => !QUICK_CHECKIN_FIELDS.includes(f));
enhancedOnly.forEach(field => console.log(`  ✓ ${field}`));

console.log('\\n⚠️  POTENTIAL ISSUES:');

// Check for fields in Airtable schema but not sent by forms
const missingFromForms = AIRTABLE_SCHEMA_FIELDS.filter(f => 
  !ENHANCED_CHECKIN_FIELDS.includes(f) && 
  !CALCULATED_FIELDS.includes(f) &&
  f !== 'user_id' // Added by backend
);

if (missingFromForms.length > 0) {
  console.log('\\nFields in Airtable schema but not sent by forms:');
  missingFromForms.forEach(field => console.log(`  ❌ ${field}`));
}

// Check for fields sent by forms but not in Airtable schema
const notInAirtable = ENHANCED_CHECKIN_FIELDS.filter(f => 
  !AIRTABLE_SCHEMA_FIELDS.includes(f)
);

if (notInAirtable.length > 0) {
  console.log('\\nFields sent by forms but NOT in Airtable schema:');
  notInAirtable.forEach(field => console.log(`  ⚠️  ${field} - May not be saved!`));
}

console.log('\\n📊 SUMMARY:');
console.log(`Total fields sent by Enhanced form: ${ENHANCED_CHECKIN_FIELDS.length}`);
console.log(`Total fields in Airtable schema: ${AIRTABLE_SCHEMA_FIELDS.length}`);
console.log(`Fields missing from Airtable: ${notInAirtable.length}`);

console.log('\\n🔧 RECOMMENDATIONS:');

if (notInAirtable.length > 0) {
  console.log('\\n1. Add these fields to PRODUCTION_AIRTABLE_SCHEMA in backend/server.js:');
  notInAirtable.forEach(field => console.log(`   '${field}',`));
  
  console.log('\\n2. Add these fields to Airtable in both staging and production');
  
  console.log('\\n3. Run pre-deployment check:');
  console.log('   node backend/scripts/pre-deployment-check.js');
}

console.log('\\n✅ To verify data is saving correctly:');
console.log('1. Submit a check-in with all fields filled');
console.log('2. Check the API response to see which fields are returned');
console.log('3. Query the database directly to verify storage');
console.log('4. Check if insights/calculations use the enhanced fields');

console.log('\\n' + '='.repeat(60));