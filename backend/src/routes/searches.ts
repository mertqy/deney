import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../db';
import { findMatch } from '../services/matchingEngine';

const router = Router();

// GET /api/searches
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT * FROM activity_searches
       WHERE user_id = $1 AND status = 'searching'
       ORDER BY created_at DESC`,
            [req.userId]
        );
        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/searches
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    const { activity_slug, desired_date, time_start, time_end, lat, lng, radius_km } = req.body;
    if (!activity_slug || !desired_date || !time_start || !time_end || !lat || !lng) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Expires in 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = await query(
            `INSERT INTO activity_searches
        (user_id, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [req.userId, activity_slug, desired_date, time_start, time_end, lat, lng, radius_km || 3.0, expiresAt.toISOString()]
        );

        const newSearch = result.rows[0];

        // Trigger matching engine
        // We pass req.app.get('io') to the matching engine
        findMatch(newSearch.id, req.app.get('io'));

        return res.status(201).json(newSearch);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/searches/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `UPDATE activity_searches SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status IN ('searching', 'matched')
       RETURNING id`,
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Active search not found' });
        }
        return res.json({ message: 'Search cancelled successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
