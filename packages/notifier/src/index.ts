/**
 * Notifier
 *
 * Slack/webhook notifications for alerts.
 * NOTE: EventEmitter not compatible with Workers
 * Use simple callback pattern or Workers-compatible event system
 */

// import { EventEmitter } from 'events';

// Notification types
export type NotificationChannel = 'slack' | 'webhook' | 'email';

export interface Notification {
  id: string;
  channel: NotificationChannel;
  to: string; // webhook URL or channel name
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
}

// Events
export const Events = {
  NOTIFICATION: 'notification',
} as const;

// Simple callback-based notification system (Workers-compatible)
export class Notifier {
  private channels = new Map<string, { type: NotificationChannel; config: Record<string, string> }>();
  private callbacks: Array<(notification: Notification) => void> = [];

  // Register a channel
  registerChannel(name: string, type: NotificationChannel, config: Record<string, string>) {
    this.channels.set(name, { type, config });
    this.callbacks.forEach(cb => cb({
      id: Math.random().toString(36).substring(2, 15),
      channel: type,
      to: name,
      message: `Channel registered: ${name}`,
      severity: 'info',
      timestamp: Date.now(),
    }));
  }

  // Add callback for notifications
  onNotification(callback: (notification: Notification) => void) {
    this.callbacks.push(callback);
  }

  // Send notification
  async notify(options: {
    channel?: string;
    message: string;
    severity?: Notification['severity'];
  }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    const { channel = 'default', message, severity = 'info' } = options;
    
    const channelConfig = this.channels.get(channel);
    if (!channelConfig) {
      return { success: false, error: `Unknown channel: ${channel}` };
    }
    
    const notification: Notification = {
      id: Math.random().toString(36).substring(2, 15),
      channel: channelConfig.type,
      to: channelConfig.config.url || '',
      message,
      severity,
      timestamp: Date.now(),
    };

    // In production, actually send
    // For now, invoke callbacks
    this.callbacks.forEach(cb => cb(notification));

    return { success: true, notificationId: notification.id };
  }

  // Send to multiple channels
  async broadcast(message: string, severity: Notification['severity'] = 'info') {
    const results = [];

    for (const [name, config] of this.channels) {
      const result = await this.notify({ channel: name, message, severity });
      results.push({ channel: name, ...result });
    }
    
    return results;
  }
  
  // List channels
  listChannels() {
    return Array.from(this.channels.keys());
  }
}

// Default instance
export const notifier = new Notifier();

// Helper: simple webhook POST
export async function sendWebhook(url: string, payload: unknown): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

import crypto from 'crypto';