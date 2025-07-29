#!/usr/bin/env node

/**
 * Add test user to local SQLite database for development
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Path to local SQLite database
const dbPath = path.join(__dirname, '..', 'backend', 'data', 'novara-local.db');

try {
  const db = new Database(dbPath);
  
  // Your user data (matching production profile for existing user)
  const userId = uuidv4();
  const userData = {
    id: userId,
    email: 'ellingtonsp3@gmail.com',
    nickname: 'Stephen',
    confidence_meds: 8,
    confidence_costs: 6,
    confidence_overall: 7,
    primary_need: 'emotional_support',
    cycle_stage: 'stimulation',  // Set to stimulation so we can see the checklist
    top_concern: 'medication side effects',
    timezone: 'America/New_York',
    email_opt_in: 1,
    status: 'active',
    baseline_completed: 1,
    onboarding_path: 'control',
    created_at: new Date().toISOString()
  };

  // Insert user
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, nickname, confidence_meds, confidence_costs, confidence_overall,
      primary_need, cycle_stage, top_concern, timezone, email_opt_in, status,
      baseline_completed, onboarding_path, created_at
    ) VALUES (
      @id, @email, @nickname, @confidence_meds, @confidence_costs, @confidence_overall,
      @primary_need, @cycle_stage, @top_concern, @timezone, @email_opt_in, @status,
      @baseline_completed, @onboarding_path, @created_at
    )
  `);

  insertUser.run(userData);

  // Add some test check-ins for realistic data
  const checkinData = [
    {
      id: uuidv4(),
      user_id: userId,
      mood_today: 'hopeful',
      confidence_today: 5,
      primary_concern_today: 'medication timing',
      date_submitted: '2025-07-28',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      mood_today: 'confident',
      confidence_today: 7,
      primary_concern_today: 'upcoming monitoring',
      date_submitted: '2025-07-27',
      created_at: new Date().toISOString()
    }
  ];

  const insertCheckin = db.prepare(`
    INSERT OR REPLACE INTO daily_checkins (
      id, user_id, mood_today, confidence_today, primary_concern_today, 
      date_submitted, created_at
    ) VALUES (
      @id, @user_id, @mood_today, @confidence_today, @primary_concern_today,
      @date_submitted, @created_at
    )
  `);

  checkinData.forEach(checkin => insertCheckin.run(checkin));

  console.log('✅ Test user added successfully!');
  console.log(`📧 Email: ${userData.email}`);
  console.log(`👤 Nickname: ${userData.nickname}`);
  console.log(`🔄 Cycle Stage: ${userData.cycle_stage}`);
  console.log(`📊 Check-ins: ${checkinData.length} added`);
  
  db.close();
} catch (error) {
  console.error('❌ Error adding test user:', error);
  process.exit(1);
}