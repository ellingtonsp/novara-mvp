#!/usr/bin/env node

/**
 * 🌱 LOCAL DATABASE SEEDING SCRIPT
 * Seeds the SQLite database with realistic test data for development
 */

const { databaseAdapter } = require('../database/database-factory');

async function seedTestData() {
  try {
    console.log('🌱 Seeding local database with test data...');

    // Clear existing data
    if (databaseAdapter.isUsingLocalDatabase()) {
      databaseAdapter.clearLocalData();
      console.log('🗑️ Cleared existing test data');
    }

    // Test Users
    const testUsers = [
      {
        email: 'sarah@novara.test',
        nickname: 'Sarah',
        confidence_meds: 4,
        confidence_costs: 6,
        confidence_overall: 5,
        primary_need: 'emotional_support',
        cycle_stage: 'ivf_prep',
        top_concern: 'medication side effects',
        timezone: 'America/New_York',
        email_opt_in: true,
        status: 'active'
      },
      {
        email: 'emma@novara.test',
        nickname: 'Emma',
        confidence_meds: 7,
        confidence_costs: 3,
        confidence_overall: 6,
        primary_need: 'financial_guidance',
        cycle_stage: 'ivf_active',
        top_concern: 'treatment costs',
        timezone: 'America/Los_Angeles',
        email_opt_in: true,
        status: 'active'
      },
      {
        email: 'alex@novara.test',
        nickname: 'Alex',
        confidence_meds: 8,
        confidence_costs: 7,
        confidence_overall: 8,
        primary_need: 'information',
        cycle_stage: 'trying_naturally',
        top_concern: 'timing protocols',
        timezone: 'America/Chicago',
        email_opt_in: false,
        status: 'active'
      },
      {
        email: 'test@local.dev',
        nickname: 'LocalTester',
        confidence_meds: 5,
        confidence_costs: 5,
        confidence_overall: 5,
        primary_need: 'emotional_support',
        cycle_stage: 'ivf_prep',
        top_concern: 'general anxiety',
        timezone: 'America/New_York',
        email_opt_in: true,
        status: 'active'
      }
    ];

    // Create test users
    const createdUsers = [];
    for (const userData of testUsers) {
      try {
        const result = await databaseAdapter.airtableRequest('Users', 'POST', { fields: userData });
        createdUsers.push(result);
        console.log(`✅ Created user: ${userData.nickname} (${userData.email})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    // Create test check-ins for each user
    const today = new Date();
    const checkInData = [
      {
        mood_today: 'hopeful, anxious',
        confidence_today: 7,
        primary_concern_today: 'injection timing',
        medication_confidence_today: 6,
        user_note: 'First day of stims, feeling optimistic but nervous'
      },
      {
        mood_today: 'tired, determined',
        confidence_today: 5,
        primary_concern_today: 'side effects',
        medication_confidence_today: 4,
        financial_stress_today: 8,
        user_note: 'Headaches from meds but pushing through'
      },
      {
        mood_today: 'excited, overwhelmed',
        confidence_today: 8,
        primary_concern_today: 'egg retrieval prep',
        journey_readiness_today: 9,
        user_note: 'Getting close to retrieval - so many emotions!'
      }
    ];

    // Create check-ins for first user (going back 3 days)
    if (createdUsers.length > 0) {
      const userId = createdUsers[0].id;
      
      for (let i = 0; i < checkInData.length; i++) {
        const checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() - (2 - i)); // 3 days ago, 2 days ago, 1 day ago
        
        const checkinPayload = {
          user_id: [userId],
          ...checkInData[i],
          date_submitted: checkInDate.toISOString().split('T')[0]
        };

        try {
          await databaseAdapter.airtableRequest('DailyCheckins', 'POST', { fields: checkinPayload });
          console.log(`✅ Created check-in for ${createdUsers[0].fields.nickname}: ${checkinPayload.date_submitted}`);
        } catch (error) {
          console.error(`❌ Failed to create check-in:`, error.message);
        }
      }
    }

    // Create sample insights
    if (createdUsers.length > 0) {
      const insights = [
        {
          user_id: [createdUsers[0].id],
          insight_type: 'daily_insight',
          insight_title: 'Your confidence is building',
          insight_message: 'Based on your recent check-ins, your medication confidence has improved from 4 to 6. This shows great adaptation to your protocol.',
          insight_id: `daily_${Date.now()}`,
          date: today.toISOString().split('T')[0],
          context_data: JSON.stringify({ checkins_analyzed: 3, confidence_trend: 'improving' }),
          status: 'active'
        },
        {
          user_id: [createdUsers[1] ? createdUsers[1].id : createdUsers[0].id],
          insight_type: 'onboarding_micro',
          insight_title: 'Welcome to your fertility journey',
          insight_message: 'Every journey is unique. Focus on progress, not perfection.',
          insight_id: `onboarding_${Date.now()}`,
          date: today.toISOString().split('T')[0],
          context_data: JSON.stringify({ user_stage: 'onboarding' }),
          action_label: 'Learn more',
          action_type: 'link',
          status: 'active'
        }
      ];

      for (const insight of insights) {
        try {
          await databaseAdapter.airtableRequest('Insights', 'POST', { fields: insight });
          console.log(`✅ Created insight: ${insight.insight_title}`);
        } catch (error) {
          console.error(`❌ Failed to create insight:`, error.message);
        }
      }
    }

    // Show database statistics
    const stats = databaseAdapter.getStats();
    if (stats) {
      console.log('\n📊 Database Statistics:');
      console.log(`   Users: ${stats.users}`);
      console.log(`   Check-ins: ${stats.checkins}`);
      console.log(`   Insights: ${stats.insights}`);
    }

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n💡 You can now test with these accounts:');
    testUsers.forEach(user => {
      console.log(`   📧 ${user.email} (${user.nickname})`);
    });

  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedTestData; 