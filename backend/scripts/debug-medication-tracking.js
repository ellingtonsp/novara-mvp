const Airtable = require('airtable');
require('dotenv').config();

// Debug script for medication tracking issue
async function debugMedicationTracking() {
  console.log('🔍 Debugging Medication Tracking\n');
  
  // Check environment
  console.log('1️⃣ Environment Check:');
  console.log('AIRTABLE_API_KEY present:', !!process.env.AIRTABLE_API_KEY);
  console.log('AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('');
  
  try {
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // 2. Check Airtable schema
    console.log('2️⃣ Checking Daily Check-ins Schema:');
    
    // Get one record to see fields
    const records = await base('daily_checkins')
      .select({ maxRecords: 1 })
      .firstPage();
    
    if (records.length > 0) {
      console.log('Available fields in daily_checkins:');
      console.log(Object.keys(records[0].fields));
      console.log('');
    }
    
    // 3. Find user
    console.log('3️⃣ Finding user monkey@gmail.com:');
    const userRecords = await base('users')
      .select({
        filterByFormula: `{email} = 'monkey@gmail.com'`,
        maxRecords: 1
      })
      .firstPage();
    
    if (userRecords.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const userId = userRecords[0].id;
    console.log('✅ Found user:', userId);
    console.log('');
    
    // 4. Get recent check-ins
    console.log('4️⃣ Recent check-ins for user:');
    const checkins = await base('daily_checkins')
      .select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 5,
        sort: [{ field: 'date_submitted', direction: 'desc' }]
      })
      .firstPage();
    
    console.log(`Found ${checkins.length} check-ins\n`);
    
    checkins.forEach((checkin, index) => {
      console.log(`Check-in ${index + 1}:`);
      console.log('  Date:', checkin.fields.date_submitted);
      console.log('  Mood:', checkin.fields.mood_today);
      console.log('  Confidence:', checkin.fields.confidence_today);
      console.log('  Medication Taken:', checkin.fields.medication_taken || 'FIELD NOT PRESENT');
      console.log('  Record ID:', checkin.id);
      console.log('');
    });
    
    // 5. Test creating a check-in with medication
    console.log('5️⃣ Testing check-in creation with medication:');
    
    const testData = {
      user_id: [userId],
      mood_today: 'debug-test',
      confidence_today: 5,
      date_submitted: new Date().toISOString().split('T')[0],
      medication_taken: 'yes',
      user_note: 'Debug test - can be deleted'
    };
    
    console.log('Attempting to create with data:', testData);
    
    try {
      const newRecord = await base('daily_checkins').create(testData);
      console.log('✅ Successfully created test record:', newRecord.id);
      console.log('Medication field saved as:', newRecord.fields.medication_taken);
      
      // Clean up test record
      await base('daily_checkins').destroy(newRecord.id);
      console.log('🧹 Cleaned up test record');
    } catch (error) {
      console.log('❌ Error creating test record:', error.message);
      if (error.statusCode === 422) {
        console.log('Field validation error - medication_taken might not exist in Airtable');
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the debug script
debugMedicationTracking();