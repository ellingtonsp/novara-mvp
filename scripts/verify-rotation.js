#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

console.log('🔍 Verifying credential rotation...\n');

// Check if old password is still in any files
const { execSync } = require('child_process');
try {
  const result = execSync('grep -r "ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null || true', { encoding: 'utf8' });
  if (result.trim()) {
    console.log('❌ WARNING: Old password still found in files:');
    console.log(result);
    console.log('\nPlease remove these references!\n');
  } else {
    console.log('✅ Old password not found in codebase\n');
  }
} catch (error) {
  console.log('✅ Old password not found in codebase\n');
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not set in .env file');
  console.log('Please add: DATABASE_URL="your-new-connection-string"\n');
  process.exit(1);
}

// Check if it's the old password
if (process.env.DATABASE_URL.includes('ynFbXBtKHWNRFwnuGbRvaYFdSXcBckVR')) {
  console.log('❌ CRITICAL: .env still contains the OLD exposed password!');
  console.log('You must update it with the new password from Railway\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set and does not contain old password\n');

// Test database connection
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`   Connected at: ${result.rows[0].now}\n`);
    await client.end();
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log(`   Error: ${error.message}\n`);
    console.log('Make sure you have:');
    console.log('1. Rotated the password in Railway');
    console.log('2. Updated your .env file with the new DATABASE_URL');
    console.log('3. Restarted your local development server\n');
    process.exit(1);
  }
}

testConnection().then(() => {
  console.log('📋 Next steps:');
  console.log('1. Push your changes to staging branch');
  console.log('2. Verify Railway redeploys successfully');
  console.log('3. Run: npm run test:smoke -- --env=staging');
  console.log('4. Check GitGuardian to confirm alert is resolved\n');
  
  console.log('🔒 Security checklist:');
  console.log('[ ] Password rotated in Railway');
  console.log('[ ] Local .env updated');
  console.log('[ ] No old password in codebase');
  console.log('[ ] Database connection working');
  console.log('[ ] Staging deployed and tested');
  console.log('[ ] GitGuardian alert resolved');
});