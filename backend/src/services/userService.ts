import { query } from '../db';

export const UserService = {
    async getProfile(userId: string) {
        const result = await query(
            `SELECT id, name, email, birth_date, bio, avatar_url, is_verified,
              trust_score, location_city, created_at
             FROM users WHERE id = $1`,
            [userId]
        );
        const user = result.rows[0];
        if (user) {
            user.interests = await this.getUserInterests(userId);
        }
        return user;
    },

    async updateProfile(userId: string, data: any) {
        const { name, bio, avatar_url, location_city } = data;
        const result = await query(
            `UPDATE users SET
             name = COALESCE($1, name),
             bio = COALESCE($2, bio),
             avatar_url = COALESCE($3, avatar_url),
             location_city = COALESCE($4, location_city),
             updated_at = now()
            WHERE id = $5
            RETURNING id, name, email, birth_date, bio, avatar_url, is_verified, trust_score, location_city`,
            [name, bio, avatar_url, location_city, userId]
        );
        const user = result.rows[0];
        if (user) {
            user.interests = await this.getUserInterests(userId);
        }
        return user;
    },


    async updatePushToken(userId: string, token: string) {
        await query('UPDATE users SET expo_push_token = $1 WHERE id = $2', [token, userId]);
    },

    async getUserInterests(userId: string) {
        const result = await query(
            `SELECT i.id, i.label, i.emoji, i.slug
             FROM interests i
             JOIN user_interests ui ON ui.interest_id = i.id
             WHERE ui.user_id = $1`,
            [userId]
        );
        return result.rows;
    },

    async updateUserInterests(userId: string, interestIds: number[]) {
        await query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
        for (const id of interestIds) {
            await query(
                'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, id]
            );
        }
    },

    async deleteAccount(userId: string) {
        // Delete related data that doesn't have ON DELETE CASCADE
        await query('DELETE FROM messages WHERE sender_id = $1', [userId]);
        await query('DELETE FROM matches WHERE user_a_id = $1 OR user_b_id = $1', [userId]);
        await query('DELETE FROM users WHERE id = $1', [userId]);
    }

};

