import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export const useProfile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get('/users/me');
            setProfile(res.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Profil yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = useCallback(async (data: any) => {
        try {
            const res = await client.patch('/users/me', data);
            setProfile(res.data);
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Profil güncellenemedi');
        }
    }, [fetchProfile]);

    const updateInterests = useCallback(async (interestIds: number[]) => {
        try {
            await client.put('/users/me/interests', { interest_ids: interestIds });
            await fetchProfile(); // Refresh to get updated list
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'İlgi alanları güncellenemedi');
        }
    }, [fetchProfile]);

    const fetchAllInterests = useCallback(async () => {
        try {
            const res = await client.get('/interests');
            return res.data;
        } catch (err: any) {
            console.error(err);
            return [];
        }
    }, []);

    const deleteAccount = useCallback(async () => {
        try {
            await client.delete('/users/me');
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Hesap silinemedi');
        }
    }, []);

    return {
        profile,
        loading,
        error,
        refreshProfile: fetchProfile,
        updateProfile,
        deleteAccount,
        updateInterests,
        fetchAllInterests
    };



};

