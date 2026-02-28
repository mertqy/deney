import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Use same IP as API_URL but without /api
const SOCKET_URL = 'https://deney-d2x5.onrender.com';

export const useSocket = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const initSocket = async () => {
            if (!user) {
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                }
                return;
            }

            if (!socket) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                const token = await AsyncStorage.getItem('accessToken');
                const newSocket = io(SOCKET_URL, {
                    auth: { token }
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected:', newSocket.id);
                    newSocket.emit('join', user.id);
                });

                newSocket.on('disconnect', () => {
                    console.log('Socket disconnected');
                });

                setSocket(newSocket);
            }
        };

        initSocket();

        return () => {
            // Keep socket alive during navigation if user is logged in
        };
    }, [user]);

    return socket;
};
