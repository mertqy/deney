import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { errorMiddleware } from './middleware/errorMiddleware';


console.log('--- Server Starting ---');
const app = express();
const server = http.createServer(app);

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

import jwt from 'jsonwebtoken';

console.log('Initializing Socket.IO...');
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
        (socket as any).userId = decoded.userId;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

console.log('Configuring middleware...');
app.set('io', io);

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import interestRoutes from './routes/interests';
import searchRoutes from './routes/searches';
import matchRoutes from './routes/matches';
import conversationRoutes from './routes/conversations';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Meetiva API is running.'); // Updated name here too
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/searches', searchRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handler
app.use(errorMiddleware);


io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    console.log('User connected:', socket.id, 'UserId:', userId);

    // Securely join the user's specific room
    socket.join(userId);
    console.log(`User ${userId} joined room securely`);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = config.PORT;
console.log(`Attempting to listen on port ${PORT}...`);
server.listen(PORT, () => {
    console.log('==========================================');
    console.log(`🚀 JUNTO API READY`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Node Env: ${process.env.NODE_ENV}`);
    console.log('==========================================');
});

