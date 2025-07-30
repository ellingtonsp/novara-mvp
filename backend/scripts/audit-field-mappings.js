#!/usr/bin/env node

/**
 * Field Mapping Audit Script
 * 
 * This script audits all frontend input fields and verifies they have:
 * 1. Backend endpoint handling
 * 2. Database schema (SQLite and Airtable)
 * 3. Proper whitelisting in PRODUCTION_AIRTABLE_SCHEMA
 * 
 * Prevents silent field dropping issues like the medication_taken problem
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Field Mapping Audit\n');

// Step 1: Extract all fields from frontend forms
console.log('1️⃣ Scanning frontend forms for input fields...\n');

const frontendFields = new Map();

// Function to extract fields from TypeScript/React files
function extractFieldsFromFile(filePath, componentName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fields = [];
  
  // Look for state variables that represent form fields
  const stateMatches = content.matchAll(/const\s+\[(\w+),\s+set\w+\]\s*=\s*useState/g);
  for (const match of stateMatches) {
    const fieldName = match[1];
    // Filter out UI state variables
    if (!['isSubmitting', 'showCompletion', 'currentStep', 'isLoading', 'error', 'startTime'].includes(fieldName)) {
      fields.push(fieldName);
    }
  }
  
  // Look for fields being sent to API
  const apiFieldMatches = content.matchAll(/(\w+):\s*(?:selectedMood|confidence|tookMedications|userNote|anxietyLevel|sideEffects|copingStrategies|partnerInvolved|infoNeeds|injectionConfidence|missedDoses|hasAppointment|appointmentAnxiety)/g);
  for (const match of apiFieldMatches) {
    const fieldName = match[1];
    if (!fields.includes(fieldName)) {
      fields.push(fieldName);
    }
  }
  
  // Look for object property assignments in API calls
  const objectMatches = content.matchAll(/const\s+(?:checkinData|enhancedData|formData)\s*=\s*{([^}]+)}/gs);
  for (const match of objectMatches) {
    const objectContent = match[1];
    const propMatches = objectContent.matchAll(/(\w+):\s*[^,\n]+/g);
    for (const propMatch of propMatches) {
      const fieldName = propMatch[1];
      if (!fields.includes(fieldName) && !['headers', 'method', 'body'].includes(fieldName)) {
        fields.push(fieldName);
      }
    }
  }
  
  frontendFields.set(componentName, fields);
  return fields;
}

// Scan key form components
const formComponents = [
  {
    path: path.join(__dirname, '../../frontend/src/components/QuickDailyCheckinForm.tsx'),
    name: 'QuickDailyCheckinForm'
  },
  {
    path: path.join(__dirname, '../../frontend/src/components/EnhancedDailyCheckinForm.tsx'),
    name: 'EnhancedDailyCheckinForm'
  }
];

const allFrontendFields = new Set();

formComponents.forEach(component => {
  if (fs.existsSync(component.path)) {
    const fields = extractFieldsFromFile(component.path, component.name);
    console.log(`📄 ${component.name}:`);
    console.log(`   Found ${fields.length} fields:`, fields.join(', '));
    console.log('');
    fields.forEach(f => allFrontendFields.add(f));
  }
});

// Step 2: Check backend schema whitelist
console.log('\n2️⃣ Checking PRODUCTION_AIRTABLE_SCHEMA whitelist...\n');

const serverPath = path.join(__dirname, '../server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// Extract PRODUCTION_AIRTABLE_SCHEMA
const schemaMatch = serverContent.match(/PRODUCTION_AIRTABLE_SCHEMA\s*=\s*{[\s\S]*?DailyCheckins:\s*\[([\s\S]*?)\]/);
const whitelistedFields = [];

if (schemaMatch) {
  const fieldsSection = schemaMatch[1];
  const fieldMatches = fieldsSection.matchAll(/'([^']+)'/g);
  for (const match of fieldMatches) {
    whitelistedFields.push(match[1]);
  }
}

console.log('📋 Whitelisted fields in PRODUCTION_AIRTABLE_SCHEMA:');
console.log(`   ${whitelistedFields.join(', ')}`);

// Step 3: Check SQLite schema
console.log('\n\n3️⃣ Checking SQLite schema...\n');

const sqlitePath = path.join(__dirname, '../database/sqlite-adapter.js');
const sqliteContent = fs.readFileSync(sqlitePath, 'utf8');

// Extract fields from CREATE TABLE and addColumnIfNotExists
const sqliteFields = new Set();

// From CREATE TABLE
const createTableMatch = sqliteContent.match(/CREATE TABLE IF NOT EXISTS daily_checkins\s*\(([\s\S]*?)\);/);
if (createTableMatch) {
  const tableContent = createTableMatch[1];
  const columnMatches = tableContent.matchAll(/(\w+)\s+(?:TEXT|INTEGER|REAL|DATE|DATETIME|BOOLEAN)/g);
  for (const match of columnMatches) {
    sqliteFields.add(match[1]);
  }
}

// From addColumnIfNotExists
const addColumnMatches = sqliteContent.matchAll(/addColumnIfNotExists\('daily_checkins',\s*'(\w+)'/g);
for (const match of addColumnMatches) {
  sqliteFields.add(match[1]);
}

console.log('🗄️ SQLite fields:');
console.log(`   ${Array.from(sqliteFields).join(', ')}`);

// Step 4: Field mapping analysis
console.log('\n\n4️⃣ Field Mapping Analysis\n');

// Map frontend field names to backend field names
const fieldMapping = {
  // Frontend -> Backend mapping
  'selectedMood': 'mood_today',
  'tookMedications': 'medication_taken',
  'confidence': 'confidence_today',
  'userNote': 'user_note',
  'anxietyLevel': 'anxiety_level',
  'sideEffects': 'side_effects',
  'copingStrategies': 'coping_strategies',
  'partnerInvolved': 'partner_involved',
  'infoNeeds': 'info_needs',
  'injectionConfidence': 'injection_confidence',
  'missedDoses': 'missed_doses',
  'hasAppointment': 'has_appointment',
  'appointmentAnxiety': 'appointment_anxiety',
  'date_submitted': 'date_submitted',
  'primary_concern_today': 'primary_concern_today'
};

// Check each frontend field
const issues = [];
const warnings = [];

console.log('🔍 Checking field mappings:\n');

allFrontendFields.forEach(frontendField => {
  const backendField = fieldMapping[frontendField] || frontendField;
  
  console.log(`Frontend: ${frontendField} → Backend: ${backendField}`);
  
  // Check if whitelisted
  const isWhitelisted = whitelistedFields.includes(backendField);
  const inSQLite = sqliteFields.has(backendField);
  
  console.log(`   ✓ Whitelisted: ${isWhitelisted ? '✅' : '❌'}`);
  console.log(`   ✓ In SQLite: ${inSQLite ? '✅' : '❌'}`);
  
  if (!isWhitelisted && !['isQuickCheckin', 'checkinTime', 'localDate'].includes(frontendField)) {
    issues.push(`❌ Field '${backendField}' (from ${frontendField}) is NOT in PRODUCTION_AIRTABLE_SCHEMA whitelist`);
  }
  
  if (!inSQLite && !['isQuickCheckin', 'checkinTime', 'localDate'].includes(frontendField)) {
    issues.push(`❌ Field '${backendField}' (from ${frontendField}) is NOT in SQLite schema`);
  }
  
  console.log('');
});

// Step 5: Check for fields in backend but not used in frontend
console.log('5️⃣ Checking for unused backend fields...\n');

const backendOnlyFields = whitelistedFields.filter(field => {
  const frontendEquivalent = Object.entries(fieldMapping).find(([k, v]) => v === field)?.[0];
  return !frontendEquivalent && !allFrontendFields.has(field) && 
         !['id', 'user_id', 'created_at'].includes(field);
});

if (backendOnlyFields.length > 0) {
  console.log('⚠️  Backend fields not used in frontend forms:');
  backendOnlyFields.forEach(field => {
    warnings.push(`   - ${field}`);
    console.log(`   - ${field}`);
  });
}

// Step 6: Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('\n✅ All frontend fields have proper backend mappings!');
} else {
  console.log('\n❌ ISSUES FOUND:\n');
  issues.forEach(issue => console.log(issue));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log(warning));
}

// Step 7: Recommendations
console.log('\n\n💡 RECOMMENDATIONS:\n');
console.log('1. Add missing fields to PRODUCTION_AIRTABLE_SCHEMA in server.js');
console.log('2. Add missing fields to SQLite schema in sqlite-adapter.js');
console.log('3. Ensure Airtable has all fields created in both staging and production');
console.log('4. Run pre-deployment-check.js before each deployment');
console.log('5. Consider adding this audit to your CI/CD pipeline');

// Exit with error code if issues found
if (issues.length > 0) {
  console.log('\n❌ Audit failed with', issues.length, 'issues');
  process.exit(1);
} else {
  console.log('\n✅ Audit passed!');
  process.exit(0);
}