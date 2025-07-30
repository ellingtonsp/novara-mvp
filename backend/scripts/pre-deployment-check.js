#!/usr/bin/env node

// Pre-deployment checklist automation
// Run this before deploying to catch common issues

const fs = require('fs');
const path = require('path');

console.log('🚀 Running Pre-Deployment Checks...\n');

let errors = 0;
let warnings = 0;

// 1. Check for duplicate variable declarations
console.log('1️⃣ Checking for duplicate const/let declarations...');
try {
  const serverFile = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const lines = serverFile.split('\n');
  const declarations = new Map();
  
  // Only check for duplicates in the same scope (simplified check)
  let scopeLevel = 0;
  const scopeDeclarations = new Map();
  
  lines.forEach((line, index) => {
    // Track scope changes
    scopeLevel += (line.match(/{/g) || []).length;
    scopeLevel -= (line.match(/}/g) || []).length;
    
    const match = line.match(/^\s*(const|let)\s+(\w+)\s*=/);
    if (match) {
      const varName = match[2];
      const scopeKey = `${varName}-${scopeLevel}`;
      
      // Only flag if it's a duplicate in the same file at the top level
      if (scopeLevel === 0 && declarations.has(varName)) {
        console.error(`❌ Duplicate top-level declaration of '${varName}' on line ${index + 1}`);
        errors++;
      } else if (scopeLevel === 0) {
        declarations.set(varName, index);
      }
    }
  });
  
  if (errors === 0) {
    console.log('✅ No duplicate declarations found');
  }
} catch (error) {
  console.error('❌ Error checking duplicates:', error.message);
  errors++;
}

// 2. Check for syntax errors
console.log('\n2️⃣ Checking for syntax errors...');
const { execSync } = require('child_process');
try {
  execSync('node -c server.js', { cwd: path.join(__dirname, '..') });
  console.log('✅ No syntax errors found');
} catch (error) {
  console.error('❌ Syntax error found!');
  console.error(error.stdout.toString());
  errors++;
}

// 3. Check for missing environment variables
console.log('\n3️⃣ Checking for required environment variables...');
const requiredEnvVars = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'JWT_SECRET',
  'PORT'
];

const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  requiredEnvVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      console.warn(`⚠️  Missing environment variable: ${varName}`);
      warnings++;
    }
  });
  
  if (warnings === 0) {
    console.log('✅ All required environment variables present');
  }
} else {
  console.warn('⚠️  No .env file found');
  warnings++;
}

// 4. Check Airtable schema consistency
console.log('\n4️⃣ Checking Airtable schema whitelist...');
try {
  const serverFile = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const schemaMatch = serverFile.match(/PRODUCTION_AIRTABLE_SCHEMA\s*=\s*{[\s\S]*?DailyCheckins:\s*\[([\s\S]*?)\]/);
  
  if (schemaMatch) {
    const fields = schemaMatch[1].match(/'([^']+)'/g) || [];
    const fieldList = fields.map(f => f.replace(/'/g, ''));
    
    console.log(`📋 Found ${fieldList.length} whitelisted fields:`);
    console.log(`   ${fieldList.join(', ')}`);
    
    // Check for common fields that should be present
    const requiredFields = ['user_id', 'mood_today', 'confidence_today', 'date_submitted'];
    requiredFields.forEach(field => {
      if (!fieldList.includes(field)) {
        console.error(`❌ Missing required field in schema: ${field}`);
        errors++;
      }
    });
    
    // Check for medication_taken
    if (!fieldList.includes('medication_taken')) {
      console.warn('⚠️  medication_taken field not in schema whitelist');
      warnings++;
    }
  } else {
    console.error('❌ Could not find PRODUCTION_AIRTABLE_SCHEMA');
    errors++;
  }
} catch (error) {
  console.error('❌ Error checking schema:', error.message);
  errors++;
}

// 5. Check for console.logs that might leak sensitive data
console.log('\n5️⃣ Checking for potential sensitive data leaks...');
try {
  const serverFile = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const lines = serverFile.split('\n');
  
  const sensitivePatterns = [
    /console\.log.*password/i,
    /console\.log.*token.*user/i,
    /console\.log.*api.*key/i,
    /console\.log.*secret/i
  ];
  
  lines.forEach((line, index) => {
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(line)) {
        console.warn(`⚠️  Potential sensitive data log on line ${index + 1}: ${line.trim()}`);
        warnings++;
      }
    });
  });
  
  if (warnings === 0) {
    console.log('✅ No obvious sensitive data leaks found');
  }
} catch (error) {
  console.error('❌ Error checking logs:', error.message);
  errors++;
}

// 6. Check Railway URLs
console.log('\n6️⃣ Checking Railway URL configuration...');
try {
  const envFile = fs.readFileSync(path.join(__dirname, '../../frontend/src/lib/environment.ts'), 'utf8');
  
  if (envFile.includes('novara-staging-staging.up.railway.app')) {
    console.log('✅ Staging URL correctly set to: novara-staging-staging.up.railway.app');
  } else if (envFile.includes('novara-staging.up.railway.app')) {
    console.warn('⚠️  Staging URL might be incorrect (single staging)');
    warnings++;
  }
  
  if (envFile.includes('novara-mvp-production.up.railway.app')) {
    console.log('✅ Production URL correctly set');
  }
} catch (error) {
  console.warn('⚠️  Could not check frontend URLs:', error.message);
  warnings++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 PRE-DEPLOYMENT CHECK SUMMARY');
console.log('='.repeat(50));
console.log(`Errors: ${errors} ${errors === 0 ? '✅' : '❌'}`);
console.log(`Warnings: ${warnings} ${warnings === 0 ? '✅' : '⚠️'}`);

if (errors > 0) {
  console.log('\n❌ DEPLOYMENT BLOCKED: Fix errors before deploying');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  DEPLOYMENT ALLOWED: But consider fixing warnings');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED: Ready to deploy!');
  process.exit(0);
}