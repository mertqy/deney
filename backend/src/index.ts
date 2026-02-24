import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { errorMiddleware } from './middleware/errorMiddleware';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.set('io', io);

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import interestRoutes from './routes/interests';
import searchRoutes from './routes/searches';
import matchRoutes from './routes/matches';
import conversationRoutes from './routes/conversations';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Junto API is running.');
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
    console.log('User connected:', socket.id);

    // Users should join a room with their userId to receive private notifications
    socket.on('join', (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = config.PORT;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

