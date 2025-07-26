const axios = require('axios');

const PRODUCTION_URL = 'https://novara-mvp-production.up.railway.app';
const TEST_USER_EMAIL = 'ellingtonsp3@gmail.com';

async function testAirtableQuery() {
    console.log('🔍 Testing Airtable Query in Production');
    console.log('=' .repeat(50));

    try {
        // 1. Authenticate
        console.log('\n1️⃣ Authenticating...');
        const authResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
            email: TEST_USER_EMAIL,
            password: 'testpassword123'
        });
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful');

        // 2. Test check-ins endpoint (this works)
        console.log('\n2️⃣ Testing check-ins endpoint...');
        const checkinsResponse = await axios.get(`${PRODUCTION_URL}/api/checkins`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Check-ins count:', checkinsResponse.data.count);
        console.log('📊 Check-ins retrieved:', checkinsResponse.data.checkins.length);

        // 3. Test daily insights endpoint (this fails)
        console.log('\n3️⃣ Testing daily insights endpoint...');
        const insightsResponse = await axios.get(`${PRODUCTION_URL}/api/insights/daily`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Insights response:', JSON.stringify(insightsResponse.data, null, 2));

        // 4. Test last-values endpoint
        console.log('\n4️⃣ Testing last-values endpoint...');
        const lastValuesResponse = await axios.get(`${PRODUCTION_URL}/api/checkins/last-values`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Last values response:', JSON.stringify(lastValuesResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response ? {
            status: error.response.status,
            data: error.response.data
        } : error.message);
    }
}

testAirtableQuery(); 