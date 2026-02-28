const { Client } = require('pg');
require('dotenv').config();

async function checkSearches() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id, user_id, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km, status FROM activity_searches ORDER BY created_at DESC LIMIT 10");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSearches();
