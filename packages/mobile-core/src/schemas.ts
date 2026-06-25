/**
 * Zod schemas for mobile development validation
 */

import { z } from 'zod';

/**
 * Device info schema
 */
export const DeviceInfoSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  model: z.string(),
  osVersion: z.string(),
  appVersion: z.string(),
  buildNumber: z.string(),
  isVirtual: z.boolean(),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

/**
 * Camera options schema
 */
export const CameraOptionsSchema = z.object({
  quality: z.number().min(0).max(100).optional(),
  allowEditing: z.boolean().optional(),
  resultType: z.enum(['base64', 'uri', 'dataUrl']).optional(),
  source: z.enum(['camera', 'photos', 'prompt']).optional(),
  saveToGallery: z.boolean().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  direction: z.enum(['rear', 'front']).optional(),
});

export type CameraOptions = z.infer<typeof CameraOptionsSchema>;

/**
 * Camera result schema
 */
export const CameraResultSchema = z.object({
  base64String: z.string().optional(),
  dataUrl: z.string().optional(),
  format: z.string().optional(),
  path: z.string().optional(),
  webPath: z.string().optional(),
});

export type CameraResult = z.infer<typeof CameraResultSchema>;

/**
 * Geolocation position schema
 */
export const GeolocationPositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  timestamp: z.number(),
});

export type GeolocationPosition = z.infer<typeof GeolocationPositionSchema>;

/**
 * Geolocation options schema
 */
export const GeolocationOptionsSchema = z.object({
  enableHighAccuracy: z.boolean().optional(),
  timeout: z.number().positive().optional(),
  maximumAge: z.number().nonnegative().optional(),
});

export type GeolocationOptions = z.infer<typeof GeolocationOptionsSchema>;

/**
 * Push notification token schema
 */
export const PushNotificationTokenSchema = z.object({
  value: z.string().min(1),
  type: z.enum(['fcm', 'apns', 'web']),
});

export type PushNotificationToken = z.infer<typeof PushNotificationTokenSchema>;

/**
 * Push notification payload schema
 */
export const PushNotificationPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  sound: z.string().optional(),
  badge: z.number().nonnegative().optional(),
});

export type PushNotificationPayload = z.infer<typeof PushNotificationPayloadSchema>;

/**
 * Haptic impact type schema
 */
export const HapticImpactTypeSchema = z.enum(['light', 'medium', 'heavy']);

export type HapticImpactType = z.infer<typeof HapticImpactTypeSchema>;

/**
 * Network status schema
 */
export const NetworkStatusSchema = z.object({
  connected: z.boolean(),
  connectionType: z.enum(['wifi', 'cellular', 'none', 'unknown']),
});

export type NetworkStatus = z.infer<typeof NetworkStatusSchema>;

/**
 * App state schema
 */
export const AppStateSchema = z.enum(['active', 'background', 'inactive']);

export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Permission state schema
 */
export const PermissionStateSchema = z.enum(['granted', 'denied', 'prompt', 'prompt-with-rationale']);

export type PermissionState = z.infer<typeof PermissionStateSchema>;

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Parse device info
 */
export function parseDeviceInfo(data: unknown): DeviceInfo {
  return DeviceInfoSchema.parse(data);
}

/**
 * Parse camera options
 */
export function parseCameraOptions(data: unknown): CameraOptions {
  return CameraOptionsSchema.parse(data);
}

/**
 * Parse camera result
 */
export function parseCameraResult(data: unknown): CameraResult {
  return CameraResultSchema.parse(data);
}

/**
 * Parse geolocation position
 */
export function parseGeolocationPosition(data: unknown): GeolocationPosition {
  return GeolocationPositionSchema.parse(data);
}

/**
 * Parse push notification token
 */
export function parsePushNotificationToken(data: unknown): PushNotificationToken {
  return PushNotificationTokenSchema.parse(data);
}

/**
 * Parse push notification payload
 */
export function parsePushNotificationPayload(data: unknown): PushNotificationPayload {
  return PushNotificationPayloadSchema.parse(data);
}
