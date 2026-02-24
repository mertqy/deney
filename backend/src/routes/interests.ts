import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/interests
router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await query('SELECT id, label, emoji, slug FROM interests ORDER BY id');
        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
