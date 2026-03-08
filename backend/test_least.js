const { Client } = require('pg');
const connStr = 'postgresql://neondb_owner:npg_1lH5ysqJTvcr@ep-wispy-paper-aghjj552-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function test() {
    const client = new Client({ connectionString: connStr });
    await client.connect();
    const res = await client.query("SELECT LEAST('50.0', '100.0') as r1, LEAST('5.0', '10.0') as r2");
    console.log(res.rows[0]);
    await client.end();
}
test();
