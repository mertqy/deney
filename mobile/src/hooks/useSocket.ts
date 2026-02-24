import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Use same IP as API_URL but without /api
const SOCKET_URL = 'http://192.168.1.13:3000'; // UPDATED TO CURRENT IP

export const useSocket = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        if (!socket) {
            const newSocket = io(SOCKET_URL);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join', user.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            setSocket(newSocket);
        }

        return () => {
            // Keep socket alive during navigation if user is logged in
        };
    }, [user]);

    return socket;
};
