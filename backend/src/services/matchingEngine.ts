import { query } from '../db';
import { Server } from 'socket.io';
import { sendPushNotification } from './notificationService';

// Haversine formula in SQL to calculate distance in km
const HAVERSINE_SQL = `
  (6371 * acos(
    cos(radians($1)) * cos(radians(lat)) * 
    cos(radians(lng) - radians($2)) + 
    sin(radians($1)) * sin(radians(lat))
  ))
`;

export async function findMatch(searchId: string, io?: Server) {
  try {
    // 1. Get the current search details
    const currentSearchRes = await query('SELECT * FROM activity_searches WHERE id = $1', [searchId]);
    if (currentSearchRes.rows.length === 0) return;
    const s = currentSearchRes.rows[0];

    // 2. Get current user's trust score and interests
    const userRes = await query('SELECT trust_score FROM users WHERE id = $1', [s.user_id]);
    const trustScore = userRes.rows[0]?.trust_score || 0;

    // Shadow ban check: If the initiating user is below 20, don't even look for matches
    if (trustScore < 20) {
      console.log(`User ${s.user_id} is shadow banned (score: ${trustScore})`);
      return;
    }

    console.log(`Searching for match for searchId: ${searchId}, user: ${s.user_id}, activity: ${s.activity_slug}, coords: ${s.lat},${s.lng}, radius: ${s.radius_km}`);

    // 3. Find potential candidates
    const candidatesRes = await query(
      `SELECT s.*, u.trust_score, u.expo_push_token,
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
       ORDER BY distance ASC
       LIMIT 5`,
      [s.lat, s.lng, s.activity_slug, s.desired_date, s.user_id, s.time_end, s.time_start, s.radius_km]
    );

    console.log(`Found ${candidatesRes.rows.length} potential candidates`);
    if (candidatesRes.rows.length === 0) {
      // Log why no candidates were found if possible?
      // Just a general "No candidates" is fine for now.
      return;
    }

    // Pick the best candidate (simplification: first one for now)
    const bestMatch = candidatesRes.rows[0];

    // 4. Calculate Compatibility Score
    // Interest score (50%)
    const commonInterestsRes = await query(
      `SELECT count(*) FROM user_interests ui1
       JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
       WHERE ui1.user_id = $1 AND ui2.user_id = $2`,
      [s.user_id, bestMatch.user_id]
    );
    const commonCount = parseInt(commonInterestsRes.rows[0].count);
    const interestScore = Math.min(commonCount * 10, 50);

    // Proximity score (30%)
    const distanceVal = parseFloat(bestMatch.distance);
    const maxRadius = Math.min(parseFloat(s.radius_km), parseFloat(bestMatch.radius_km));
    const proximityScore = Math.max(0, (1 - distanceVal / maxRadius) * 30);

    // Trust score (20%)
    const avgTrust = (trustScore + bestMatch.trust_score) / 2;
    const trustWeightScore = (avgTrust / 100) * 20;

    const totalScore = Math.round(interestScore + proximityScore + trustWeightScore);

    // 5. Create Match record
    const matchRes = await query(
      `INSERT INTO matches (search_a_id, search_b_id, user_a_id, user_b_id, compat_score, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '1 hour')
       RETURNING *`,
      [s.id, bestMatch.id, s.user_id, bestMatch.user_id, totalScore]
    );

    const match = matchRes.rows[0];

    // 6. Update search statuses
    await query("UPDATE activity_searches SET status = 'matched' WHERE id IN ($1, $2)", [s.id, bestMatch.id]);

    // 7. Notify via Socket.io
    if (io) {
      // Notify both users
      io.to(s.user_id).emit('match_found', { matchId: match.id, partnerId: bestMatch.user_id });
      io.to(bestMatch.user_id).emit('match_found', { matchId: match.id, partnerId: s.user_id });
    }

    // 8. Send Push Notifications
    if (s.expo_push_token) {
      sendPushNotification(s.expo_push_token, 'Eşleşme Bulundu! 🤩', `${bestMatch.activity_slug} için biriyle eşleştin.`);
    }
    if (bestMatch.expo_push_token) {
      sendPushNotification(bestMatch.expo_push_token, 'Eşleşme Bulundu! 🤩', `${s.activity_slug} için biriyle eşleştin.`);
    }

    console.log(`Match created: ${match.id} between ${s.user_id} and ${bestMatch.user_id} score: ${totalScore}`);
    return match;

  } catch (err) {
    console.error('Matching Error:', err);
  }
}
