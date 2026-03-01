import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../db';
import { sendPushNotification } from '../services/notificationService';

const router = Router();

// GET /api/conversations
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT c.*,
        m.user_a_id, m.user_b_id,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE m.user_a_id = $1 OR m.user_b_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
            [req.userId]
        );

        const conversations = await Promise.all(result.rows.map(async (conv) => {
            const otherUserId = conv.user_a_id === req.userId ? conv.user_b_id : conv.user_a_id;
            const userRes = await query('SELECT id, name, avatar_url, is_verified FROM users WHERE id = $1', [otherUserId]);
            return {
                ...conv,
                otherUser: userRes.rows[0],
            };
        }));

        return res.json(conversations);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/conversations/:id (messages with pagination)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const { limit = 30, offset = 0 } = req.query;
    try {
        // Verify participation
        const verifyUser = await query(
            `SELECT 1 FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
            [req.params.id, req.userId]
        );

        if (verifyUser.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const result = await query(
            `SELECT * FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
            [req.params.id, limit, offset]
        );

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        // Verify participation
        const verifyUser = await query(
            `SELECT 1 FROM conversations c
       JOIN matches m ON m.id = c.match_id
       WHERE c.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
            [req.params.id, req.userId]
        );

        if (verifyUser.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const result = await query(
            `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [req.params.id, req.userId, content]
        );

        const newMessage = result.rows[0];

        // Emit socket event for new_message
        const io = req.app.get('io');
        if (io) {
            // Find the other user ID and push token
            const matchRes = await query(
                `SELECT u1.id as user_a_id, u1.expo_push_token as token_a, u1.name as name_a,
                u2.id as user_b_id, u2.expo_push_token as token_b, u2.name as name_b
         FROM matches m 
         JOIN conversations c ON c.match_id = m.id 
         JOIN users u1 ON m.user_a_id = u1.id
         JOIN users u2 ON m.user_b_id = u2.id
         WHERE c.id = $1`,
                [req.params.id]
            );

            if (matchRes.rows.length > 0) {
                const { user_a_id, token_a, name_a, user_b_id, token_b, name_b } = matchRes.rows[0];

                io.to(user_a_id).emit('new_message', newMessage);
                io.to(user_b_id).emit('new_message', newMessage);

                // Notify the OTHER user
                const isSenderA = req.userId === user_a_id;
                const recipientToken = isSenderA ? token_b : token_a;
                const senderName = isSenderA ? name_a : name_b;

                if (recipientToken) {
                    sendPushNotification(recipientToken, `Yeni Mesaj: ${senderName}`, newMessage.content, { conversationId: req.params.id });
                }
            }
        }

        return res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

import { MatchService } from '../services/matchService';

// POST /api/conversations/:id/unmatch
router.post('/:id/unmatch', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;
        const verifyUser = await query(`SELECT match_id FROM conversations WHERE id = $1`, [req.params.id]);
        if (verifyUser.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

        const matchId = verifyUser.rows[0].match_id;
        const io = req.app.get('io');

        await MatchService.unmatchUser(matchId, req.userId as string, reason || '', io);
        return res.json({ message: 'Eşleşme kaldırıldı.' });
    } catch (err: any) {
        if (err.message === 'Unauthorized') return res.status(403).json({ error: err.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/conversations/:id/ban
router.post('/:id/ban', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;
        const convRes = await query(`
            SELECT c.match_id, m.user_a_id, m.user_b_id 
            FROM conversations c 
            JOIN matches m ON c.match_id = m.id 
            WHERE c.id = $1`, [req.params.id]);

        if (convRes.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

        const { match_id, user_a_id, user_b_id } = convRes.rows[0];
        const blockedId = user_a_id === req.userId ? user_b_id : user_a_id;
        const io = req.app.get('io');

        await MatchService.banUser(req.userId as string, blockedId, reason || 'Inappropriate behavior in chat', match_id, io);
        return res.json({ message: 'Kullanıcı engellendi.' });
    } catch (err: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
