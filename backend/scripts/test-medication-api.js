const fetch = require('node-fetch');

// Test medication tracking through the API
async function testMedicationAPI() {
  console.log('🔍 Testing Medication Tracking via API\n');
  
  const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
  
  try {
    // 1. Login as test user
    console.log('1️⃣ Logging in as monkey@gmail.com...');
    const loginResponse = await fetch(`${STAGING_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'monkey@gmail.com',
        password: 'password123' // Update with correct password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful\n');
    
    // 2. Get recent check-ins
    console.log('2️⃣ Fetching recent check-ins...');
    const checkinsResponse = await fetch(`${STAGING_URL}/api/checkins?limit=5`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const checkinsData = await checkinsResponse.json();
    
    if (checkinsResponse.ok && checkinsData.checkins) {
      console.log(`Found ${checkinsData.checkins.length} check-ins:\n`);
      
      checkinsData.checkins.forEach((checkin, index) => {
        console.log(`Check-in ${index + 1}:`);
        console.log('  Date:', checkin.date_submitted);
        console.log('  Mood:', checkin.mood_today);
        console.log('  Medication:', checkin.medication_taken || 'NOT PRESENT');
        console.log('  All fields:', Object.keys(checkin));
        console.log('');
      });
    }
    
    // 3. Test submitting a check-in with medication
    console.log('3️⃣ Testing check-in submission with medication...');
    
    const testCheckin = {
      mood_today: 'hopeful',
      confidence_today: 7,
      medication_taken: 'yes',
      user_note: 'API debug test with medication',
      date_submitted: new Date().toISOString().split('T')[0]
    };
    
    console.log('Submitting:', testCheckin);
    
    const submitResponse = await fetch(`${STAGING_URL}/api/checkins`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCheckin)
    });
    
    const submitData = await submitResponse.json();
    
    if (submitResponse.ok) {
      console.log('✅ Check-in submitted successfully');
      console.log('Response:', submitData);
      
      // 4. Verify it was saved
      console.log('\n4️⃣ Verifying saved data...');
      const verifyResponse = await fetch(`${STAGING_URL}/api/checkins?limit=1`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const verifyData = await verifyResponse.json();
      if (verifyData.checkins && verifyData.checkins.length > 0) {
        const latest = verifyData.checkins[0];
        console.log('Latest check-in:');
        console.log('  Medication field:', latest.medication_taken || 'NOT SAVED');
        console.log('  All fields:', Object.keys(latest));
      }
    } else {
      console.log('❌ Check-in submission failed:', submitData.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testMedicationAPI();