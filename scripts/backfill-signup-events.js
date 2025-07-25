#!/usr/bin/env node

/**
 * AN-01 Event Tracking Backfill Script
 * Adds signup events for existing pilot users (≤250 records)
 * 
 * Usage: node scripts/backfill-signup-events.js
 */

const { Airtable } = require('airtable');
require('dotenv').config({ path: '../backend/.env' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || process.env.VITE_POSTHOG_API_KEY;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing required environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID');
  process.exit(1);
}

const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY });
const base = airtable.base(AIRTABLE_BASE_ID);

// PostHog server-side client
const { PostHog } = require('posthog-node');
const posthog = new PostHog(POSTHOG_API_KEY, {
  host: 'https://app.posthog.com'
});

async function backfillSignupEvents() {
  console.log('🔄 Starting signup event backfill for existing users...');
  
  try {
    // Fetch all users from Airtable
    console.log('📊 Fetching users from Airtable...');
    const users = await base('Users').select({
      maxRecords: 250, // Limit to 250 as per requirements
      fields: ['id', 'email', 'nickname', 'created_at', 'signup_method']
    }).all();

    console.log(`📈 Found ${users.length} users to backfill`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const userData = user.fields;
        
        // Skip if user already has signup event (check in PostHog)
        // For now, we'll backfill all users and PostHog will deduplicate
        
        const signupEvent = {
          event: 'signup',
          distinctId: userData.id,
          properties: {
            user_id: userData.id,
            signup_method: userData.signup_method || 'email',
            referrer: 'backfill_script',
            environment: 'production',
            timestamp: userData.created_at || new Date().toISOString(),
            backfill: true
          }
        };

        // Send to PostHog
        await posthog.capture(signupEvent);
        
        console.log(`✅ Backfilled signup event for user: ${userData.email}`);
        successCount++;
        
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to backfill user ${user.fields.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`✅ Successfully backfilled: ${successCount} users`);
    console.log(`❌ Failed to backfill: ${errorCount} users`);
    console.log(`📈 Total processed: ${users.length} users`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to backfill. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Backfill script failed:', error);
    process.exit(1);
  } finally {
    // Shutdown PostHog client
    await posthog.shutdown();
  }
}

// Run the backfill
if (require.main === module) {
  backfillSignupEvents()
    .then(() => {
      console.log('🎉 Backfill script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backfill script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillSignupEvents }; 