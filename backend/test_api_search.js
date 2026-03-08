const axios = require('axios');

async function test_search() {
    const baseURL = 'http://localhost:3000';

    // We need a valid token. Let's find a user and sign a token (manually using secret)
    const jwt = require('jsonwebtoken');
    const secret = 'supersecret123';

    // Use an existing user from my previous DB query (Mert or others)
    const userId = 'faae054c-d3d6-4876-9ed9-61b59e1ea3be';
    const token = jwt.sign({ userId }, secret);

    console.log(`Using token for user: ${userId}`);

    try {
        const res = await axios.post(`${baseURL}/api/searches`, {
            activity_slug: 'sport',
            desired_date: new Date().toISOString().split('T')[0],
            time_start: '13:00:00',
            time_end: '15:00:00',
            lat: 39.8648,
            lng: 32.6462,
            radius_km: 50.0
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Search POST Success:', res.data);
    } catch (err) {
        console.error('Search POST Failed:', err.response?.data || err.message);
    }
}

test_search();
