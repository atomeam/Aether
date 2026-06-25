/**
 * Capacitor integration utilities
 *
 * Provides Capacitor plugin wrappers and utilities
 * for cross-platform mobile development.
 */

import type {
  DeviceInfo,
  CameraOptions,
  CameraResult,
  GeolocationPosition,
  GeolocationOptions,
  NetworkStatus,
  PermissionState,
  HapticImpactType,
} from './types';

/**
 * Check if Capacitor is available
 */
export function isCapacitorAvailable(): boolean {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Check if running in web mode
 */
export function isWeb(): boolean {
  return typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'web';
}

/**
 * Get Capacitor platform
 */
export function getCapacitorPlatform(): 'ios' | 'android' | 'web' {
  if (typeof Capacitor !== 'undefined') {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }
  return 'web';
}

/**
 * Device plugin wrapper
 */
export class DevicePlugin {
  /**
   * Get device information
   */
  static async getInfo(): Promise<DeviceInfo> {
    if (typeof Device !== 'undefined') {
      const info = await Device.getId();
      const deviceInfo = await Device.getInfo();
      return {
        platform: deviceInfo.platform as 'ios' | 'android' | 'web',
        model: deviceInfo.model,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        buildNumber: deviceInfo.build,
        isVirtual: deviceInfo.isVirtual,
      };
    }
    // Web fallback
    return {
      platform: 'web',
      model: navigator.userAgent,
      osVersion: navigator.userAgent,
      appVersion: '1.0.0',
      buildNumber: '1',
      isVirtual: false,
    };
  }

  /**
   * Get device ID
   */
  static async getId(): Promise<string> {
    if (typeof Device !== 'undefined') {
      const info = await Device.getId();
      return info.identifier;
    }
    // Web fallback - generate UUID
    return this.generateUUID();
  }

  /**
   * Get battery info
   */
  static async getBatteryInfo(): Promise<{ level: number; isCharging: boolean }> {
    if (typeof Device !== 'undefined') {
      const info = await Device.getBatteryInfo();
      return {
        level: info.batteryLevel,
        isCharging: info.isCharging,
      };
    }
    // Web fallback
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      return {
        level: battery.level,
        isCharging: battery.charging,
      };
    }
    return { level: 1, isCharging: false };
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Camera plugin wrapper
 */
export class CameraPlugin {
  /**
   * Take a photo or select from gallery
   */
  static async getPhoto(options: CameraOptions = {}): Promise<CameraResult> {
    if (typeof Camera !== 'undefined') {
      const result = await Camera.getPhoto({
        quality: options.quality ?? 90,
        allowEditing: options.allowEditing ?? false,
        resultType: options.resultType === 'base64' 
          ? Camera.ResultType.Base64 
          : options.resultType === 'dataUrl'
          ? Camera.ResultType.DataUrl
          : Camera.ResultType.Uri,
        source: options.source === 'camera'
          ? Camera.Source.Camera
          : options.source === 'photos'
          ? Camera.Source.Photos
          : Camera.Source.Prompt,
        saveToGallery: options.saveToGallery ?? false,
        width: options.width,
        height: options.height,
        direction: options.direction === 'front'
          ? Camera.Direction.Front
          : Camera.Direction.Rear,
      });

      return {
        base64String: result.base64String,
        dataUrl: result.dataUrl,
        format: result.format,
        path: result.path,
        webPath: result.webPath,
      };
    }

    // Web fallback - use file input
    return this.webGetPhoto(options);
  }

  /**
   * Check camera permissions
   */
  static async checkPermissions(): Promise<PermissionState> {
    if (typeof Camera !== 'undefined') {
      const status = await Camera.checkPermissions();
      return status.camera as PermissionState;
    }
    return 'prompt';
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<PermissionState> {
    if (typeof Camera !== 'undefined') {
      const status = await Camera.requestPermissions();
      return status.camera as PermissionState;
    }
    return 'prompt';
  }

  private static async webGetPhoto(options: CameraOptions): Promise<CameraResult> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (options.source === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              dataUrl: event.target?.result as string,
              format: file.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.click();
    });
  }
}

/**
 * Geolocation plugin wrapper
 */
export class GeolocationPlugin {
  /**
   * Get current position
   */
  static async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<GeolocationPosition> {
    if (typeof Geolocation !== 'undefined') {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? false,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 0,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    }

    // Web fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not available'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        reject,
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 0,
        }
      );
    });
  }

  /**
   * Watch position changes
   */
  static watchPosition(
    callback: (position: GeolocationPosition) => void,
    options: GeolocationOptions = {}
  ): string {
    if (typeof Geolocation !== 'undefined') {
      const id = Geolocation.watchPosition(
        options,
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        (error) => console.error('Geolocation error:', error)
      );
      return id.toString();
    }

    // Web fallback
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        (error) => console.error('Geolocation error:', error),
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 0,
        }
      );
      return id.toString();
    }

    return 'web-fallback';
  }

  /**
   * Clear position watch
   */
  static clearWatch(id: string): void {
    if (typeof Geolocation !== 'undefined') {
      Geolocation.clearWatch({ id });
    } else if (navigator.geolocation) {
      navigator.geolocation.clearWatch(parseInt(id, 10));
    }
  }
}

/**
 * Network plugin wrapper
 */
export class NetworkPlugin {
  private static listeners: Map<string, (status: NetworkStatus) => void> = new Map();

  /**
   * Get current network status
   */
  static async getStatus(): Promise<NetworkStatus> {
    if (typeof Network !== 'undefined') {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType as 'wifi' | 'cellular' | 'none' | 'unknown',
      };
    }

    // Web fallback
    if (navigator.onLine) {
      return {
        connected: true,
        connectionType: 'unknown',
      };
    }
    return {
      connected: false,
      connectionType: 'none',
    };
  }

  /**
   * Add network status listener
   */
  static addListener(id: string, callback: (status: NetworkStatus) => void): void {
    this.listeners.set(id, callback);

    if (typeof Network !== 'undefined') {
      Network.addListener('networkStatusChange', (status) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType as 'wifi' | 'cellular' | 'none' | 'unknown',
        });
      });
    } else {
      // Web fallback
      const handler = () => {
        callback({
          connected: navigator.onLine,
          connectionType: 'unknown',
        });
      };
      window.addEventListener('online', handler);
      window.addEventListener('offline', handler);
    }
  }

  /**
   * Remove network status listener
   */
  static removeListener(id: string): void {
    this.listeners.delete(id);
  }
}

/**
 * Haptics plugin wrapper
 */
export class HapticsPlugin {
  /**
   * Trigger haptic impact
   */
  static async impact(style: HapticImpactType): Promise<void> {
    if (typeof Haptics !== 'undefined') {
      const impactStyle =
        style === 'light'
          ? Haptics.ImpactStyle.Light
          : style === 'medium'
          ? Haptics.ImpactStyle.Medium
          : Haptics.ImpactStyle.Heavy;
      await Haptics.impact({ style: impactStyle });
    }
  }

  /**
   * Trigger haptic notification
   */
  static async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (typeof Haptics !== 'undefined') {
      const notificationType =
        type === 'success'
          ? Haptics.NotificationType.Success
          : type === 'warning'
          ? Haptics.NotificationType.Warning
          : Haptics.NotificationType.Error;
      await Haptics.notification({ type: notificationType });
    }
  }

  /**
   * Trigger haptic selection
   */
  static async selection(): Promise<void> {
    if (typeof Haptics !== 'undefined') {
      await Haptics.selection();
    }
  }
}

/**
 * App plugin wrapper
 */
export class AppPlugin {
  /**
   * Get app info
   */
  static async getInfo(): Promise<{ name: string; id: string; build: string; version: string }> {
    if (typeof App !== 'undefined') {
      const info = await App.getInfo();
      return {
        name: info.name,
        id: info.id,
        build: info.build,
        version: info.version,
      };
    }
    return {
      name: 'Web App',
      id: 'web',
      build: '1',
      version: '1.0.0',
    };
  }

  /**
   * Add app state listener
   */
  static addListener(callback: (state: { isActive: boolean }) => void): void {
    if (typeof App !== 'undefined') {
      App.addListener('appStateChange', callback);
    } else {
      // Web fallback
      document.addEventListener('visibilitychange', () => {
        callback({ isActive: !document.hidden });
      });
    }
  }

  /**
   * Minimize app
   */
  static async minimizeApp(): Promise<void> {
    if (typeof App !== 'undefined') {
      await App.minimizeApp();
    }
  }
}

/**
 * Clipboard plugin wrapper
 */
export class ClipboardPlugin {
  /**
   * Write text to clipboard
   */
  static async write(text: string): Promise<void> {
    if (typeof Clipboard !== 'undefined') {
      await Clipboard.write({ string: text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }

  /**
   * Read text from clipboard
   */
  static async read(): Promise<string> {
    if (typeof Clipboard !== 'undefined') {
      const result = await Clipboard.read();
      return result.value;
    } else if (navigator.clipboard) {
      return await navigator.clipboard.readText();
    }
    return '';
  }
}

/**
 * SplashScreen plugin wrapper
 */
export class SplashScreenPlugin {
  /**
   * Show splash screen
   */
  static async show(options: { showDuration?: number; autoHide?: boolean } = {}): Promise<void> {
    if (typeof SplashScreen !== 'undefined') {
      await SplashScreen.show({
        showDuration: options.showDuration,
        autoHide: options.autoHide,
      });
    }
  }

  /**
   * Hide splash screen
   */
  static async hide(): Promise<void> {
    if (typeof SplashScreen !== 'undefined') {
      await SplashScreen.hide();
    }
  }
}

/**
 * StatusBar plugin wrapper
 */
export class StatusBarPlugin {
  /**
   * Set status bar style
   */
  static async setStyle(style: 'dark' | 'light'): Promise<void> {
    if (typeof StatusBar !== 'undefined') {
      await StatusBar.setStyle({
        style: style === 'dark' ? StatusBar.Style.Dark : StatusBar.Style.Light,
      });
    }
  }

  /**
   * Set status bar background color
   */
  static async setBackgroundColor(color: string): Promise<void> {
    if (typeof StatusBar !== 'undefined') {
      await StatusBar.setBackgroundColor({ color });
    }
  }

  /**
   * Hide status bar
   */
  static async hide(): Promise<void> {
    if (typeof StatusBar !== 'undefined') {
      await StatusBar.hide();
    }
  }

  /**
   * Show status bar
   */
  static async show(): Promise<void> {
    if (typeof StatusBar !== 'undefined') {
      await StatusBar.show();
    }
  }

  /**
   * Set status bar overlay
   */
  static async setOverlaysWebView(overlay: boolean): Promise<void> {
    if (typeof StatusBar !== 'undefined') {
      await StatusBar.setOverlaysWebView({ overlay });
    }
  }
}
