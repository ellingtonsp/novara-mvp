const axios = require('axios');

const PRODUCTION_URL = 'https://novara-mvp-production.up.railway.app';
const TEST_USER_EMAIL = 'ellingtonsp3@gmail.com';

async function testProductionCheckinCount() {
    console.log('🔍 Testing Production Check-in Count for:', TEST_USER_EMAIL);
    console.log('=' .repeat(60));

    try {
        // 1. Test health endpoint
        console.log('\n1️⃣ Testing health endpoint...');
        const healthResponse = await axios.get(`${PRODUCTION_URL}/api/health`);
        console.log('✅ Health check passed:', healthResponse.data.environment);

        // 2. Test user registration/login
        console.log('\n2️⃣ Testing user authentication...');
        const authResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
            email: TEST_USER_EMAIL,
            password: 'testpassword123'
        });
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful');

        // 3. Test check-ins endpoint
        console.log('\n3️⃣ Testing check-ins endpoint...');
        const checkinsResponse = await axios.get(`${PRODUCTION_URL}/api/checkins`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Check-ins response:', JSON.stringify(checkinsResponse.data, null, 2));

        // 4. Test daily check-in submission
        console.log('\n4️⃣ Testing daily check-in submission...');
        const checkinData = {
            mood_today: 'hopeful, testing',
            confidence_today: 7,
            primary_concern_today: 'Testing check-in count in production',
            user_note: 'Testing check-in count in production'
        };

        const submitResponse = await axios.post(`${PRODUCTION_URL}/api/checkins`, checkinData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Check-in submitted successfully');
        console.log('📊 Submit response:', JSON.stringify(submitResponse.data, null, 2));

        // 5. Test check-ins again after submission
        console.log('\n5️⃣ Testing check-ins after submission...');
        const checkinsAfterResponse = await axios.get(`${PRODUCTION_URL}/api/checkins`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Check-ins after submission:', JSON.stringify(checkinsAfterResponse.data, null, 2));

        // 6. Test daily insights to see check-in count
        console.log('\n6️⃣ Testing daily insights...');
        const insightsResponse = await axios.get(`${PRODUCTION_URL}/api/insights/daily`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📊 Daily insights response:', JSON.stringify(insightsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
        } : error.message);
    }
}

testProductionCheckinCount(); 