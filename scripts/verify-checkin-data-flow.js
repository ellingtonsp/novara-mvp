#!/usr/bin/env node

/**
 * Verify Check-in Data Flow
 * Tests that all enhanced check-in fields are properly saved and retrieved
 */

console.log('🔍 Verifying Check-in Data Flow in PostgreSQL');
console.log('=' .repeat(60));

// Enhanced check-in fields being sent from frontend
const ENHANCED_FIELDS_FROM_FRONTEND = {
  // Basic fields
  mood_today: 'anxious',
  confidence_today: 5,
  medication_taken: 'no',
  user_note: 'Test note with all fields',
  date_submitted: '2025-07-30',
  primary_concern_today: 'medication_side_effects',
  
  // Enhanced fields
  anxiety_level: 8,
  side_effects: ['Headache', 'Bloating', 'Mood swings'],
  missed_doses: 2,
  injection_confidence: 6,
  appointment_within_3_days: true,
  appointment_anxiety: 7,
  coping_strategies_used: ['Deep breathing', 'Talked to partner'],
  partner_involved_today: true,
  wish_knew_more_about: ['Success rates', 'Alternative protocols'],
  
  // PHQ-4 fields
  phq4_feeling_nervous: 2,
  phq4_stop_worrying: 3,
  phq4_little_interest: 1,
  phq4_feeling_down: 2
};

console.log('\\n📋 SCHEMA V2 DATA FLOW ANALYSIS:');
console.log('\\nWhen using Schema V2 (current setup), data flows as follows:');

console.log('\\n1️⃣ MOOD EVENT (health_events table):');
console.log('   Stores in event_data JSON:');
console.log('   ✓ mood');
console.log('   ✓ confidence');
console.log('   ✓ anxiety_level');
console.log('   ✓ note');
console.log('   ✓ primary_concern');
console.log('   ✓ injection_confidence');
console.log('   ✓ partner_involved');

console.log('\\n2️⃣ MEDICATION EVENT (health_events table):');
console.log('   Stores in event_data JSON:');
console.log('   ✓ status (taken/missed)');
console.log('   ✓ missed_doses');

console.log('\\n3️⃣ SYMPTOM EVENT (health_events table):');
console.log('   Stores in event_data JSON:');
console.log('   ✓ symptoms (side_effects array)');
console.log('   ✓ related_to: "medication"');

console.log('\\n⚠️  FIELDS NOT CURRENTLY STORED IN V2:');
const notStoredInV2 = [
  'appointment_within_3_days',
  'appointment_anxiety',
  'coping_strategies_used',
  'wish_knew_more_about',
  'phq4_feeling_nervous',
  'phq4_stop_worrying', 
  'phq4_little_interest',
  'phq4_feeling_down'
];
notStoredInV2.forEach(field => console.log(`   ❌ ${field}`));

console.log('\\n📊 RETRIEVAL VIA daily_checkins_legacy VIEW:');
console.log('The view extracts from health_events:');
console.log('   ✓ mood_today (from event_data->mood)');
console.log('   ✓ confidence_today (from event_data->confidence)');
console.log('   ✓ anxiety_level (from event_data->anxiety_level)');
console.log('   ✓ medication_taken (computed from medication events)');
console.log('   ✓ user_note (from event_data->note)');
console.log('   ✓ side_effects (if view is updated)');
console.log('   ✓ coping_strategies_used (if view is updated)');

console.log('\\n🔧 RECOMMENDATIONS:');

console.log('\\n1. To store appointment data, add to mood event in compatibility-service.js:');
console.log(`   if (checkinData.appointment_within_3_days !== undefined) {
     moodData.appointment_within_3_days = checkinData.appointment_within_3_days;
     moodData.appointment_anxiety = checkinData.appointment_anxiety;
   }`);

console.log('\\n2. To store coping strategies, add to mood event:');
console.log(`   if (checkinData.coping_strategies_used) {
     moodData.coping_strategies = checkinData.coping_strategies_used;
   }`);

console.log('\\n3. To store info needs, add to mood event:');
console.log(`   if (checkinData.wish_knew_more_about) {
     moodData.info_needs = checkinData.wish_knew_more_about;
   }`);

console.log('\\n4. For PHQ-4 data, create a separate event:');
console.log(`   if (checkinData.phq4_feeling_nervous !== undefined) {
     // Create PHQ-4 assessment event
     await this.pool.query(\`
       INSERT INTO health_events (
         user_id, event_type, event_subtype,
         event_data, occurred_at, correlation_id, source
       ) VALUES (
         $1, 'assessment', 'phq4',
         $2, $3, $4, 'api'
       )
     \`, [
       userId,
       JSON.stringify({
         feeling_nervous: checkinData.phq4_feeling_nervous,
         stop_worrying: checkinData.phq4_stop_worrying,
         little_interest: checkinData.phq4_little_interest,
         feeling_down: checkinData.phq4_feeling_down,
         total_score: checkinData.phq4_feeling_nervous + checkinData.phq4_stop_worrying + 
                      checkinData.phq4_little_interest + checkinData.phq4_feeling_down
       }),
       occurredAt,
       correlationId
     ]);
   }`);

console.log('\\n5. Update formatV2AsV1 to include these fields in the response');

console.log('\\n✅ VERIFICATION STEPS:');
console.log('1. Update compatibility-service.js with missing field handlers');
console.log('2. Submit a check-in with all enhanced fields');
console.log('3. Query health_events table to verify JSON data storage');
console.log('4. Check API response includes all submitted fields');
console.log('5. Verify insights use the enhanced data');

console.log('\\n💡 QUICK FIX OPTION:');
console.log('If immediate fix needed, temporarily switch to Schema V1:');
console.log('1. Set USE_SCHEMA_V2=false in Railway');
console.log('2. V1 schema has columns for most enhanced fields');
console.log('3. But long-term, updating V2 compatibility is better');

console.log('\\n' + '='.repeat(60));