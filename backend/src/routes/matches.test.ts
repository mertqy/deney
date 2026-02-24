import request from 'supertest';
import express from 'express';
import matchesRoute from './matches';
import { MatchService } from '../services/matchService';

// Mock the services
jest.mock('../services/matchService');

// Mock the authentication middleware
jest.mock('../middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    },
}));

const app = express();
app.use(express.json());
// Inject app.set('io') for tests that need it
app.set('io', { to: jest.fn().mockReturnValue({ emit: jest.fn() }) });
app.use('/matches', matchesRoute);

describe('Matches Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /matches', () => {
        it('should return 200 and list of matches', async () => {
            const mockMatches = [{ id: 'match-1' }, { id: 'match-2' }];
            (MatchService.getMatchesByUserId as jest.Mock).mockResolvedValue(mockMatches);

            const response = await request(app).get('/matches');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockMatches);
            expect(MatchService.getMatchesByUserId).toHaveBeenCalledWith('test-user-id');
        });
    });

    describe('POST /matches/:id/accept', () => {
        it('should return 200 and updated match', async () => {
            const mockUpdatedMatch = { id: 'match-1', status: 'confirmed' };
            (MatchService.acceptMatch as jest.Mock).mockResolvedValue(mockUpdatedMatch);

            const response = await request(app).post('/matches/match-1/accept');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockUpdatedMatch);
            expect(MatchService.acceptMatch).toHaveBeenCalledWith('match-1', 'test-user-id', expect.anything());
        });

        it('should return 404 if match not found', async () => {
            (MatchService.acceptMatch as jest.Mock).mockRejectedValue(new Error('Match not found'));

            const response = await request(app).post('/matches/invalid/accept');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Match not found');
        });
    });
});
