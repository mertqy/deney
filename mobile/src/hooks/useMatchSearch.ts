import { useState, useEffect } from 'react';
import client from '../api/client';
import { useSocket } from './useSocket';

export const useMatchSearch = (searchId: string, onMatchFound: (matchId: string) => void) => {
    const socket = useSocket();
    const [isSearching, setIsSearching] = useState(true);

    useEffect(() => {
        const checkExistingMatch = async () => {
            try {
                const res = await client.get(`/matches/by-search/${searchId}`);
                if (res.data && res.data.id) {
                    onMatchFound(res.data.id);
                }
            } catch (e) {
                // Not matched yet
            }
        };

        checkExistingMatch();

        if (socket) {
            socket.on('match_found', (data: { matchId: string }) => {
                onMatchFound(data.matchId);
            });
        }

        return () => {
            if (socket) socket.off('match_found');
        };
    }, [socket, searchId, onMatchFound]);

    const cancelSearch = async () => {
        try {
            await client.delete(`/searches/${searchId}`);
            setIsSearching(false);
        } catch (err) {
            console.error('Cancel search failed', err);
            throw err;
        }
    };

    return { isSearching, cancelSearch };
};
