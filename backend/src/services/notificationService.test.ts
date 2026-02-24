import { sendPushNotification } from './notificationService';
import { Expo } from 'expo-server-sdk';

jest.mock('expo-server-sdk', () => {
    const mockExpo = jest.fn().mockImplementation(() => {
        return {
            chunkPushNotifications: jest.fn().mockReturnValue([[{ to: 'token-123' }]]),
            sendPushNotificationsAsync: jest.fn().mockResolvedValue([{ status: 'ok', id: '123' }]),
        };
    });
    (mockExpo as any).isExpoPushToken = jest.fn();
    return {
        Expo: mockExpo,
    };
});


describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (Expo.isExpoPushToken as any).mockReturnValue(true);
    });

    it('should send push notification when token is valid', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await sendPushNotification('token-123', 'Test Title', 'Test Body');

        expect(Expo.isExpoPushToken).toHaveBeenCalledWith('token-123');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Notification sent:'), expect.anything());

        consoleSpy.mockRestore();
    });

    it('should not send notification and log error if token is invalid', async () => {
        (Expo.isExpoPushToken as any).mockReturnValue(false);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await sendPushNotification('invalid-token', 'Title', 'Body');

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('is not a valid Expo push token'));

        consoleSpy.mockRestore();
    });

});
