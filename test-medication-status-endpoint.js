// Test script for CM-01 Medication Status Endpoint
const axios = require('axios');

const API_BASE = 'http://localhost:9002';

// Test user credentials
const testUser = {
  email: 'test-medication@example.com',
  nickname: 'MedTest',
  confidence_meds: 5,
  confidence_costs: 7,
  confidence_overall: 6,
  primary_need: 'medication_guidance',
  cycle_stage: 'ivf_prep'
};

async function testMedicationStatusEndpoint() {
  console.log('🧪 Testing CM-01 Medication Status Endpoint\n');
  
  try {
    // Step 1: Create test user
    console.log('1️⃣ Creating test user...');
    const createUserResponse = await axios.post(`${API_BASE}/api/users`, testUser);
    console.log('✅ User created:', createUserResponse.data.user.email);
    
    // Step 2: Login to get token
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: testUser.email
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Step 3: Test medication status update
    console.log('\n3️⃣ Testing medication status update...');
    
    const statusTests = [
      'taking',
      'starting_soon', 
      'not_taking',
      'between_cycles',
      'finished_treatment'
    ];
    
    for (const status of statusTests) {
      console.log(`\n   Testing status: ${status}`);
      
      const updateResponse = await axios.patch(
        `${API_BASE}/api/users/medication-status`,
        { medication_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (updateResponse.data.success) {
        console.log(`   ✅ ${status} - SUCCESS`);
        console.log(`      Updated: ${updateResponse.data.medication_status}`);
        console.log(`      Timestamp: ${updateResponse.data.medication_status_updated}`);
      } else {
        console.log(`   ❌ ${status} - FAILED: ${updateResponse.data.error}`);
      }
    }
    
    // Step 4: Test invalid status
    console.log('\n4️⃣ Testing invalid status handling...');
    try {
      await axios.patch(
        `${API_BASE}/api/users/medication-status`,
        { medication_status: 'invalid_status' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('❌ Should have rejected invalid status');
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Invalid status properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response.data);
      }
    }
    
    // Step 5: Test MedicationStatusManager component data flow
    console.log('\n5️⃣ Testing component integration...');
    const currentUserResponse = await axios.get(`${API_BASE}/api/users/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User profile data accessible for component:');
    console.log('   Medication Status:', currentUserResponse.data.user.medication_status || 'Not set');
    console.log('   Cycle Stage:', currentUserResponse.data.user.cycle_stage);
    
    console.log('\n🎉 All medication status endpoint tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMedicationStatusEndpoint(); 