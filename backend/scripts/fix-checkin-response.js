#!/usr/bin/env node

/**
 * Fix check-in response handling in server.js
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix the response construction to handle missing fields
const fixedResponse = `
    // Return success response with the created record
    const responseData = {
      success: true,
      checkin: {
        id: result.id,
        mood_today: result.fields?.mood_today || filteredCheckinData.mood_today,
        confidence_today: result.fields?.confidence_today || filteredCheckinData.confidence_today,
        date_submitted: result.fields?.date_submitted || filteredCheckinData.date_submitted,
        medication_taken: result.fields?.medication_taken || filteredCheckinData.medication_taken,
        created_at: result.fields?.created_at || new Date().toISOString()
      },
      message: sentiment_analysis?.sentiment === 'positive' 
        ? 'Daily check-in completed successfully! We love your positive energy today! 🎉' 
        : 'Daily check-in completed successfully! 🌟'
    };`;

// Replace the problematic section
serverContent = serverContent.replace(
  /\/\/ Return success response with the created record[\s\S]*?message: sentiment_analysis\?\.sentiment === 'positive'/,
  fixedResponse.trim().split('\n').slice(0, -1).join('\n') + "\n      message: sentiment_analysis?.sentiment === 'positive'"
);

fs.writeFileSync(serverPath, serverContent);

console.log('✅ Fixed check-in response handling in server.js');
console.log('📝 Changes:');
console.log('  - Added optional chaining for result.fields');
console.log('  - Added fallback values from original data');
console.log('  - Prevents "Cannot read properties of undefined" errors');