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

import { sendVerificationEmail } from '../services/emailService';
import { authenticate, AuthRequest } from '../middleware/auth';

// POST /api/auth/send-verification
router.post('/send-verification', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT email, is_verified FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        if (user.is_verified) return res.status(400).json({ error: 'User already verified' });

        const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit
        const expiresStr = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

        await query(
            'UPDATE users SET email_verification_code = $1, email_verification_expires = $2 WHERE id = $3',
            [code, expiresStr, req.userId]
        );

        const emailSent = await sendVerificationEmail(user.email, code);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.json({ message: 'Verification code sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Verification code is required' });

    try {
        const result = await query(
            'SELECT email_verification_code, email_verification_expires FROM users WHERE id = $1',
            [req.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        if (!user.email_verification_code || user.email_verification_code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (new Date(user.email_verification_expires).getTime() < Date.now()) {
            return res.status(400).json({ error: 'Verification code has expired' });
        }

        await query(
            'UPDATE users SET is_verified = true, trust_score = LEAST(100, trust_score + 20), email_verification_code = NULL, email_verification_expires = NULL WHERE id = $1',
            [req.userId]
        );

        return res.json({ message: 'Email verified successfully. You received +20 trust score!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
