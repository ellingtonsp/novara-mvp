#!/usr/bin/env node

/**
 * Airtable to PostgreSQL Migration Script
 * 
 * This script migrates all data from Airtable to PostgreSQL
 * Run with: node backend/scripts/migrate-to-postgres.js
 */

const fetch = require('node-fetch');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing Airtable credentials in environment variables');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL or POSTGRES_URL in environment variables');
  process.exit(1);
}

// PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Airtable API helpers
async function fetchAirtableRecords(tableName, offset = null) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}${offset ? `?offset=${offset}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function getAllAirtableRecords(tableName) {
  let allRecords = [];
  let offset = null;
  
  do {
    const data = await fetchAirtableRecords(tableName, offset);
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
    
    if (offset) {
      console.log(`   Fetched ${allRecords.length} records, continuing...`);
    }
  } while (offset);
  
  return allRecords;
}

// Migration functions
async function migrateUsers() {
  console.log('\n📤 Migrating Users...');
  
  const users = await getAllAirtableRecords('Users');
  console.log(`   Found ${users.length} users to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const record of users) {
    try {
      const fields = record.fields;
      
      // Map Airtable fields to PostgreSQL
      const query = `
        INSERT INTO users (
          id, email, nickname, confidence_meds, confidence_costs, 
          confidence_overall, primary_need, cycle_stage, top_concern,
          timezone, email_opt_in, status, medication_status,
          baseline_completed, onboarding_path, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (email) DO UPDATE SET
          nickname = EXCLUDED.nickname,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [
        record.id,
        fields.email,
        fields.nickname || 'User',
        fields.confidence_meds || 5,
        fields.confidence_costs || 5,
        fields.confidence_overall || 5,
        fields.primary_need,
        fields.cycle_stage,
        fields.top_concern,
        fields.timezone || 'America/Los_Angeles',
        fields.email_opt_in !== false,
        fields.status || 'active',
        fields.medication_status,
        fields.baseline_completed || false,
        fields.onboarding_path,
        fields.created_at || record.createdTime
      ];
      
      await pool.query(query, values);
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`   Migrated ${migrated} users...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to migrate user ${record.fields.email}:`, error.message);
      failed++;
    }
  }
  
  console.log(`✅ Users migration complete: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateCheckins() {
  console.log('\n📤 Migrating Daily Check-ins...');
  
  const checkins = await getAllAirtableRecords('DailyCheckins');
  console.log(`   Found ${checkins.length} check-ins to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const record of checkins) {
    try {
      const fields = record.fields;
      
      // Get user ID from email (Airtable uses email as foreign key)
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [fields.user_id]
      );
      
      if (userResult.rows.length === 0) {
        console.warn(`   ⚠️  No user found for email: ${fields.user_id}`);
        failed++;
        continue;
      }
      
      const userId = userResult.rows[0].id;
      
      // Map all fields including those currently lost
      const query = `
        INSERT INTO daily_checkins (
          id, user_id, mood_today, confidence_today, medication_taken,
          user_note, primary_concern_today, date_submitted,
          anxiety_level, side_effects, missed_doses, injection_confidence,
          appointment_within_3_days, appointment_anxiety, coping_strategies_used,
          partner_involved_today, wish_knew_more_about,
          sentiment, sentiment_confidence, sentiment_scores,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (user_id, date_submitted) DO UPDATE SET
          mood_today = EXCLUDED.mood_today,
          confidence_today = EXCLUDED.confidence_today,
          medication_taken = EXCLUDED.medication_taken,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      // Parse array fields from Airtable (might be comma-separated strings)
      const parseArray = (field) => {
        if (!field) return null;
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') return field.split(',').map(s => s.trim());
        return null;
      };
      
      const values = [
        record.id,
        userId,
        fields.mood_today,
        fields.confidence_today || 5,
        fields.medication_taken || 'not tracked',
        fields.user_note,
        fields.primary_concern_today,
        fields.date_submitted,
        fields.anxiety_level,
        parseArray(fields.side_effects),
        fields.missed_doses,
        fields.injection_confidence,
        fields.appointment_within_3_days,
        fields.appointment_anxiety,
        parseArray(fields.coping_strategies_used),
        fields.partner_involved_today,
        parseArray(fields.wish_knew_more_about),
        fields.sentiment,
        fields.sentiment_confidence,
        fields.sentiment_scores ? JSON.parse(fields.sentiment_scores) : null,
        fields.created_at || record.createdTime
      ];
      
      await pool.query(query, values);
      migrated++;
      
      if (migrated % 100 === 0) {
        console.log(`   Migrated ${migrated} check-ins...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to migrate check-in:`, error.message);
      failed++;
    }
  }
  
  console.log(`✅ Check-ins migration complete: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

async function migrateInsights() {
  console.log('\n📤 Migrating Insights...');
  
  const insights = await getAllAirtableRecords('Insights');
  console.log(`   Found ${insights.length} insights to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const record of insights) {
    try {
      const fields = record.fields;
      
      // Get user ID from email
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [fields.user_id]
      );
      
      if (userResult.rows.length === 0) {
        console.warn(`   ⚠️  No user found for email: ${fields.user_id}`);
        failed++;
        continue;
      }
      
      const userId = userResult.rows[0].id;
      
      const query = `
        INSERT INTO insights (
          id, user_id, insight_type, insight_title, insight_message,
          insight_id, date, context_data, action_label, action_type,
          status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) ON CONFLICT (user_id, insight_id) DO NOTHING
      `;
      
      const values = [
        record.id,
        userId,
        fields.insight_type,
        fields.insight_title,
        fields.insight_message,
        fields.insight_id,
        fields.date,
        fields.context_data ? JSON.parse(fields.context_data) : null,
        fields.action_label,
        fields.action_type,
        fields.status || 'active',
        fields.created_at || record.createdTime
      ];
      
      await pool.query(query, values);
      migrated++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate insight:`, error.message);
      failed++;
    }
  }
  
  console.log(`✅ Insights migration complete: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

// Validation functions
async function validateMigration() {
  console.log('\n🔍 Validating Migration...');
  
  // Count records in PostgreSQL
  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  const checkinCount = await pool.query('SELECT COUNT(*) FROM daily_checkins');
  const insightCount = await pool.query('SELECT COUNT(*) FROM insights');
  
  console.log('\n📊 PostgreSQL Record Counts:');
  console.log(`   Users: ${userCount.rows[0].count}`);
  console.log(`   Check-ins: ${checkinCount.rows[0].count}`);
  console.log(`   Insights: ${insightCount.rows[0].count}`);
  
  // Sample data validation
  console.log('\n📋 Sample Data Validation:');
  
  const sampleUser = await pool.query('SELECT * FROM users LIMIT 1');
  if (sampleUser.rows.length > 0) {
    console.log('   ✅ Sample user:', sampleUser.rows[0].email);
  }
  
  const sampleCheckin = await pool.query(`
    SELECT c.*, u.email 
    FROM daily_checkins c 
    JOIN users u ON c.user_id = u.id 
    ORDER BY c.date_submitted DESC 
    LIMIT 1
  `);
  if (sampleCheckin.rows.length > 0) {
    console.log('   ✅ Sample check-in:', {
      user: sampleCheckin.rows[0].email,
      date: sampleCheckin.rows[0].date_submitted,
      mood: sampleCheckin.rows[0].mood_today
    });
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Airtable to PostgreSQL Migration');
  console.log('   Database:', DATABASE_URL.split('@')[1]?.split('/')[0] || 'local');
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful');
    
    // Run migrations in order
    const results = {
      users: await migrateUsers(),
      checkins: await migrateCheckins(),
      insights: await migrateInsights()
    };
    
    // Validate migration
    await validateMigration();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    let totalMigrated = 0;
    let totalFailed = 0;
    
    for (const [table, result] of Object.entries(results)) {
      console.log(`${table}: ${result.migrated} migrated, ${result.failed} failed`);
      totalMigrated += result.migrated;
      totalFailed += result.failed;
    }
    
    console.log(`\nTotal: ${totalMigrated} records migrated, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some failures. Review logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrate();
}