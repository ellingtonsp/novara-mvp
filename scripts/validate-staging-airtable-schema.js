#!/usr/bin/env node

// Staging Airtable Schema Validation for CM-01 Medication Status
const axios = require('axios');

const STAGING_CONFIG = {
  baseId: 'appEOWvLjCn5c7Ght',
  apiKey: 'patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7',  // from Railway staging vars
  baseUrl: 'https://api.airtable.com/v0'
};

const REQUIRED_MEDICATION_FIELDS = [
  {
    name: 'medication_status',
    type: 'singleSelect',
    options: ['taking', 'starting_soon', 'between_cycles', 'not_applicable']
  },
  {
    name: 'medication_status_updated',
    type: 'dateTime'
  }
];

async function validateStagingSchema() {
  console.log('🔍 Validating Staging Airtable Schema for CM-01 Medication Status');
  console.log('================================================================');
  console.log(`📊 Base ID: ${STAGING_CONFIG.baseId}`);
  console.log(`🌐 Environment: staging`);

  try {
    // Get Users table schema
    const response = await axios.get(`${STAGING_CONFIG.baseUrl}/meta/bases/${STAGING_CONFIG.baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${STAGING_CONFIG.apiKey}`
      }
    });

    const data = response.data;
    const usersTable = data.tables.find(table => table.name === 'Users');
    
    if (!usersTable) {
      console.log('❌ ERROR: Users table not found in staging Airtable base');
      return false;
    }

    console.log(`\n✅ Found Users table with ${usersTable.fields.length} fields`);
    console.log('\n📋 Current Users Table Fields:');
    
    const existingFields = usersTable.fields.map(field => ({
      name: field.name,
      type: field.type
    }));

    existingFields.forEach(field => {
      console.log(`   • ${field.name} (${field.type})`);
    });

    // Check for missing medication status fields
    console.log('\n🧪 Checking for CM-01 Medication Status Fields:');
    const missingFields = [];

    for (const requiredField of REQUIRED_MEDICATION_FIELDS) {
      const existingField = existingFields.find(f => f.name === requiredField.name);
      
      if (!existingField) {
        console.log(`   ❌ MISSING: ${requiredField.name} (${requiredField.type})`);
        missingFields.push(requiredField);
      } else {
        console.log(`   ✅ EXISTS: ${requiredField.name} (${existingField.type})`);
      }
    }

    if (missingFields.length > 0) {
      console.log('\n🚨 SCHEMA ISSUE FOUND:');
      console.log(`   ${missingFields.length} required fields are missing from staging Users table`);
      console.log('\n📝 Required Fields to Add:');
      
      missingFields.forEach(field => {
        console.log(`\n   Field: ${field.name}`);
        console.log(`   Type: ${field.type}`);
        if (field.options) {
          console.log(`   Options: ${field.options.join(', ')}`);
        }
      });

      console.log('\n🛠️  Manual Action Required:');
      console.log('   1. Go to Airtable staging base: https://airtable.com/base/appEOWvLjCn5c7Ght');
      console.log('   2. Open Users table');
      console.log('   3. Add the missing fields as shown above');
      console.log('   4. Re-run this validation script');
      
      return false;
    } else {
      console.log('\n🎉 SUCCESS: All required medication status fields exist in staging!');
      console.log('   Staging Airtable schema is ready for CM-01 deployment');
      return true;
    }

  } catch (error) {
    console.error('❌ Error validating staging schema:', error.response?.data || error.message);
    return false;
  }
}

async function testMedicationStatusCompatibility() {
  console.log('\n🧪 Testing Medication Status API Compatibility');
  console.log('===============================================');

  try {
    // Test a user creation with medication status
    const testUserData = {
      fields: {
        email: `test-staging-schema-${Date.now()}@example.com`,
        nickname: 'SchemaTest',
        confidence_meds: 5,
        confidence_costs: 7,
        confidence_overall: 6,
        primary_need: 'medication_guidance',
        cycle_stage: 'ivf_prep',
        medication_status: 'taking',
        medication_status_updated: new Date().toISOString()
      }
    };

    const createResponse = await axios.post(`${STAGING_CONFIG.baseUrl}/${STAGING_CONFIG.baseId}/Users`, testUserData, {
      headers: {
        'Authorization': `Bearer ${STAGING_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.status === 200 || createResponse.status === 201) {
      const userData = createResponse.data;
      console.log('✅ Schema compatibility test PASSED');
      console.log(`   Created test user: ${userData.id}`);
      
      // Clean up test user
      await axios.delete(`${STAGING_CONFIG.baseUrl}/${STAGING_CONFIG.baseId}/Users/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${STAGING_CONFIG.apiKey}`
        }
      });
      console.log('🧹 Cleaned up test user');
      
      return true;
    } else {
      console.log('❌ Schema compatibility test FAILED');
      console.log(`   Error: ${createResponse.status} ${createResponse.statusText}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing compatibility:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  const schemaValid = await validateStagingSchema();
  
  if (schemaValid) {
    const compatibilityTest = await testMedicationStatusCompatibility();
    
    if (compatibilityTest) {
      console.log('\n🎉 STAGING SCHEMA VALIDATION COMPLETE');
      console.log('====================================');
      console.log('✅ All required fields exist');
      console.log('✅ API compatibility confirmed');
      console.log('✅ Ready for CM-01 staging deployment');
      process.exit(0);
    } else {
      console.log('\n❌ COMPATIBILITY TEST FAILED');
      process.exit(1);
    }
  } else {
    console.log('\n❌ SCHEMA VALIDATION FAILED');
    console.log('   Please add the missing fields to staging Airtable base');
    process.exit(1);
  }
}

main(); 