#!/usr/bin/env node

/**
 * Schema Validation Script for Airtable
 * Ensures staging/prod Airtable has all required fields
 */

const fetch = require('node-fetch');
const path = require('path');

// Load environment-specific .env file
const environment = process.argv[2] || 'staging';
const envFile = environment === 'production' ? '.env' : `.env.${environment}`;
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

console.log(`Loading environment from: ${envFile}`);

// Required fields for each table
const REQUIRED_SCHEMA = {
  Users: {
    fields: [
      'email',
      'password_hash',
      'created_at',
      'onboarding_path',
      'baseline_completed',
      'cycle_stage',
      'diagnosis',
      'diagnosis_date',
      'previous_cycles',
      'insurance_coverage',
      'partner_status',
      'partner_involved',
      'primary_goals',
      'biggest_concerns',
      'support_preferences',
      'notification_preferences',
      'timezone',
      'last_active'
    ]
  },
  DailyCheckins: {
    fields: [
      'user_id',
      'mood_today',
      'confidence_today',
      'primary_concern_today',
      'medication_confidence_today',
      'medication_concern_today',
      'financial_stress_today',
      'financial_concern_today',
      'journey_readiness_today',
      'top_concern_today',
      'user_note',
      'date_submitted',
      'created_at',
      'journey_reflection_today',
      'medication_momentum',
      'financial_momentum',
      'journey_momentum',
      'sentiment',
      'sentiment_confidence',
      'sentiment_scores',
      'sentiment_processing_time',
      'financial_confidence_today',
      'journey_confidence_today',
      'medication_emergency_check',
      'financial_emergency_check',
      'medication_taken' // New field we just added
    ]
  },
  Insights: {
    fields: [
      'user_id',
      'insight_type',
      'insight_title',
      'insight_content',
      'insight_category',
      'priority',
      'is_active',
      'delivered_at',
      'created_at',
      'expires_at',
      'action_url',
      'action_text',
      'emotion_triggers',
      'evidence_based',
      'personalization_factors'
    ]
  },
  InsightEngagement: {
    fields: [
      'user_id',
      'insight_id',
      'engagement_type',
      'engaged_at',
      'feedback_rating',
      'feedback_text',
      'time_to_engage',
      'session_id'
    ]
  }
};

async function getAirtableSchema(baseId, apiKey, tableName) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}?maxRecords=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${tableName}: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get field names from the first record (if any)
    if (data.records && data.records.length > 0) {
      return Object.keys(data.records[0].fields);
    }
    
    // If no records, we need to use the Airtable Meta API or manual check
    console.warn(`⚠️  No records found in ${tableName} - cannot auto-detect schema`);
    return [];
    
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message);
    return null;
  }
}

async function validateSchema(environment = 'staging') {
  console.log(`\n🔍 Validating Airtable Schema for ${environment.toUpperCase()}...\n`);
  
  // Get environment variables
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  
  if (!baseId || !apiKey) {
    console.error('❌ Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY environment variables');
    process.exit(1);
  }
  
  let hasErrors = false;
  const missingFields = {};
  
  // Validate each table
  for (const [tableName, schema] of Object.entries(REQUIRED_SCHEMA)) {
    console.log(`📋 Checking table: ${tableName}`);
    
    const existingFields = await getAirtableSchema(baseId, apiKey, tableName);
    
    if (existingFields === null) {
      hasErrors = true;
      continue;
    }
    
    // Check for missing fields
    const missing = schema.fields.filter(field => !existingFields.includes(field));
    
    if (missing.length > 0) {
      hasErrors = true;
      missingFields[tableName] = missing;
      console.error(`   ❌ Missing fields: ${missing.join(', ')}`);
    } else {
      console.log(`   ✅ All required fields present`);
    }
    
    // Show extra fields (informational)
    const extra = existingFields.filter(field => !schema.fields.includes(field));
    if (extra.length > 0) {
      console.log(`   ℹ️  Extra fields: ${extra.join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (hasErrors) {
    console.error('❌ SCHEMA VALIDATION FAILED\n');
    
    if (Object.keys(missingFields).length > 0) {
      console.log('Missing fields that need to be added:\n');
      
      for (const [table, fields] of Object.entries(missingFields)) {
        console.log(`${table}:`);
        fields.forEach(field => {
          console.log(`  - ${field}`);
        });
        console.log('');
      }
    }
    
    console.log('⚠️  Please add these fields to Airtable before deploying!\n');
    process.exit(1);
  } else {
    console.log('✅ SCHEMA VALIDATION PASSED\n');
    console.log('All required fields are present in Airtable.\n');
  }
}

// Run validation
validateSchema(environment);