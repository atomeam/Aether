/**
 * Push Notifications - Cross-platform push notification support
 *
 * Provides unified push notification handling for iOS, Android, and web.
 */

import type { PushNotificationToken, PushNotificationPayload } from './types';

/**
 * Push notification registration result
 */
export interface PushRegistrationResult {
  token: PushNotificationToken;
  granted: boolean;
}

/**
 * Push notification event
 */
export interface PushNotificationEvent {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Push notification manager
 */
export class PushNotificationManager {
  private static listeners: Map<string, (event: PushNotificationEvent) => void> = new Map();
  private static tokenListeners: Map<string, (token: string) => void> = new Map();
  private static errorListeners: Map<string, (error: Error) => void> = new Map();

  /**
   * Register for push notifications
   */
  static async register(): Promise<PushRegistrationResult> {
    if (typeof PushNotifications !== 'undefined') {
      let result: PushRegistrationResult = {
        token: { value: '', type: 'fcm' },
        granted: false,
      };

      // Request permission
      const permissionResult = await PushNotifications.requestPermissions();
      result.granted = permissionResult.receive === 'granted';

      if (result.granted) {
        // Register for push
        await PushNotifications.register();

        // Get token
        const tokenResult = await new Promise<PushNotificationToken>((resolve) => {
          PushNotifications.addListener('registration', (token) => {
            resolve({
              value: token.value,
              type: 'fcm', // Default to FCM, can be detected based on platform
            });
          });
        });

        result.token = tokenResult;
      }

      return result;
    }

    // Web fallback - use Service Worker for push
    return this.webRegister();
  }

  /**
   * Get current push token
   */
  static async getToken(): Promise<PushNotificationToken | null> {
    if (typeof PushNotifications !== 'undefined') {
      try {
        const result = await PushNotifications.addListener('registration', (token) => ({
          value: token.value,
          type: 'fcm',
        }));
        return result;
      } catch {
        return null;
      }
    }

    // Web fallback
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          return {
            value: subscription.endpoint,
            type: 'web',
          };
        }
      }
    }

    return null;
  }

  /**
   * Add push notification listener
   */
  static addListener(id: string, callback: (event: PushNotificationEvent) => void): void {
    this.listeners.set(id, callback);

    if (typeof PushNotifications !== 'undefined') {
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        callback({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
      });
    } else {
      // Web fallback - listen for push events via service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'push-notification') {
            callback(event.data.payload);
          }
        });
      }
    }
  }

  /**
   * Add push notification tap listener
   */
  static addTapListener(id: string, callback: (event: PushNotificationEvent) => void): void {
    if (typeof PushNotifications !== 'undefined') {
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        callback({
          id: action.notificationId,
          title: action.notification?.title,
          body: action.notification?.body,
          data: action.notification?.data,
        });
      });
    }
  }

  /**
   * Add token refresh listener
   */
  static addTokenListener(id: string, callback: (token: string) => void): void {
    this.tokenListeners.set(id, callback);

    if (typeof PushNotifications !== 'undefined') {
      PushNotifications.addListener('registration', (token) => {
        callback(token.value);
      });
    }
  }

  /**
   * Add error listener
   */
  static addErrorListener(id: string, callback: (error: Error) => void): void {
    this.errorListeners.set(id, callback);

    if (typeof PushNotifications !== 'undefined') {
      PushNotifications.addListener('registrationError', (error) => {
        callback(new Error(error.error));
      });
    }
  }

  /**
   * Remove listener
   */
  static removeListener(id: string): void {
    this.listeners.delete(id);
    this.tokenListeners.delete(id);
    this.errorListeners.delete(id);
  }

  /**
   * Unregister from push notifications
   */
  static async unregister(): Promise<void> {
    if (typeof PushNotifications !== 'undefined') {
      // Capacitor doesn't have explicit unregister, but we can remove listeners
      this.listeners.clear();
      this.tokenListeners.clear();
      this.errorListeners.clear();
    }

    // Web fallback
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
    }
  }

  /**
   * Check permission status
   */
  static async checkPermissions(): Promise<PermissionState> {
    if (typeof PushNotifications !== 'undefined') {
      const result = await PushNotifications.checkPermissions();
      return result.receive as PermissionState;
    }

    // Web fallback
    if ('Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted') return 'granted';
      if (permission === 'denied') return 'denied';
      return 'prompt';
    }

    return 'denied';
  }

  /**
   * Request permissions
   */
  static async requestPermissions(): Promise<PermissionState> {
    if (typeof PushNotifications !== 'undefined') {
      const result = await PushNotifications.requestPermissions();
      return result.receive as PermissionState;
    }

    // Web fallback
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') return 'granted';
      if (permission === 'denied') return 'denied';
      return 'prompt';
    }

    return 'denied';
  }

  /**
   * Schedule local notification
   */
  static async schedule(payload: PushNotificationPayload, options: { at?: Date; scheduleId?: string } = {}): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: options.scheduleId ? parseInt(options.scheduleId, 10) : Date.now(),
            title: payload.title,
            body: payload.body,
            data: payload.data,
            schedule: options.at ? { at: options.at } : undefined,
            sound: payload.sound,
            actionTypeId: '',
          },
        ],
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Web fallback - show immediate notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.data?.icon as string,
        badge: payload.data?.badge as string,
      });
    }
  }

  /**
   * Cancel scheduled notification
   */
  static async cancel(scheduleId: string): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(scheduleId, 10) }],
      });
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAll(): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.cancel();
    }
  }

  /**
   * Get pending notifications
   */
  static async getPending(): Promise<PushNotificationEvent[]> {
    if (typeof LocalNotifications !== 'undefined') {
      const result = await LocalNotifications.getPending();
      return result.notifications.map((n) => ({
        id: n.id?.toString(),
        title: n.title,
        body: n.body,
        data: n.data as Record<string, unknown>,
      }));
    }
    return [];
  }

  /**
   * Get delivered notifications
   */
  static async getDelivered(): Promise<PushNotificationEvent[]> {
    if (typeof LocalNotifications !== 'undefined') {
      const result = await LocalNotifications.getDelivered();
      return result.notifications.map((n) => ({
        id: n.id?.toString(),
        title: n.title,
        body: n.body,
        data: n.data as Record<string, unknown>,
      }));
    }
    return [];
  }

  /**
   * Remove delivered notification
   */
  static async removeDelivered(scheduleId: string): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.removeDelivered({
        notifications: [{ id: parseInt(scheduleId, 10) }],
      });
    }
  }

  /**
   * Remove all delivered notifications
   */
  static async removeAllDelivered(): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.removeDelivered();
    }
  }

  /**
   * Create notification channel (Android only)
   */
  static async createChannel(options: {
    id: string;
    name: string;
    description: string;
    importance?: 'none' | 'min' | 'low' | 'default' | 'high';
    visibility?: 'secret' | 'private' | 'public';
    sound?: string;
    lights?: boolean;
    lightColor?: string;
    vibration?: boolean;
  }): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.createChannel({
        id: options.id,
        name: options.name,
        description: options.description,
        importance: options.importance ?? 'default',
        visibility: options.visibility ?? 'private',
        sound: options.sound,
        lights: options.lights,
        lightColor: options.lightColor,
        vibration: options.vibration,
      });
    }
  }

  /**
   * Delete notification channel (Android only)
   */
  static async deleteChannel(channelId: string): Promise<void> {
    if (typeof LocalNotifications !== 'undefined') {
      await LocalNotifications.deleteChannel({ id: channelId });
    }
  }

  /**
   * List notification channels (Android only)
   */
  static async listChannels(): Promise<{ id: string; name: string; description: string }[]> {
    if (typeof LocalNotifications !== 'undefined') {
      const result = await LocalNotifications.listChannels();
      return result.channels;
    }
    return [];
  }

  private static async webRegister(): Promise<PushRegistrationResult> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return {
        token: { value: '', type: 'web' },
        granted: false,
      };
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            process.env.VAPID_PUBLIC_KEY || ''
          ),
        });

        return {
          token: {
            value: subscription.endpoint,
            type: 'web',
          },
          granted: true,
        };
      }

      return {
        token: { value: '', type: 'web' },
        granted: false,
      };
    } catch (error) {
      console.error('Web push registration error:', error);
      return {
        token: { value: '', type: 'web' },
        granted: false,
      };
    }
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

/**
 * Local notification manager
 */
export class LocalNotificationManager {
  /**
   * Schedule a local notification
   */
  static async schedule(
    title: string,
    body: string,
    options: {
      id?: string;
      at?: Date;
      data?: Record<string, unknown>;
      sound?: string;
    } = {}
  ): Promise<void> {
    await PushNotificationManager.schedule(
      { title, body, data: options.data, sound: options.sound },
      { at: options.at, scheduleId: options.id }
    );
  }

  /**
   * Show immediate notification
   */
  static async show(
    title: string,
    body: string,
    options: {
      id?: string;
      data?: Record<string, unknown>;
      sound?: string;
    } = {}
  ): Promise<void> {
    await PushNotificationManager.schedule(
      { title, body, data: options.data, sound: options.sound },
      { scheduleId: options.id }
    );
  }

  /**
   * Cancel notification
   */
  static async cancel(id: string): Promise<void> {
    await PushNotificationManager.cancel(id);
  }

  /**
   * Cancel all notifications
   */
  static async cancelAll(): Promise<void> {
    await PushNotificationManager.cancelAll();
  }
}
