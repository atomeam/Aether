/**
 * TypeScript types for mobile development
 */

/**
 * Device information
 */
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  model: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  isVirtual: boolean;
}

/**
 * Camera options
 */
export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: 'base64' | 'uri' | 'dataUrl';
  source?: 'camera' | 'photos' | 'prompt';
  saveToGallery?: boolean;
  width?: number;
  height?: number;
  direction?: 'rear' | 'front';
}

/**
 * Camera result
 */
export interface CameraResult {
  base64String?: string;
  dataUrl?: string;
  format?: string;
  path?: string;
  webPath?: string;
}

/**
 * Geolocation position
 */
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

/**
 * Geolocation options
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Push notification token
 */
export interface PushNotificationToken {
  value: string;
  type: 'fcm' | 'apns' | 'web';
}

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

/**
 * Haptic impact type
 */
export type HapticImpactType = 'light' | 'medium' | 'heavy';

/**
 * Network status
 */
export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

/**
 * App state
 */
export type AppState = 'active' | 'background' | 'inactive';

/**
 * Permission status
 */
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
