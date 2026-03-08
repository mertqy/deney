const axios = require('axios');

const BASE_URL = 'https://deney-d2x5.onrender.com/api'; // Render production API
const TEST_USER = {
    email: 'testuser@example.com',
    password: 'password123'
};

async function testAuth() {
    console.log('--- Starting Production API Test ---');
    console.log(`Target: ${BASE_URL}\n`);

    try {
        console.log(`[1] Attempting login with ${TEST_USER.email}...`);
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER, { timeout: 60000 });
        console.log('✅ Login successful!');
        console.log('User ID:', loginRes.data.user.id);
        console.log('Access Token acquired.\n');

        const token = loginRes.data.accessToken;

        console.log('[2] Attempting to fetch user profile...');
        const profileRes = await axios.get(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000
        });
        console.log('✅ Profile fetch successful!');
        console.log('Name:', profileRes.data.name);
        console.log('Trust Score:', profileRes.data.trust_score);
        console.log('Verified:', profileRes.data.is_verified, '\n');

        console.log('--- TEST COMPLETED SUCCESSFULLY ---');
    } catch (err) {
        console.error('❌ TEST FAILED');
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error('Data:', err.response.data);

            // If user doesn't exist, try to register
            if (err.response.status === 401 && err.response.data.error === 'Invalid credentials') {
                console.log('\n[!] Test user might not exist. Attempting registration...');
                try {
                    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                        name: 'Test User',
                        email: TEST_USER.email,
                        password: TEST_USER.password,
                        birth_date: '1995-01-01'
                    }, { timeout: 60000 });
                    console.log('✅ Registration successful!');
                    console.log('User ID:', regRes.data.user.id);
                    console.log('Please run the test again to verify login.\n');
                } catch (regErr) {
                    console.error('❌ Registration also failed.');
                    if (regErr.response) console.error('Reg Data:', regErr.response.data);
                }
            }
        } else {
            console.error('Error Message:', err.message);
        }
    }
}

testAuth();
