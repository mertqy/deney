import { MatchService } from './matchService';
import { query } from '../db';

jest.mock('../db', () => ({
    query: jest.fn(),
}));

describe('MatchService', () => {
    const userId = 'user-1';
    const matchId = 'match-123';
    const mockMatch = {
        id: matchId,
        user_a_id: userId,
        user_b_id: 'user-2',
        status: 'pending',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMatchesByUserId', () => {
        it('should return matches for a user', async () => {
            (query as jest.Mock).mockResolvedValueOnce({ rows: [mockMatch] });

            const result = await MatchService.getMatchesByUserId(userId);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM matches'), [userId]);
            expect(result).toEqual([mockMatch]);
        });
    });

    describe('acceptMatch', () => {
        it('should set status to a_accepted if user_a accepts pending match', async () => {
            (query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockMatch] }) // Initial select
                .mockResolvedValueOnce({ rows: [{ ...mockMatch, status: 'a_accepted' }] }); // Update returning

            const result = await MatchService.acceptMatch(matchId, userId);

            expect(result.status).toBe('a_accepted');
            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE matches SET status = $1'), ['a_accepted', true, false, matchId]);
        });

        it('should set status to confirmed if second user accepts', async () => {
            const matchAAlreadyAccepted = { ...mockMatch, status: 'a_accepted' };
            const userIdB = 'user-2';

            (query as jest.Mock)
                .mockResolvedValueOnce({ rows: [matchAAlreadyAccepted] }) // Initial select
                .mockResolvedValueOnce({ rows: [{ ...matchAAlreadyAccepted, status: 'confirmed' }] }) // Update match status
                .mockResolvedValueOnce({ rows: [{ id: 'conv-1' }] }) // Insert conversation
                .mockResolvedValueOnce({ rows: [] }); // Update activity searches

            const result = await MatchService.acceptMatch(matchId, userIdB);

            expect(result.status).toBe('confirmed');
            expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO conversations'), [matchId]);
        });

        it('should throw error if match not found', async () => {
            (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            await expect(MatchService.acceptMatch('invalid', userId)).rejects.toThrow('Match not found');
        });
    });
});
