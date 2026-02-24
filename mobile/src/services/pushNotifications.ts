import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import client from '../api/client';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.warn('Push bildirim izni verilmedi.');
            return;
        }

        try {
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);
        } catch (e) {
            console.warn('Push token alınamadı (Muhtemelen emulator kullanımı veya Proje ID eksikliği):', e);
        }
    } else {
        console.log('Push bildirimleri için fiziksel cihaz gereklidir.');
    }

    return token;
}

export async function sendPushTokenToBackend(token: string) {
    try {
        await client.post('/users/me/push-token', { token });
        console.log('Push token sent to backend');
    } catch (err) {
        console.error('Failed to send push token to backend', err);
    }
}
