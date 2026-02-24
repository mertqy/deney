import request from 'supertest';
import express from 'express';
import usersRoute from './users';
import { UserService } from '../services/userService';

// Mock the services
jest.mock('../services/userService');

// Mock the authentication middleware
jest.mock('../middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    },
}));

const app = express();
app.use(express.json());
app.use('/users', usersRoute);

describe('Users Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /users/me', () => {
        it('should return 200 and user profile', async () => {
            const mockProfile = { id: 'test-user-id', name: 'Test User' };
            (UserService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

            const response = await request(app).get('/users/me');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockProfile);
            expect(UserService.getProfile).toHaveBeenCalledWith('test-user-id');
        });

        it('should return 404 if user not found', async () => {
            (UserService.getProfile as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/users/me');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('PATCH /users/me', () => {
        it('should update profile and return 200', async () => {
            const updateData = { name: 'Updated Name' };
            (UserService.updateProfile as jest.Mock).mockResolvedValue({ id: 'test-user-id', ...updateData });

            const response = await request(app).patch('/users/me').send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Name');
        });
    });
});
