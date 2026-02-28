const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env' });

const DB = {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
};

const pool = new Pool(DB);

async function run() {
    try {
        const passwordHash = await bcrypt.hash('demo123', 10);

        // Mert
        let res = await pool.query(`SELECT id FROM users WHERE email = 'mert@demo.com'`);
        if (res.rows.length === 0) {
            await pool.query(
                `INSERT INTO users (name, email, password, birth_date, trust_score, is_verified) VALUES ($1, $2, $3, $4, 50, true)`,
                ['Mert Demo', 'mert@demo.com', passwordHash, '2000-01-01']
            );
            console.log("Mert inserted");
        } else {
            await pool.query(`UPDATE users SET password = $1 WHERE email = 'mert@demo.com'`, [passwordHash]);
            console.log("Mert updated");
        }

        // Ayse
        res = await pool.query(`SELECT id FROM users WHERE email = 'ayse@demo.com'`);
        if (res.rows.length === 0) {
            await pool.query(
                `INSERT INTO users (name, email, password, birth_date, trust_score, is_verified) VALUES ($1, $2, $3, $4, 50, true)`,
                ['Ayse Demo', 'ayse@demo.com', passwordHash, '2000-01-01']
            );
            console.log("Ayse inserted");
        } else {
            await pool.query(`UPDATE users SET password = $1 WHERE email = 'ayse@demo.com'`, [passwordHash]);
            console.log("Ayse updated");
        }

        console.log("Demo Accounts Prepared.");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
