const { Client } = require('pg');

const connStr = 'postgresql://neondb_owner:npg_1lH5ysqJTvcr@ep-wispy-paper-aghjj552-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function test() {
    const client = new Client({ connectionString: connStr });
    await client.connect();

    try {
        console.log('--- Cleaning up old test data ---');
        await client.query("DELETE FROM activity_searches WHERE activity_slug = 'test-activity'");

        console.log('--- Creating two test users (if not exists) ---');
        // We reuse existing IDs or create temporary ones? Let's just create two test users or find existing ones.
        const usersRes = await client.query('SELECT id FROM users LIMIT 2');
        if (usersRes.rows.length < 2) {
            console.log('Not enough users in DB to test matching.');
            return;
        }
        const userA = usersRes.rows[0].id;
        const userB = usersRes.rows[1].id;

        const date = new Date().toISOString().split('T')[0];
        const expiresAt = new Date(Date.now() + 3600000).toISOString();

        console.log(`--- Creating search for User A (${userA}) ---`);
        const s1 = await client.query(
            `INSERT INTO activity_searches (user_id, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km, expires_at, status)
             VALUES ($1, 'test-activity', $2, '10:00:00', '12:00:00', 41.0, 29.0, 10.0, $3, 'searching')
             RETURNING id`,
            [userA, date, expiresAt]
        );

        console.log(`--- Creating search for User B (${userB}) ---`);
        const s2 = await client.query(
            `INSERT INTO activity_searches (user_id, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km, expires_at, status)
             VALUES ($1, 'test-activity', $2, '11:00:00', '13:00:00', 41.01, 29.01, 10.0, $3, 'searching')
             RETURNING id`,
            [userB, date, expiresAt]
        );

        console.log(`Searches created: ${s1.rows[0].id} and ${s2.rows[0].id}`);

        // Now we manually call the matching logic (we can't easily import TS files here, but we can copy the SQL)
        console.log('--- Running Matching SQL ---');
        const s = (await client.query('SELECT * FROM activity_searches WHERE id = $1', [s1.rows[0].id])).rows[0];

        const HAVERSINE_SQL = `
          (6371 * acos(
            cos(radians($1)) * cos(radians(lat)) * 
            cos(radians(lng) - radians($2)) + 
            sin(radians($1)) * sin(radians(lat))
          ))
        `;

        const candidatesRes = await client.query(
            `SELECT s.*, u.trust_score,
            ${HAVERSINE_SQL} as distance
           FROM activity_searches s
           JOIN users u ON s.user_id = u.id
           WHERE s.activity_slug = $3
             AND s.desired_date = $4
             AND s.status = 'searching'
             AND s.user_id != $5
             AND u.trust_score >= 20
             AND (s.time_start < $6 AND s.time_end > $7)
             AND ${HAVERSINE_SQL} <= LEAST(s.radius_km, $8)
           ORDER BY distance ASC`,
            [s.lat, s.lng, s.activity_slug, s.desired_date, s.user_id, s.time_end, s.time_start, s.radius_km]
        );

        console.log(`Found ${candidatesRes.rows.length} candidates.`);
        if (candidatesRes.rows.length > 0) {
            console.log('MATCH FOUND!');
            console.log('Candidate Distance:', candidatesRes.rows[0].distance);
        } else {
            console.log('NO MATCH FOUND.');

            // Debug: Check individual conditions
            const allCompat = await client.query(`SELECT * FROM activity_searches WHERE activity_slug = 'test-activity' AND user_id != $1`, [userA]);
            console.log('All other test searches:', allCompat.rows.length);
            if (allCompat.rows.length > 0) {
                const c = allCompat.rows[0];
                console.log('Details of other search:', {
                    desired_date: c.desired_date,
                    time_start: c.time_start,
                    time_end: c.time_end,
                    status: c.status
                });
                console.log('Current search details:', {
                    desired_date: s.desired_date,
                    time_start: s.time_start,
                    time_end: s.time_end,
                });
            }
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await client.end();
    }
}

test();
