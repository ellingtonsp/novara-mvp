#!/usr/bin/env node

/**
 * Quick test to verify rejected values are no longer in frontend
 */

const fs = require('fs');
const path = require('path');

const rejectedValues = [
  'retrieval',
  'egg_retrieval',
  'tww',
  'pregnant',
  'between_cycles'
];

function checkForRejectedValues() {
  console.log('🔍 Checking for rejected Airtable field values...\n');
  
  const frontendSrc = path.join(__dirname, '../frontend/src');
  const frontendDist = path.join(__dirname, '../frontend/dist');
  
  let foundRejected = false;
  
  // Check source files
  console.log('📁 Checking source files...');
  rejectedValues.forEach(value => {
    const grep = require('child_process').execSync(`grep -r "${value}" ${frontendSrc}`, { encoding: 'utf8', stdio: 'pipe' }).catch(() => '');
    if (grep && grep.trim()) {
      console.log(`❌ Found "${value}" in source files`);
      foundRejected = true;
    } else {
      console.log(`✅ "${value}" not found in source files`);
    }
  });
  
  // Check built files
  console.log('\n📁 Checking built files...');
  rejectedValues.forEach(value => {
    const grep = require('child_process').execSync(`grep -r "${value}" ${frontendDist}`, { encoding: 'utf8', stdio: 'pipe' }).catch(() => '');
    if (grep && grep.trim()) {
      console.log(`❌ Found "${value}" in built files`);
      foundRejected = true;
    } else {
      console.log(`✅ "${value}" not found in built files`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  if (foundRejected) {
    console.log('❌ Rejected values found! Please clean up the code.');
    process.exit(1);
  } else {
    console.log('🎉 All rejected values have been removed!');
    console.log('✅ Frontend is ready for deployment.');
  }
}

checkForRejectedValues(); 