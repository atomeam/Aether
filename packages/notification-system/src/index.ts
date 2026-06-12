/**
 * @aether/notification-system - Notification System
 */

export class NotificationSystem {
  send(userId: string, message: string): void {
    console.log(`[NOTIFICATION] To ${userId}: ${message}`);
  }
}

export const notificationSystem = new NotificationSystem();