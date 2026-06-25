/**
 * WebSocket Server Zod Schemas
 * 
 * Validation schemas for all WebSocket server types and configurations.
 */

import { z } from 'zod';

// WebSocket Message
export const WebSocketMessageSchema = z.object({
  type: z.string(),
  data: z.unknown().optional(),
  id: z.string().optional(),
  timestamp: z.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  room: z.string().optional(),
});

export type WebSocketMessageInput = z.infer<typeof WebSocketMessageSchema>;

// Connection
export const ConnectionSchema = z.object({
  id: z.string().uuid(),
  socket: z.any(), // WebSocket instance
  userId: z.string().optional(),
  rooms: z.set(z.string()),
  metadata: z.record(z.unknown()),
  connectedAt: z.number(),
  lastActivity: z.number(),
  isAuthenticated: z.boolean(),
});

export type ConnectionInput = z.infer<typeof ConnectionSchema>;

// Room
export const RoomSchema = z.object({
  name: z.string(),
  connections: z.set(z.string()),
  metadata: z.record(z.unknown()),
  createdAt: z.number(),
  maxConnections: z.number().int().positive().optional(),
});

export type RoomInput = z.infer<typeof RoomSchema>;

// Auth Config
export const AuthConfigSchema = z.object({
  enabled: z.boolean(),
  validateToken: z.function().optional(),
  getUserId: z.function().optional(),
  handshakeTimeout: z.number().positive().optional(),
});

export type AuthConfigInput = z.infer<typeof AuthConfigSchema>;

// Server Config
export const ServerConfigSchema = z.object({
  port: z.number().int().positive().optional(),
  host: z.string().optional(),
  path: z.string().optional(),
  auth: AuthConfigSchema.optional(),
  maxConnections: z.number().int().positive().optional(),
  heartbeatInterval: z.number().positive().optional(),
  heartbeatTimeout: z.number().positive().optional(),
  messageQueueSize: z.number().int().positive().optional(),
});

export type ServerConfigInput = z.infer<typeof ServerConfigSchema>;

// Message Handler
export const MessageHandlerSchema = z.object({
  type: z.string(),
  handler: z.function(),
});

export type MessageHandlerInput = z.infer<typeof MessageHandlerSchema>;

// Connection Event
export const ConnectionEventSchema = z.object({
  type: z.enum(['connect', 'disconnect', 'error']),
  connection: ConnectionSchema,
  error: z.instanceof(Error).optional(),
});

export type ConnectionEventInput = z.infer<typeof ConnectionEventSchema>;

// Room Event
export const RoomEventSchema = z.object({
  type: z.enum(['join', 'leave', 'create', 'delete']),
  room: z.string(),
  connectionId: z.string(),
});

export type RoomEventInput = z.infer<typeof RoomEventSchema>;

// Server Metrics
export const ServerMetricsSchema = z.object({
  totalConnections: z.number().int().nonnegative(),
  activeConnections: z.number().int().nonnegative(),
  totalRooms: z.number().int().nonnegative(),
  totalMessages: z.number().int().nonnegative(),
  messagesByType: z.record(z.number().int().nonnegative()),
  averageMessageLatency: z.number().nonnegative(),
  uptime: z.number().nonnegative(),
});

export type ServerMetricsInput = z.infer<typeof ServerMetricsSchema>;

// Broadcast Options
export const BroadcastOptionsSchema = z.object({
  excludeSelf: z.boolean().optional(),
  rooms: z.array(z.string()).optional(),
  users: z.array(z.string()).optional(),
  filter: z.function().optional(),
});

export type BroadcastOptionsInput = z.infer<typeof BroadcastOptionsSchema>;
