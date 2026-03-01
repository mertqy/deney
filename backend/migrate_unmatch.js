const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();

        console.log("Dropping old constraint...");
        await client.query("ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;");

        console.log("Adding new constraint...");
        await client.query("ALTER TABLE matches ADD CONSTRAINT matches_status_check CHECK (status IN ('pending', 'a_accepted', 'b_accepted', 'confirmed', 'declined', 'expired', 'unmatched', 'banned'));");

        console.log("Creating user_blocks table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_blocks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                blocker_id UUID REFERENCES users(id),
                blocked_id UUID REFERENCES users(id),
                reason TEXT,
                created_at TIMESTAMPTZ DEFAULT now(),
                UNIQUE(blocker_id, blocked_id)
            );
        `);

        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
