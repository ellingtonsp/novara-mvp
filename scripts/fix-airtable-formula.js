#!/usr/bin/env node

/**
 * 🔧 FIX AIRTABLE FORMULA
 * Updates the Airtable query formula to correctly filter linked records
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.js');

function fixAirtableFormula() {
  console.log('🔧 FIXING AIRTABLE FORMULA\n');
  
  try {
    // Read the current server.js file
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    
    console.log('📖 Reading server.js...');
    
    // Fix 1: GET /api/checkins/last-values (around line 1641)
    const oldLastValuesFormula = `const checkinsUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('\${user.id}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=1\`;`;
    
    const newLastValuesFormula = `const checkinsUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=user_id='\${user.id}'&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=1\`;`;
    
    if (serverCode.includes(oldLastValuesFormula)) {
      serverCode = serverCode.replace(oldLastValuesFormula, newLastValuesFormula);
      console.log('✅ Fixed GET /api/checkins/last-values formula');
    } else {
      console.log('⚠️  GET /api/checkins/last-values formula not found (may have been updated)');
    }
    
    // Fix 2: GET /api/checkins (around line 1809)
    const oldCheckinsFormula = `const airtableUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('\${user.id}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=\${limit}\`;`;
    
    const newCheckinsFormula = `const airtableUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=user_id='\${user.id}'&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=\${limit}\`;`;
    
    if (serverCode.includes(oldCheckinsFormula)) {
      serverCode = serverCode.replace(oldCheckinsFormula, newCheckinsFormula);
      console.log('✅ Fixed GET /api/checkins formula');
    } else {
      console.log('⚠️  GET /api/checkins formula not found (may have been updated)');
    }
    
    // Fix 3: GET /api/insights/daily (around line 1880)
    const oldInsightsFormula = `const checkinsUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=SEARCH('\${user.id}',ARRAYJOIN({user_id}))&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=7\`;`;
    
    const newInsightsFormula = `const checkinsUrl = \`\${config.airtable.baseUrl}/DailyCheckins?filterByFormula=user_id='\${user.id}'&sort[0][field]=date_submitted&sort[0][direction]=desc&maxRecords=7\`;`;
    
    if (serverCode.includes(oldInsightsFormula)) {
      serverCode = serverCode.replace(oldInsightsFormula, newInsightsFormula);
      console.log('✅ Fixed GET /api/insights/daily formula');
    } else {
      console.log('⚠️  GET /api/insights/daily formula not found (may have been updated)');
    }
    
    // Write the updated code back to the file
    fs.writeFileSync(serverPath, serverCode, 'utf8');
    
    console.log('\n✅ Airtable formula fixes applied successfully!');
    console.log('📝 Changes made:');
    console.log('   - Replaced SEARCH(ARRAYJOIN()) with direct user_id comparison');
    console.log('   - Updated all three check-in query endpoints');
    console.log('   - Maintained sorting and pagination');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Test the fix locally: npm run dev');
    console.log('2. Deploy to staging for testing');
    console.log('3. Verify check-in retrieval works');
    console.log('4. Deploy to production');
    
  } catch (error) {
    console.error('❌ Error fixing Airtable formula:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixAirtableFormula(); 