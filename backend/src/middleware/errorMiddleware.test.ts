import { errorMiddleware, AppError } from './errorMiddleware';
import { Request, Response, NextFunction } from 'express';

describe('errorMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should return 500 and default message if no statusCode provided', () => {
        const err = new Error('Generic error') as AppError;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        errorMiddleware(err, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Generic error' }));

        consoleSpy.mockRestore();
    });

    it('should use statusCode if provided', () => {
        const err = new Error('Bad request') as AppError;
        err.statusCode = 400;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        errorMiddleware(err, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Bad request' }));

        consoleSpy.mockRestore();
    });

    it('should include stack trace in development', () => {
        process.env.NODE_ENV = 'development';
        const err = new Error('Dev error') as AppError;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        errorMiddleware(err, mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ stack: expect.any(String) }));

        consoleSpy.mockRestore();
    });
});
