const { Client } = require('pg');
require('dotenv').config();

const HAVERSINE_SQL = `
  (6371 * acos(
    LEAST(
      cos(radians($1)) * cos(radians(lat)) * 
      cos(radians(lng) - radians($2)) + 
      sin(radians($1)) * sin(radians(lat)),
      1.0
    )
  ))
`;

async function testQuery() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        await client.connect();

        // Use the values from User A (recent search)
        const lat = 39.8633697;
        const lng = 32.6475318;
        const activity_slug = 'coffee';
        const desired_date = '2026-03-01T21:00:00.000Z'; // Or '2026-03-02'
        const user_id = 'ebdd6755-446c-4947-9056-d929c8aa5474';
        const time_start = '11:41:00';
        const time_end = '23:55:00';
        const radius_km = 50.0;

        // I will first select the activity_searches directly to see if date matches
        const checkDate = await client.query(`SELECT id, desired_date, CAST(desired_date AS TEXT) as str_date FROM activity_searches WHERE activity_slug = $1`, [activity_slug]);
        console.log("Date formats in DB:", checkDate.rows);

        const queryStr = `SELECT s.*, u.trust_score, u.expo_push_token,
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
       ORDER BY distance ASC`;

        console.log("Executing query...");
        const res = await client.query(queryStr, [
            lat, lng, activity_slug, desired_date, user_id, time_end, time_start, radius_km
        ]);

        console.log(`Found ${res.rows.length} matches!`);
        console.log(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

testQuery();
