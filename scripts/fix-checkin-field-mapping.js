#!/usr/bin/env node

/**
 * 🔧 FIX CHECK-IN FIELD MAPPING
 * Updates server.js to handle missing Airtable fields safely
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.js');

function fixFieldMapping() {
  console.log('🔧 FIXING CHECK-IN FIELD MAPPING\n');
  
  try {
    // Read the current server.js file
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    
    console.log('📖 Reading server.js...');
    
    // Fix 1: Safe field access in GET /api/checkins (around line 1836)
    const oldCheckinsMapping = `const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today,
      primary_concern_today: record.fields.primary_concern_today,
      confidence_today: record.fields.confidence_today,
      user_note: record.fields.user_note,
      date_submitted: record.fields.date_submitted,
      created_at: record.fields.created_at
    }));`;
    
    const newCheckinsMapping = `const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today || '',
      primary_concern_today: record.fields.primary_concern_today || null,
      confidence_today: record.fields.confidence_today || 5,
      user_note: record.fields.user_note || null,
      date_submitted: record.fields.date_submitted || '',
      created_at: record.fields.created_at || record.createdTime
    }));`;
    
    if (serverCode.includes(oldCheckinsMapping)) {
      serverCode = serverCode.replace(oldCheckinsMapping, newCheckinsMapping);
      console.log('✅ Fixed GET /api/checkins field mapping');
    } else {
      console.log('⚠️  GET /api/checkins mapping not found (may have been updated)');
    }
    
    // Fix 2: Safe field access in GET /api/insights/daily (around line 1899)
    const oldInsightsMapping = `const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today,
      primary_concern_today: record.fields.primary_concern_today,
      confidence_today: record.fields.confidence_today,
      user_note: record.fields.user_note,
      date_submitted: record.fields.date_submitted,
      created_at: record.fields.created_at
    }));`;
    
    const newInsightsMapping = `const checkins = result.records.map(record => ({
      id: record.id,
      mood_today: record.fields.mood_today || '',
      primary_concern_today: record.fields.primary_concern_today || null,
      confidence_today: record.fields.confidence_today || 5,
      user_note: record.fields.user_note || null,
      date_submitted: record.fields.date_submitted || '',
      created_at: record.fields.created_at || record.createdTime
    }));`;
    
    if (serverCode.includes(oldInsightsMapping)) {
      serverCode = serverCode.replace(oldInsightsMapping, newInsightsMapping);
      console.log('✅ Fixed GET /api/insights/daily field mapping');
    } else {
      console.log('⚠️  GET /api/insights/daily mapping not found (may have been updated)');
    }
    
    // Fix 3: Safe field access in GET /api/checkins/last-values (around line 1650)
    const oldLastValuesMapping = `last_values: {
          confidence_today: lastCheckin.confidence_today || 5,
          medication_confidence_today: lastCheckin.medication_confidence_today || null,
          financial_stress_today: lastCheckin.financial_stress_today || null,
          journey_readiness_today: lastCheckin.journey_readiness_today || null,
          last_checkin_date: lastCheckin.date_submitted
        }`;
    
    const newLastValuesMapping = `last_values: {
          confidence_today: lastCheckin.confidence_today || 5,
          medication_confidence_today: lastCheckin.medication_confidence_today || null,
          financial_stress_today: lastCheckin.financial_stress_today || null,
          journey_readiness_today: lastCheckin.journey_readiness_today || null,
          last_checkin_date: lastCheckin.date_submitted || null
        }`;
    
    if (serverCode.includes(oldLastValuesMapping)) {
      serverCode = serverCode.replace(oldLastValuesMapping, newLastValuesMapping);
      console.log('✅ Fixed GET /api/checkins/last-values field mapping');
    } else {
      console.log('⚠️  GET /api/checkins/last-values mapping not found (may have been updated)');
    }
    
    // Write the updated code back to the file
    fs.writeFileSync(serverPath, serverCode, 'utf8');
    
    console.log('\n✅ Field mapping fixes applied successfully!');
    console.log('📝 Changes made:');
    console.log('   - Added safe field access with fallbacks');
    console.log('   - Used || null for optional fields');
    console.log('   - Used || record.createdTime for created_at');
    console.log('   - Used || 5 for confidence_today default');
    console.log('   - Used || \'\' for required string fields');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test the fix locally: npm run dev');
    console.log('2. Deploy to staging for testing');
    console.log('3. Update Airtable schema with missing fields');
    console.log('4. Deploy to production');
    
  } catch (error) {
    console.error('❌ Error fixing field mapping:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixFieldMapping(); 