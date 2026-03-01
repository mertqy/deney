import { query } from '../db';
import { Server } from 'socket.io';

export const MatchService = {
    async getMatchesByUserId(userId: string) {
        const result = await query(
            `SELECT * FROM matches
             WHERE user_a_id = $1 OR user_b_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    async getMatchById(matchId: string, userId: string) {
        const result = await query(
            `SELECT m.*,
                (SELECT row_to_json(u) FROM (SELECT id, name, avatar_url, birth_date, bio, is_verified, trust_score, location_city FROM users WHERE id = m.user_a_id) u) as user_a,
                (SELECT row_to_json(u) FROM (SELECT id, name, avatar_url, birth_date, bio, is_verified, trust_score, location_city FROM users WHERE id = m.user_b_id) u) as user_b
             FROM matches m
             WHERE m.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
            [matchId, userId]
        );
        const match = result.rows[0];
        if (match) {
            const { UserService } = require('./userService');
            if (match.user_a) match.user_a.interests = await UserService.getUserInterests(match.user_a_id);
            if (match.user_b) match.user_b.interests = await UserService.getUserInterests(match.user_b_id);
        }
        return match;
    },


    async getActiveMatchBySearchId(searchId: string, userId: string) {
        const result = await query(
            `SELECT * FROM matches 
             WHERE (search_a_id = $1 OR search_b_id = $1)
             AND (user_a_id = $2 OR user_b_id = $2)
             AND status NOT IN ('declined', 'expired')
             LIMIT 1`,
            [searchId, userId]
        );
        return result.rows[0];
    },

    async acceptMatch(matchId: string, userId: string, appIo?: Server) {
        const matchRes = await query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
        if (matchRes.rows.length === 0) throw new Error('Match not found');

        const match = matchRes.rows[0];
        if (match.status !== 'pending' && match.status !== 'a_accepted' && match.status !== 'b_accepted') {
            throw new Error('Match is not in a valid state to accept');
        }

        const isUserA = match.user_a_id === userId;
        const isUserB = match.user_b_id === userId;

        if (!isUserA && !isUserB) throw new Error('Unauthorized');

        let newStatus = match.status;
        if (isUserA) {
            newStatus = match.status === 'pending' ? 'a_accepted' : 'confirmed';
        } else if (isUserB) {
            newStatus = match.status === 'a_accepted' ? 'confirmed' : 'b_accepted';
            if (match.status === 'pending') newStatus = 'b_accepted';
            if (match.status === 'a_accepted') newStatus = 'confirmed';
        }

        const updateRes = await query(
            `UPDATE matches SET status = $1,
                a_responded_at = CASE WHEN $2 THEN now() ELSE a_responded_at END,
                b_responded_at = CASE WHEN $3 THEN now() ELSE b_responded_at END
             WHERE id = $4
             RETURNING *`,
            [newStatus, isUserA, isUserB, match.id]
        );

        const updatedMatch = updateRes.rows[0];

        if (newStatus === 'confirmed' && match.status !== 'confirmed') {
            const convRes = await query(`INSERT INTO conversations (match_id) VALUES ($1) ON CONFLICT (match_id) DO UPDATE SET match_id = EXCLUDED.match_id RETURNING id`, [match.id]);
            const convId = convRes.rows[0].id;

            await query(`UPDATE activity_searches SET status = 'matched' WHERE id IN ($1, $2)`, [match.search_a_id, match.search_b_id]);

            if (appIo) {
                appIo.to(match.user_a_id).emit('match_confirmed', { matchId: match.id, conversationId: convId });
                appIo.to(match.user_b_id).emit('match_confirmed', { matchId: match.id, conversationId: convId });
            }
        }

        return updatedMatch;
    },

    async declineMatch(matchId: string, userId: string, appIo?: Server) {
        const matchRes = await query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
        if (matchRes.rows.length === 0) throw new Error('Match not found');

        const match = matchRes.rows[0];
        if (match.user_a_id !== userId && match.user_b_id !== userId) {
            throw new Error('Unauthorized');
        }

        await query(`UPDATE matches SET status = 'declined' WHERE id = $1`, [match.id]);
        await query(`UPDATE activity_searches SET status = 'cancelled' WHERE id IN ($1, $2)`, [match.search_a_id, match.search_b_id]);

        if (appIo) {
            const otherUserId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
            appIo.to(otherUserId).emit('match_declined', { matchId: match.id });
        }
    },

    async unmatchUser(matchId: string, userId: string, appIo?: Server) {
        const matchRes = await query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
        if (matchRes.rows.length === 0) throw new Error('Match not found');

        const match = matchRes.rows[0];
        if (match.user_a_id !== userId && match.user_b_id !== userId) throw new Error('Unauthorized');

        await query(`UPDATE matches SET status = 'unmatched' WHERE id = $1`, [match.id]);

        // Ensure their searches are also cancelled so they don't pop up immediately again
        await query(`UPDATE activity_searches SET status = 'cancelled' WHERE id IN ($1, $2)`, [match.search_a_id, match.search_b_id]);

        if (appIo) {
            const otherUserId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
            appIo.to(otherUserId).emit('chat_unmatched', { matchId: match.id });
        }
    },

    async banUser(blockerId: string, blockedId: string, reason: string = '', matchId?: string, appIo?: Server) {
        await query(
            `INSERT INTO user_blocks (blocker_id, blocked_id, reason) 
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [blockerId, blockedId, reason]
        );

        // Lower the trust score of the blocked user significantly
        await query(`UPDATE users SET trust_score = GREATEST(0, trust_score - 10) WHERE id = $1`, [blockedId]);

        // If a match context is provided, unmatch them
        if (matchId) {
            const matchRes = await query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
            if (matchRes.rows.length > 0) {
                const match = matchRes.rows[0];
                await query(`UPDATE matches SET status = 'banned' WHERE id = $1`, [match.id]);
                await query(`UPDATE activity_searches SET status = 'cancelled' WHERE id IN ($1, $2)`, [match.search_a_id, match.search_b_id]);

                if (appIo) {
                    appIo.to(blockedId).emit('chat_unmatched', { matchId: match.id, reason: 'banned' });
                }
            }
        }
    }
};
