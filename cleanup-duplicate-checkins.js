#!/usr/bin/env node

/**
 * Script to clean up duplicate check-ins in staging environment
 * This will remove duplicate check-ins for the same date, keeping only the most recent one
 */

const https = require('https');

const STAGING_BACKEND = 'https://novara-staging-staging.up.railway.app';
const TEST_EMAIL = 'monkey@gmail.com';

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function cleanupDuplicateCheckins() {
  console.log('🧹 Cleaning up duplicate check-ins in staging');
  console.log('============================================\n');

  try {
    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await makeRequest(`${STAGING_BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    if (loginResponse.status !== 200) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log(`✅ Login successful for ${TEST_EMAIL}\n`);

    // 2. Get all check-ins
    console.log('2️⃣ Fetching all check-ins...');
    const checkinsResponse = await makeRequest(`${STAGING_BACKEND}/api/checkins?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkinsResponse.status !== 200) {
      console.log(`❌ Failed to fetch check-ins: ${checkinsResponse.status}`);
      return;
    }
    
    const checkins = checkinsResponse.data.checkins;
    console.log(`✅ Found ${checkins.length} total check-ins\n`);

    // 3. Group check-ins by date
    const checkinsByDate = {};
    checkins.forEach(checkin => {
      const date = checkin.date_submitted;
      if (!checkinsByDate[date]) {
        checkinsByDate[date] = [];
      }
      checkinsByDate[date].push(checkin);
    });

    // 4. Identify duplicates
    const duplicates = [];
    Object.entries(checkinsByDate).forEach(([date, dateCheckins]) => {
      if (dateCheckins.length > 1) {
        console.log(`📅 ${date}: ${dateCheckins.length} check-ins (DUPLICATES)`);
        // Sort by creation time (newest first) and keep only the first one
        const sortedCheckins = dateCheckins.sort((a, b) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA; // Newest first
        });
        
        // Keep the first (newest) one, mark the rest for deletion
        const toKeep = sortedCheckins[0];
        const toDelete = sortedCheckins.slice(1);
        
        console.log(`   ✅ Keeping: ${toKeep.id} (${toKeep.mood_today}, confidence: ${toKeep.confidence_today})`);
        toDelete.forEach(checkin => {
          console.log(`   🗑️  Deleting: ${checkin.id} (${checkin.mood_today}, confidence: ${checkin.confidence_today})`);
          duplicates.push(checkin);
        });
      } else {
        console.log(`📅 ${date}: ${dateCheckins.length} check-in (OK)`);
      }
    });

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate check-ins found!');
      return;
    }

    console.log(`\n🗑️  Found ${duplicates.length} duplicate check-ins to delete`);

    // 5. Delete duplicates (Note: This would require backend delete endpoint)
    console.log('\n⚠️  NOTE: Backend delete endpoint not implemented yet.');
    console.log('   To implement cleanup, you would need to:');
    console.log('   1. Add DELETE /api/checkins/:id endpoint to backend');
    console.log('   2. Call the endpoint for each duplicate check-in');
    console.log('   3. Or manually delete from Airtable staging base');
    
    console.log('\n📋 Duplicate check-ins to delete:');
    duplicates.forEach((checkin, index) => {
      console.log(`   ${index + 1}. ID: ${checkin.id}`);
      console.log(`      Date: ${checkin.date_submitted}`);
      console.log(`      Mood: ${checkin.mood_today}`);
      console.log(`      Confidence: ${checkin.confidence_today}`);
      console.log('');
    });

    console.log('🎯 RECOMMENDATIONS:');
    console.log('1. The duplicate prevention code has been added to prevent future duplicates');
    console.log('2. For existing duplicates, manually delete from Airtable staging base');
    console.log('3. Test the new duplicate prevention by trying to submit another check-in today');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Run the cleanup
cleanupDuplicateCheckins(); 