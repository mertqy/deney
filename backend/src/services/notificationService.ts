import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
        return;
    }

    const messages: ExpoPushMessage[] = [{
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Notification sent:', ticketChunk);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
