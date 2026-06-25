/**
 * WebSocket Server Types
 * 
 * Core types for the WebSocket server including connection management,
 * room management, message broadcasting, and authentication.
 */

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  id?: string;
  timestamp?: number;
  from?: string;
  to?: string;
  room?: string;
}

export interface Connection {
  id: string;
  socket: unknown; // WebSocket instance
  userId?: string;
  rooms: Set<string>;
  metadata: Record<string, unknown>;
  connectedAt: number;
  lastActivity: number;
  isAuthenticated: boolean;
}

export interface Room {
  name: string;
  connections: Set<string>;
  metadata: Record<string, unknown>;
  createdAt: number;
  maxConnections?: number;
}

export interface AuthConfig {
  enabled: boolean;
  validateToken?: (token: string) => Promise<boolean> | boolean;
  getUserId?: (token: string) => Promise<string> | string;
  handshakeTimeout?: number;
}

export interface ServerConfig {
  port?: number;
  host?: string;
  path?: string;
  auth?: AuthConfig;
  maxConnections?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  messageQueueSize?: number;
}

export interface MessageHandler {
  type: string;
  handler: (message: WebSocketMessage, connection: Connection) => Promise<void> | void;
}

export interface ConnectionEvent {
  type: 'connect' | 'disconnect' | 'error';
  connection: Connection;
  error?: Error;
}

export interface RoomEvent {
  type: 'join' | 'leave' | 'create' | 'delete';
  room: string;
  connectionId: string;
}

export interface ServerMetrics {
  totalConnections: number;
  activeConnections: number;
  totalRooms: number;
  totalMessages: number;
  messagesByType: Record<string, number>;
  averageMessageLatency: number;
  uptime: number;
}

export interface BroadcastOptions {
  excludeSelf?: boolean;
  rooms?: string[];
  users?: string[];
  filter?: (connection: Connection) => boolean;
}
