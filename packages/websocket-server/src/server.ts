/**
 * WebSocket Server
 * 
 * Main WebSocket server class that orchestrates connection management,
 * room management, broadcasting, and authentication.
 */

import type {
  ServerConfig,
  WebSocketMessage,
  MessageHandler,
  ServerMetrics,
} from './types.js';
import { ConnectionManager } from './connection-manager.js';
import { RoomManager } from './room-manager.js';
import { Broadcaster } from './broadcaster.js';
import { AuthManager } from './auth-manager.js';
import { randomUUID } from 'crypto';

export class WebSocketServer {
  private config: Required<ServerConfig>;
  private connectionManager: ConnectionManager;
  private roomManager: RoomManager;
  private broadcaster: Broadcaster;
  private authManager: AuthManager;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private metrics: ServerMetrics;
  private startTime: number;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      path: config.path || '/ws',
      auth: config.auth || { enabled: false },
      maxConnections: config.maxConnections || 1000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      heartbeatTimeout: config.heartbeatTimeout || 60000,
      messageQueueSize: config.messageQueueSize || 100,
    };

    this.connectionManager = new ConnectionManager();
    this.roomManager = new RoomManager();
    this.broadcaster = new Broadcaster(this.connectionManager, this.roomManager);
    this.authManager = new AuthManager(this.config.auth);

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalRooms: 0,
      totalMessages: 0,
      messagesByType: {},
      averageMessageLatency: 0,
      uptime: 0,
    };

    this.startTime = Date.now();

    // Setup heartbeat
    this.setupHeartbeat();

    // Setup connection event listeners
    this.setupConnectionListeners();
    this.setupRoomListeners();
  }

  /**
   * Register a message handler
   */
  onMessage(type: string, handler: MessageHandler['handler']): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push({ type, handler });
  }

  /**
   * Remove a message handler
   */
  offMessage(type: string, handler: MessageHandler['handler']): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message: WebSocketMessage, connectionId: string): Promise<void> {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) return;

    const startTime = Date.now();

    // Update metrics
    this.metrics.totalMessages++;
    this.metrics.messagesByType[message.type] =
      (this.metrics.messagesByType[message.type] || 0) + 1;

    // Add message metadata
    message.id = message.id || randomUUID();
    message.timestamp = message.timestamp || Date.now();
    message.from = connectionId;

    // Find and execute handler
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      for (const { handler } of handlers) {
        try {
          await handler(message, connection);
        } catch (error) {
          console.error(`Error handling message type ${message.type}:`, error);
        }
      }
    }

    // Update latency
    const latency = Date.now() - startTime;
    this.metrics.averageMessageLatency =
      (this.metrics.averageMessageLatency * (this.metrics.totalMessages - 1) + latency) /
      this.metrics.totalMessages;

    connection.lastActivity = Date.now();
  }

  /**
   * Send message
   */
  send(message: WebSocketMessage): number {
    return this.broadcaster.send(message);
  }

  /**
   * Broadcast message
   */
  broadcast(message: WebSocketMessage): number {
    return this.broadcaster.broadcast(message);
  }

  /**
   * Join room
   */
  joinRoom(roomName: string, connectionId: string): boolean {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) return false;

    const joined = this.roomManager.joinRoom(roomName, connectionId);
    if (joined) {
      connection.rooms.add(roomName);
    }

    return joined;
  }

  /**
   * Leave room
   */
  leaveRoom(roomName: string, connectionId: string): boolean {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) return false;

    const left = this.roomManager.leaveRoom(roomName, connectionId);
    if (left) {
      connection.rooms.delete(roomName);
    }

    return left;
  }

  /**
   * Create room
   */
  createRoom(name: string, metadata: Record<string, unknown> = {}): boolean {
    const room = this.roomManager.createRoom(name, metadata);
    return !!room;
  }

  /**
   * Delete room
   */
  deleteRoom(name: string): boolean {
    return this.roomManager.deleteRoom(name);
  }

  /**
   * Get metrics
   */
  getMetrics(): ServerMetrics {
    this.metrics.activeConnections = this.connectionManager.getCount();
    this.metrics.totalRooms = this.roomManager.getCount();
    this.metrics.uptime = Date.now() - this.startTime;
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalRooms: 0,
      totalMessages: 0,
      messagesByType: {},
      averageMessageLatency: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
  }

  /**
   * Get connection manager
   */
  getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }

  /**
   * Get room manager
   */
  getRoomManager(): RoomManager {
    return this.roomManager;
  }

  /**
   * Get broadcaster
   */
  getBroadcaster(): Broadcaster {
    return this.broadcaster;
  }

  /**
   * Get auth manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }

  /**
   * Setup heartbeat
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Check heartbeat for all connections
   */
  private checkHeartbeat(): void {
    const now = Date.now();
    const connections = this.connectionManager.getAllConnections();

    connections.forEach(connection => {
      if (now - connection.lastActivity > this.config.heartbeatTimeout) {
        this.connectionManager.removeConnection(connection.id);
        this.roomManager.leaveAllRooms(connection.id);
      }
    });
  }

  /**
   * Setup connection event listeners
   */
  private setupConnectionListeners(): void {
    this.connectionManager.on('connect', (event) => {
      this.metrics.totalConnections++;
    });

    this.connectionManager.on('disconnect', (event) => {
      this.roomManager.leaveAllRooms(event.connection.id);
    });
  }

  /**
   * Setup room event listeners
   */
  private setupRoomListeners(): void {
    // Room events can be handled here if needed
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.connectionManager.clear();
    this.roomManager.clear();
    this.messageHandlers.clear();
  }
}
