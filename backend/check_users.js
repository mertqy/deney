const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id, name, email, trust_score FROM users ORDER BY created_at DESC LIMIT 10");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUsers();
