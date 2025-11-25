import { PushNotifications } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

/**
 * Initialize push notifications for native mobile
 * Requests permissions and registers for notifications
 */
export const initializePushNotifications = async () => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications only available on native platforms');
        return null;
    }

    try {
        // Request permission to use push notifications
        const permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive === 'granted') {
            // Register with Apple / Google to receive push via APNS/FCM
            await PushNotifications.register();
            console.log('Push notifications registered successfully');
        } else {
            console.log('Push notification permission denied');
            return null;
        }

        // Get FCM token
        const { token } = await FirebaseMessaging.getToken();
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error initializing push notifications:', error);
        return null;
    }
};

/**
 * Add listeners for push notification events
 */
export const addPushNotificationListeners = (callbacks = {}) => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    // Called when registration is successful
    PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        if (callbacks.onRegistration) {
            callbacks.onRegistration(token.value);
        }
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error: ', error);
        if (callbacks.onRegistrationError) {
            callbacks.onRegistrationError(error);
        }
    });

    // Called when a notification is received (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received (foreground): ', notification);
        if (callbacks.onNotificationReceived) {
            callbacks.onNotificationReceived(notification);
        }
    });

    // Called when user taps on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed: ', notification);
        if (callbacks.onNotificationTapped) {
            callbacks.onNotificationTapped(notification);
        }
    });
};

/**
 * Remove all push notification listeners
 */
export const removePushNotificationListeners = async () => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    await PushNotifications.removeAllListeners();
};

/**
 * Get the current FCM token
 */
export const getFCMToken = async () => {
    if (!Capacitor.isNativePlatform()) {
        return null;
    }

    try {
        const { token } = await FirebaseMessaging.getToken();
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};
