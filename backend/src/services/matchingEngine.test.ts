import { findMatch } from './matchingEngine';
import { query } from '../db';
import { sendPushNotification } from './notificationService';

jest.mock('../db', () => ({
    query: jest.fn(),
}));

jest.mock('./notificationService', () => ({
    sendPushNotification: jest.fn(),
}));

describe('MatchingEngine', () => {
    const mockSearch = {
        id: 'search-1',
        user_id: 'user-1',
        activity_slug: 'tennis',
        desired_date: '2023-10-27',
        lat: 41.0,
        lng: 29.0,
        radius_km: 10,
        time_start: '10:00',
        time_end: '12:00',
    };

    const mockCandidate = {
        id: 'search-2',
        user_id: 'user-2',
        activity_slug: 'tennis',
        desired_date: '2023-10-27',
        distance: '2.5',
        trust_score: 80,
        expo_push_token: 'token-2',
        radius_km: 10,
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return undefined if search not found', async () => {
        (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
        const result = await findMatch('invalid-id');
        expect(result).toBeUndefined();
    });

    it('should not look for matches if user trust score is below 20', async () => {
        (query as jest.Mock)
            .mockResolvedValueOnce({ rows: [mockSearch] })
            .mockResolvedValueOnce({ rows: [{ trust_score: 10 }] });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await findMatch('search-1');

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('is shadow banned'));
        expect(query).toHaveBeenCalledTimes(2);

        consoleSpy.mockRestore();
    });

    it('should create a match if candidate is found', async () => {
        (query as jest.Mock)
            .mockResolvedValueOnce({ rows: [mockSearch] }) // Get search
            .mockResolvedValueOnce({ rows: [{ trust_score: 90 }] }) // Get user trust
            .mockResolvedValueOnce({ rows: [mockCandidate] }) // Find candidates
            .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Common interests
            .mockResolvedValueOnce({ rows: [{ id: 'match-123' }] }) // Insert match
            .mockResolvedValueOnce({ rows: [] }); // Update status

        const mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;

        const result = await findMatch('search-1', mockIo);

        expect(result).toBeDefined();
        expect(result.id).toBe('match-123');
        expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO matches'), expect.anything());
        expect(sendPushNotification).toHaveBeenCalled();
    });
});
