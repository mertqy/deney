import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CONFIG } from './config';

export const API_URL = CONFIG.API_URL;


const client = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 saniye timeout ekle (ilerlememe sorununu anlamak için)
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    // Axios leading slash behavior fix: Prepend path correctly to baseURL
    if (config.url && config.url.startsWith('/')) {
        config.url = config.url.substring(1);
    }

    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.error('AsyncStorage error in interceptor:', e);
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = res.data;

                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return client(originalRequest);
            } catch (err) {
                // If refresh fails, we should logout
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                await AsyncStorage.removeItem('user');
                // You might want to use some global event emitter or hook to navigate to Login
            }
        }
        return Promise.reject(error);
    }
);

export default client;

