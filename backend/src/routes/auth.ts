import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { config } from '../config';


const router = Router();
const SALT_ROUNDS = 10;


function generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
}


// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    const { name, email, password, birth_date } = req.body;
    if (!name || !email || !password || !birth_date) {
        return res.status(400).json({ error: 'name, email, password, birth_date are required' });
    }

    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await query(
            `INSERT INTO users (name, email, password, birth_date)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, birth_date, trust_score, created_at`,
            [name, email, hashedPassword, birth_date]
        );
        const user = result.rows[0];
        const tokens = generateTokens(user.id);
        return res.status(201).json({ user, ...tokens });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const tokens = generateTokens(user.id);
        const { password: _, ...safeUser } = user;
        return res.json({ user: safeUser, ...tokens });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };
        const tokens = generateTokens(decoded.userId);
        return res.json(tokens);
    } catch {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});


// POST /api/auth/logout (client-side token discard; server-side stateless)
router.post('/logout', (_req: Request, res: Response) => {
    return res.json({ message: 'Logged out successfully' });
});

export default router;
