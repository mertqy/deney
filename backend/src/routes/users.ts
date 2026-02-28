import { Router, Response as ExpressResponse, NextFunction } from 'express';

import { authenticate, AuthRequest } from '../middleware/auth';
import { UserService } from '../services/userService';



const router = Router();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const user = await UserService.getProfile(req.userId!, true);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    } catch (err) {
        next(err);
    }
});


router.patch('/me', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const user = await UserService.updateProfile(req.userId!, req.body);
        return res.json(user);
    } catch (err) {
        next(err);
    }
});


// DELETE /api/users/me
router.delete('/me', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        await UserService.deleteAccount(req.userId!);
        return res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        next(err);
    }
});



// POST /api/users/me/push-token
router.post('/me/push-token', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        await UserService.updatePushToken(req.userId!, token);
        return res.json({ message: 'Push token updated' });
    } catch (err) {
        next(err);
    }
});


// GET /api/users/me/interests
router.get('/me/interests', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const interests = await UserService.getUserInterests(req.userId!);
        return res.json(interests);
    } catch (err) {
        next(err);
    }
});


// PUT /api/users/me/interests
router.put('/me/interests', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    const { interest_ids } = req.body as { interest_ids: number[] };
    if (!Array.isArray(interest_ids)) {
        return res.status(400).json({ error: 'interest_ids must be an array' });
    }
    try {
        await UserService.updateUserInterests(req.userId as string, interest_ids);
        return res.json({ message: 'Interests updated' });

    } catch (err) {
        next(err);
    }
});


// GET /api/users/:id — public profile (only for matched users, simplified here)
router.get('/:id', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const user = await UserService.getProfile(req.params.id as string);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    } catch (err) {
        next(err);
    }
});


export default router;
