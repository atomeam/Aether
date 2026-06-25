/**
 * Device APIs - Unified access to device features
 *
 * Provides a unified interface to device capabilities
 * regardless of the underlying framework (React Native or Capacitor).
 */

import type {
  CameraOptions,
  CameraResult,
  GeolocationPosition,
  GeolocationOptions,
  NetworkStatus,
  PermissionState,
  HapticImpactType,
} from './types';
import { CameraPlugin } from './capacitor';

/**
 * Unified Camera API
 */
export class CameraAPI {
  /**
   * Take a photo or select from gallery
   */
  static async getPhoto(options: CameraOptions = {}): Promise<CameraResult> {
    return CameraPlugin.getPhoto(options);
  }

  /**
   * Check camera permissions
   */
  static async checkPermissions(): Promise<PermissionState> {
    return CameraPlugin.checkPermissions();
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<PermissionState> {
    return CameraPlugin.requestPermissions();
  }
}

/**
 * Unified Geolocation API
 */
export class GeolocationAPI {
  private static watchId: string | null = null;

  /**
   * Get current position
   */
  static async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<GeolocationPosition> {
    const { GeolocationPlugin } = await import('./capacitor');
    return GeolocationPlugin.getCurrentPosition(options);
  }

  /**
   * Watch position changes
   */
  static async watchPosition(
    callback: (position: GeolocationPosition) => void,
    options: GeolocationOptions = {}
  ): Promise<string> {
    const { GeolocationPlugin } = await import('./capacitor');
    this.watchId = GeolocationPlugin.watchPosition(callback, options);
    return this.watchId;
  }

  /**
   * Clear position watch
   */
  static async clearWatch(): Promise<void> {
    if (this.watchId) {
      const { GeolocationPlugin } = await import('./capacitor');
      GeolocationPlugin.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

/**
 * Unified Network API
 */
export class NetworkAPI {
  private static listenerId = 'network-api-listener';

  /**
   * Get current network status
   */
  static async getStatus(): Promise<NetworkStatus> {
    const { NetworkPlugin } = await import('./capacitor');
    return NetworkPlugin.getStatus();
  }

  /**
   * Add network status listener
   */
  static async addListener(callback: (status: NetworkStatus) => void): Promise<void> {
    const { NetworkPlugin } = await import('./capacitor');
    NetworkPlugin.addListener(this.listenerId, callback);
  }

  /**
   * Remove network status listener
   */
  static async removeListener(): Promise<void> {
    const { NetworkPlugin } = await import('./capacitor');
    NetworkPlugin.removeListener(this.listenerId);
  }

  /**
   * Check if online
   */
  static async isOnline(): Promise<boolean> {
    const status = await this.getStatus();
    return status.connected;
  }
}

/**
 * Unified Haptics API
 */
export class HapticsAPI {
  /**
   * Trigger haptic impact
   */
  static async impact(style: HapticImpactType): Promise<void> {
    const { HapticsPlugin } = await import('./capacitor');
    await HapticsPlugin.impact(style);
  }

  /**
   * Trigger haptic notification
   */
  static async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    const { HapticsPlugin } = await import('./capacitor');
    await HapticsPlugin.notification(type);
  }

  /**
   * Trigger haptic selection
   */
  static async selection(): Promise<void> {
    const { HapticsPlugin } = await import('./capacitor');
    await HapticsPlugin.selection();
  }
}

/**
 * Unified Device API
 */
export class DeviceAPI {
  /**
   * Get device information
   */
  static async getInfo() {
    const { DevicePlugin } = await import('./capacitor');
    return DevicePlugin.getInfo();
  }

  /**
   * Get device ID
   */
  static async getId(): Promise<string> {
    const { DevicePlugin } = await import('./capacitor');
    return DevicePlugin.getId();
  }

  /**
   * Get battery info
   */
  static async getBatteryInfo(): Promise<{ level: number; isCharging: boolean }> {
    const { DevicePlugin } = await import('./capacitor');
    return DevicePlugin.getBatteryInfo();
  }
}

/**
 * Unified Clipboard API
 */
export class ClipboardAPI {
  /**
   * Write text to clipboard
   */
  static async write(text: string): Promise<void> {
    const { ClipboardPlugin } = await import('./capacitor');
    await ClipboardPlugin.write(text);
  }

  /**
   * Read text from clipboard
   */
  static async read(): Promise<string> {
    const { ClipboardPlugin } = await import('./capacitor');
    return ClipboardPlugin.read();
  }
}

/**
 * Unified App API
 */
export class AppAPI {
  /**
   * Get app info
   */
  static async getInfo() {
    const { AppPlugin } = await import('./capacitor');
    return AppPlugin.getInfo();
  }

  /**
   * Add app state listener
   */
  static addListener(callback: (state: { isActive: boolean }) => void): void {
    const { AppPlugin } = require('./capacitor');
    AppPlugin.addListener(callback);
  }

  /**
   * Minimize app
   */
  static async minimizeApp(): Promise<void> {
    const { AppPlugin } = await import('./capacitor');
    await AppPlugin.minimizeApp();
  }
}

/**
 * Unified SplashScreen API
 */
export class SplashScreenAPI {
  /**
   * Show splash screen
   */
  static async show(options: { showDuration?: number; autoHide?: boolean } = {}): Promise<void> {
    const { SplashScreenPlugin } = await import('./capacitor');
    await SplashScreenPlugin.show(options);
  }

  /**
   * Hide splash screen
   */
  static async hide(): Promise<void> {
    const { SplashScreenPlugin } = await import('./capacitor');
    await SplashScreenPlugin.hide();
  }
}

/**
 * Unified StatusBar API
 */
export class StatusBarAPI {
  /**
   * Set status bar style
   */
  static async setStyle(style: 'dark' | 'light'): Promise<void> {
    const { StatusBarPlugin } = await import('./capacitor');
    await StatusBarPlugin.setStyle(style);
  }

  /**
   * Set status bar background color
   */
  static async setBackgroundColor(color: string): Promise<void> {
    const { StatusBarPlugin } = await import('./capacitor');
    await StatusBarPlugin.setBackgroundColor(color);
  }

  /**
   * Hide status bar
   */
  static async hide(): Promise<void> {
    const { StatusBarPlugin } = await import('./capacitor');
    await StatusBarPlugin.hide();
  }

  /**
   * Show status bar
   */
  static async show(): Promise<void> {
    const { StatusBarPlugin } = await import('./capacitor');
    await StatusBarPlugin.show();
  }

  /**
   * Set status bar overlay
   */
  static async setOverlaysWebView(overlay: boolean): Promise<void> {
    const { StatusBarPlugin } = await import('./capacitor');
    await StatusBarPlugin.setOverlaysWebView(overlay);
  }
}

/**
 * Permission manager
 */
export class PermissionManager {
  /**
   * Check camera permission
   */
  static async checkCamera(): Promise<PermissionState> {
    return CameraAPI.checkPermissions();
  }

  /**
   * Request camera permission
   */
  static async requestCamera(): Promise<PermissionState> {
    return CameraAPI.requestPermissions();
  }

  /**
   * Check geolocation permission
   */
  static async checkGeolocation(): Promise<PermissionState> {
    const { GeolocationPlugin } = await import('./capacitor');
    // Capacitor Geolocation doesn't have explicit permission check
    // We'll try to get position and catch any permission errors
    try {
      await GeolocationPlugin.getCurrentPosition({ timeout: 100 });
      return 'granted';
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Request geolocation permission
   */
  static async requestGeolocation(): Promise<PermissionState> {
    const { GeolocationPlugin } = await import('./capacitor');
    try {
      await GeolocationPlugin.getCurrentPosition({ timeout: 10000 });
      return 'granted';
    } catch (error) {
      return 'denied';
    }
  }
}
