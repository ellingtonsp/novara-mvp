const fetch = require('node-fetch');

// Comprehensive medication tracking test
async function testMedicationComplete() {
  console.log('🔍 Comprehensive Medication Tracking Test\n');
  
  const STAGING_URL = 'https://novara-staging-staging.up.railway.app';
  const TEST_USER = {
    email: 'monkey@gmail.com',
    password: 'password' // Common test password
  };
  
  try {
    // 1. Wait for service to be ready
    console.log('⏳ Checking if service is ready...');
    let serviceReady = false;
    for (let i = 0; i < 5; i++) {
      try {
        const health = await fetch(`${STAGING_URL}/api/health`);
        if (health.ok) {
          const data = await health.json();
          console.log('✅ Service is ready:', data);
          serviceReady = true;
          break;
        }
      } catch (e) {
        console.log(`   Attempt ${i + 1}/5 failed, waiting 10s...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (!serviceReady) {
      console.log('❌ Service not ready after 50 seconds');
      return;
    }
    
    // 2. Login
    console.log('\n1️⃣ Logging in as monkey@gmail.com...');
    const loginResponse = await fetch(`${STAGING_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginResponse.ok) {
      const text = await loginResponse.text();
      console.log('❌ Login failed:', text);
      console.log('   Status:', loginResponse.status);
      console.log('   Headers:', loginResponse.headers.raw());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('   User ID:', loginData.user?.id);
    
    // 3. Check recent check-ins
    console.log('\n2️⃣ Fetching recent check-ins...');
    const checkinsResponse = await fetch(`${STAGING_URL}/api/checkins?limit=10`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!checkinsResponse.ok) {
      console.log('❌ Failed to fetch check-ins:', checkinsResponse.status);
      return;
    }
    
    const checkinsData = await checkinsResponse.json();
    console.log(`✅ Found ${checkinsData.checkins?.length || 0} check-ins`);
    
    // Show medication field for each
    if (checkinsData.checkins && checkinsData.checkins.length > 0) {
      console.log('\n📋 Medication tracking status:');
      checkinsData.checkins.forEach((checkin, i) => {
        console.log(`   ${i + 1}. Date: ${checkin.date_submitted}`);
        console.log(`      Medication: ${checkin.medication_taken || '❌ NOT PRESENT'}`);
        console.log(`      Mood: ${checkin.mood_today}`);
        console.log(`      Fields: ${Object.keys(checkin).join(', ')}`);
        console.log('');
      });
    }
    
    // 4. Submit a test check-in with medication
    console.log('3️⃣ Submitting test check-in WITH medication tracking...');
    const today = new Date().toISOString().split('T')[0];
    
    const testCheckin = {
      mood_today: 'hopeful',
      confidence_today: 8,
      medication_taken: 'yes',
      user_note: 'Test check-in with medication tracking',
      date_submitted: today
    };
    
    console.log('   Payload:', JSON.stringify(testCheckin, null, 2));
    
    const submitResponse = await fetch(`${STAGING_URL}/api/checkins`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCheckin)
    });
    
    const submitData = await submitResponse.json();
    
    if (!submitResponse.ok) {
      console.log('❌ Submission failed:', submitData);
      return;
    }
    
    console.log('✅ Check-in submitted successfully');
    console.log('   Response:', submitData);
    
    // 5. Verify it was saved
    console.log('\n4️⃣ Verifying medication field was saved...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    
    const verifyResponse = await fetch(`${STAGING_URL}/api/checkins?limit=1`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyData.checkins && verifyData.checkins.length > 0) {
      const latest = verifyData.checkins[0];
      console.log('✅ Latest check-in retrieved:');
      console.log('   Date:', latest.date_submitted);
      console.log('   Medication field:', latest.medication_taken || '❌ NOT SAVED');
      console.log('   User note:', latest.user_note);
      
      if (latest.medication_taken === 'yes') {
        console.log('\n🎉 SUCCESS: Medication tracking is working!');
      } else {
        console.log('\n❌ FAILURE: Medication field not saved properly');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
console.log('🚀 Starting test...\n');
console.log('ℹ️  Note: Update the password for monkey@gmail.com before running\n');
testMedicationComplete();