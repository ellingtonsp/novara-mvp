#!/usr/bin/env node

// Script to reset test user data in localStorage

const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node reset-test-user.js <email>');
  console.log('Example: node reset-test-user.js test@example.com');
  process.exit(1);
}

console.log(`Resetting test data for user: ${userEmail}`);

// List of localStorage keys to clear
const keysToReset = [
  `checkin_count_${userEmail}`,
  `first_checkin_${userEmail}`,
  `last_comprehensive_${userEmail}`,
  `checkin_preference_${userEmail}`,
  `last_checkin_${userEmail}`,
];

console.log('\nTo reset in browser console, run:');
console.log('```javascript');
keysToReset.forEach(key => {
  console.log(`localStorage.removeItem('${key}');`);
});
console.log('```');

console.log('\nOr run this one-liner:');
const oneLiner = keysToReset.map(key => `localStorage.removeItem('${key}')`).join('; ');
console.log(`\`\`\`javascript\n${oneLiner}\n\`\`\``);