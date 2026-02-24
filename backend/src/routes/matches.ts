import { Router, Response as ExpressResponse, NextFunction } from 'express';

import { authenticate, AuthRequest } from '../middleware/auth';
import { MatchService } from '../services/matchService';



const router = Router();

// GET /api/matches
router.get('/', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const matches = await MatchService.getMatchesByUserId(req.userId as string);
        return res.json(matches);

    } catch (err) {
        next(err);
    }
});


// GET /api/matches/by-search/:searchId
router.get('/by-search/:searchId', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const match = await MatchService.getActiveMatchBySearchId(req.params.searchId as string, req.userId as string);
        if (!match) return res.status(404).json({ error: 'No active match for this search' });

        return res.json(match);
    } catch (err) {
        next(err);
    }
});


// GET /api/matches/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const match = await MatchService.getMatchById(req.params.id as string, req.userId as string);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        return res.json(match);
    } catch (err) {
        next(err);
    }
});


// POST /api/matches/:id/accept
router.post('/:id/accept', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        const io = req.app.get('io');
        const updatedMatch = await MatchService.acceptMatch(req.params.id as string, req.userId as string, io);
        return res.json(updatedMatch);

    } catch (err: any) {
        if (err.message === 'Match not found') return res.status(404).json({ error: err.message });
        if (err.message === 'Match is not in a valid state to accept') return res.status(400).json({ error: err.message });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: err.message });
        next(err);
    }
});


// POST /api/matches/:id/decline
router.post('/:id/decline', authenticate, async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    try {
        await MatchService.declineMatch(req.params.id as string, req.userId as string);
        return res.json({ message: 'Match declined' });

    } catch (err: any) {
        if (err.message === 'Match not found') return res.status(404).json({ error: err.message });
        if (err.message === 'Unauthorized') return res.status(403).json({ error: err.message });
        next(err);
    }
});


export default router;
