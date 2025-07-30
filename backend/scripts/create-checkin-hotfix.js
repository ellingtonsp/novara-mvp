#!/usr/bin/env node

/**
 * Create a hotfix for check-in submission
 * This will update the server.js to handle the error more gracefully
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Find the check-in endpoint and add better error handling
const updatedContent = serverContent.replace(
  /console\.log\('✅ Found user record:', userRecordId\.id\);/,
  `console.log('✅ Found user record:', userRecordId.id);
    
    // HOTFIX: Ensure user object has required fields for compatibility
    const user = userRecordId;
    if (!user.id) {
      console.error('❌ User object missing ID');
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: 'User object structure invalid'
      });
    }`
);

// Also add a try-catch around the entire check-in creation
const finalContent = updatedContent.replace(
  /const result = await airtableRequest\('DailyCheckins', 'POST', {/,
  `try {
    console.log('📤 Sending check-in data to database adapter');
    const result = await airtableRequest('DailyCheckins', 'POST', {`
).replace(
  /console\.log\('✅ Daily check-in saved successfully:', result\.id\);/,
  `console.log('✅ Daily check-in saved successfully:', result.id);
    } catch (dbError) {
      console.error('❌ Database error during check-in creation:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: dbError.message
      });
    }`
);

fs.writeFileSync(serverPath, finalContent);

console.log('✅ Hotfix applied to server.js');
console.log('📝 Changes:');
console.log('  - Added user object validation');
console.log('  - Added try-catch around database operations');
console.log('  - Improved error messages for debugging');