import { UserService } from './userService';
import { query } from '../db';

jest.mock('../db', () => ({
    query: jest.fn(),
}));

describe('UserService', () => {
    const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return user profile if found', async () => {
            (query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

            const result = await UserService.getProfile('1');

            expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['1']);
            expect(result).toEqual(mockUser);
        });

        it('should return undefined if user not found', async () => {
            (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            const result = await UserService.getProfile('999');

            expect(result).toBeUndefined();
        });
    });

    describe('updateProfile', () => {
        it('should update user profile and return updated data', async () => {
            const updateData = { name: 'New Name' };
            const updatedUser = { ...mockUser, ...updateData };
            (query as jest.Mock).mockResolvedValueOnce({ rows: [updatedUser] });

            const result = await UserService.updateProfile('1', updateData);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.arrayContaining(['New Name', '1']));
            expect(result).toEqual(updatedUser);
        });
    });

    describe('updatePushToken', () => {
        it('should update expo push token', async () => {
            (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            await UserService.updatePushToken('1', 'token-123');

            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET expo_push_token'), ['token-123', '1']);
        });
    });
});
