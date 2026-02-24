import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useSocket } from './useSocket';

export const useMatch = (matchId?: string) => {
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(!!matchId);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();

    const fetchMatch = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get(`/matches/${id}`);
            setMatch(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Eşleşme bilgisi alınamadı');
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptMatch = async (id: string) => {
        setActionLoading(true);
        try {
            const res = await client.post(`/matches/${id}/accept`);
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Kabul işlemi başarısız');
        } finally {
            setActionLoading(false);
        }
    };

    const declineMatch = async (id: string) => {
        setActionLoading(true);
        try {
            await client.post(`/matches/${id}/decline`);
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Reddetme işlemi başarısız');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (matchId) {
            fetchMatch(matchId);
        }
    }, [matchId, fetchMatch]);

    return {
        match,
        loading,
        actionLoading,
        error,
        acceptMatch,
        declineMatch,
        refreshMatch: () => matchId && fetchMatch(matchId)
    };
};
