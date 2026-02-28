const { Client } = require('pg');
require('dotenv').config();

async function checkStatus() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const searches = await client.query("SELECT id, user_id, status, activity_slug, created_at FROM activity_searches ORDER BY created_at DESC LIMIT 5");
        console.log('\n--- Recent Searches ---');
        console.table(searches.rows);

        const matches = await client.query("SELECT id, user_a_id, user_b_id, status, created_at FROM matches ORDER BY created_at DESC LIMIT 5");
        console.log('\n--- Recent Matches ---');
        console.table(matches.rows);

        const users = await client.query("SELECT id, name, trust_score FROM users WHERE email IN ('mert@demo.com', 'ayse@demo.com')");
        console.log('\n--- Demo Users ---');
        console.table(users.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkStatus();
