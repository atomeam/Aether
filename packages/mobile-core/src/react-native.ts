/**
 * React Native integration utilities
 *
 * Provides React Native-specific utilities and components
 * that work across iOS, Android, and web platforms.
 */

import type { AppState } from './types';

/**
 * Check if running in React Native environment
 */
export function isReactNative(): boolean {
  return typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof Platform === 'undefined') return false;
  return (Platform as any).OS === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof Platform === 'undefined') return false;
  return (Platform as any).OS === 'android';
}

/**
 * Get platform (ios, android, or web)
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof Platform !== 'undefined') {
    return (Platform as any).OS as 'ios' | 'android';
  }
  return 'web';
}

/**
 * Safe dimensions hook replacement
 * Returns window dimensions on web, screen dimensions on mobile
 */
export function getDimensions(): { width: number; height: number } {
  if (typeof Dimensions !== 'undefined') {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  }
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: 375, height: 667 }; // Default fallback
}

/**
 * Get pixel ratio
 */
export function getPixelRatio(): number {
  if (typeof PixelRatio !== 'undefined') {
    return PixelRatio.get();
  }
  if (typeof window !== 'undefined' && window.devicePixelRatio) {
    return window.devicePixelRatio;
  }
  return 1;
}

/**
 * Convert font size based on pixel ratio
 */
export function getFontSize(size: number): number {
  const ratio = getPixelRatio();
  return size / ratio;
}

/**
 * Check if device has notch
 */
export function hasNotch(): boolean {
  if (typeof Platform !== 'undefined') {
    const platform = (Platform as any);
    if (platform.OS === 'ios') {
      return !platform.isPad && !platform.isTVOS && platform.Version >= 11;
    }
    if (platform.OS === 'android') {
      return platform.constants && platform.constants.StatusBarHeight > 24;
    }
  }
  return false;
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof SafeArea !== 'undefined') {
    return SafeArea.getSafeAreaInsetsForRootView();
  }
  if (typeof window !== 'undefined' && (window as any).safeAreaInsets) {
    return (window as any).safeAreaInsets;
  }
  return { top: 0, bottom: 0, left: 0, right: 0 };
}

/**
 * App state listener
 */
export class AppStateListener {
  private listeners: Map<string, (state: AppState) => void> = new Map();
  private currentState: AppState = 'active';

  constructor() {
    if (typeof AppState !== 'undefined') {
      (AppState as any).addEventListener('change', this.handleAppStateChange);
    }
  }

  private handleAppStateChange = (nextAppState: AppState) => {
    this.currentState = nextAppState;
    this.listeners.forEach((callback) => callback(nextAppState));
  };

  /**
   * Add listener for app state changes
   */
  addListener(id: string, callback: (state: AppState) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Remove listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppState {
    return this.currentState;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (typeof AppState !== 'undefined') {
      (AppState as any).removeEventListener('change', this.handleAppStateChange);
    }
    this.listeners.clear();
  }
}

/**
 * Keyboard utilities
 */
export class KeyboardUtils {
  /**
   * Show keyboard
   */
  static show(): void {
    if (typeof Keyboard !== 'undefined') {
      Keyboard.dismiss();
    }
  }

  /**
   * Hide keyboard
   */
  static dismiss(): void {
    if (typeof Keyboard !== 'undefined') {
      Keyboard.dismiss();
    }
  }

  /**
   * Get keyboard height
   */
  static getHeight(): number {
    if (typeof Keyboard !== 'undefined') {
      return (Keyboard as any).metrics().keyboardEndCoordinates.height;
    }
    return 0;
  }
}

/**
 * Linking utilities
 */
export class LinkingUtils {
  /**
   * Open URL
   */
  static async openURL(url: string): Promise<boolean> {
    if (typeof Linking !== 'undefined') {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
      return true;
    }
    return false;
  }

  /**
   * Check if URL can be opened
   */
  static async canOpenURL(url: string): Promise<boolean> {
    if (typeof Linking !== 'undefined') {
      return await Linking.canOpenURL(url);
    }
    return true;
  }

  /**
   * Get initial URL
   */
  static async getInitialURL(): Promise<string | null> {
    if (typeof Linking !== 'undefined') {
      return await Linking.getInitialURL();
    }
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return null;
  }
}

/**
 * Accessibility utilities
 */
export class AccessibilityUtils {
  /**
   * Check if screen reader is enabled
   */
  static async isScreenReaderEnabled(): Promise<boolean> {
    if (typeof AccessibilityInfo !== 'undefined') {
      return await AccessibilityInfo.isScreenReaderEnabled();
    }
    return false;
  }

  /**
   * Check if reduce motion is enabled
   */
  static async isReduceMotionEnabled(): Promise<boolean> {
    if (typeof AccessibilityInfo !== 'undefined') {
      return await AccessibilityInfo.isReduceMotionEnabled();
    }
    return false;
  }

  /**
   * Add accessibility change listener
   */
  static addChangeListener(
    handler: (enabled: boolean) => void
  ): { remove: () => void } {
    if (typeof AccessibilityInfo !== 'undefined') {
      const subscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        handler
      );
      return { remove: () => subscription.remove() };
    }
    return { remove: () => {} };
  }
}

/**
 * Haptic feedback utilities
 */
export class HapticUtils {
  /**
   * Trigger light haptic
   */
  static light(): void {
    if (typeof Haptics !== 'undefined') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  /**
   * Trigger medium haptic
   */
  static medium(): void {
    if (typeof Haptics !== 'undefined') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  /**
   * Trigger heavy haptic
   */
  static heavy(): void {
    if (typeof Haptics !== 'undefined') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  /**
   * Trigger selection haptic
   */
  static selection(): void {
    if (typeof Haptics !== 'undefined') {
      Haptics.selectionAsync();
    }
  }

  /**
   * Trigger notification haptic
   */
  static notification(type: 'success' | 'warning' | 'error'): void {
    if (typeof Haptics !== 'undefined') {
      const notificationType =
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error;
      Haptics.notificationAsync(notificationType);
    }
  }
}
