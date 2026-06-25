/**
 * @aether/websocket-server
 * 
 * Production-ready WebSocket server with real-time communication,
 * room management, message broadcasting, connection management, and authentication.
 */

// Types
export type {
  WebSocketMessage,
  Connection,
  Room,
  AuthConfig,
  ServerConfig,
  MessageHandler,
  ConnectionEvent,
  RoomEvent,
  ServerMetrics,
  BroadcastOptions,
} from './types.js';

// Schemas
export {
  WebSocketMessageSchema,
  ConnectionSchema,
  RoomSchema,
  AuthConfigSchema,
  ServerConfigSchema,
  MessageHandlerSchema,
  ConnectionEventSchema,
  RoomEventSchema,
  ServerMetricsSchema,
  BroadcastOptionsSchema,
  type WebSocketMessageInput,
  type ConnectionInput,
  type RoomInput,
  type AuthConfigInput,
  type ServerConfigInput,
  type MessageHandlerInput,
  type ConnectionEventInput,
  type RoomEventInput,
  type ServerMetricsInput,
  type BroadcastOptionsInput,
} from './schemas.js';

// Core Classes
export { WebSocketServer } from './server.js';
export { ConnectionManager } from './connection-manager.js';
export { RoomManager } from './room-manager.js';
export { Broadcaster } from './broadcaster.js';
export { AuthManager } from './auth-manager.js';
