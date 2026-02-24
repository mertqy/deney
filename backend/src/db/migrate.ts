import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('--- Migration Started ---');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const interestsPath = path.join(__dirname, '../../insert_interests.sql');

        console.log('Reading schema.sql...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('✓ schema.sql applied');

        console.log('Reading insert_interests.sql...');
        const interestsSql = fs.readFileSync(interestsPath, 'utf8');
        await client.query(interestsSql);
        console.log('✓ insert_interests.sql applied');

        console.log('--- Migration Completed Successfully ---');
    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
