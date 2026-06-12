/**
 * Broadcaster
 * 
 * Handles message broadcasting to connections and rooms.
 */

import type { WebSocketMessage, Connection, BroadcastOptions } from './types.js';
import { ConnectionManager } from './connection-manager.js';
import { RoomManager } from './room-manager.js';

export class Broadcaster {
  private connectionManager: ConnectionManager;
  private roomManager: RoomManager;

  constructor(
    connectionManager: ConnectionManager,
    roomManager: RoomManager
  ) {
    this.connectionManager = connectionManager;
    this.roomManager = roomManager;
  }

  /**
   * Send message to a specific connection
   */
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) return false;

    try {
      this.sendMessage(connection, message);
      return true;
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Send message to multiple connections
   */
  sendToConnections(connectionIds: string[], message: WebSocketMessage): number {
    let sent = 0;
    connectionIds.forEach(id => {
      if (this.sendToConnection(id, message)) {
        sent++;
      }
    });
    return sent;
  }

  /**
   * Send message to a room
   */
  sendToRoom(roomName: string, message: WebSocketMessage, options: BroadcastOptions = {}): number {
    const room = this.roomManager.getRoom(roomName);
    if (!room) return 0;

    const connections = Array.from(room.connections);
    return this.sendToConnections(connections, message);
  }

  /**
   * Send message to multiple rooms
   */
  sendToRooms(roomNames: string[], message: WebSocketMessage, options: BroadcastOptions = {}): number {
    let sent = 0;
    roomNames.forEach(roomName => {
      sent += this.sendToRoom(roomName, message, options);
    });
    return sent;
  }

  /**
   * Send message to a specific user
   */
  sendToUser(userId: string, message: WebSocketMessage): number {
    const connections = this.connectionManager.getConnectionsByUser(userId);
    const connectionIds = connections.map(c => c.id);
    return this.sendToConnections(connectionIds, message);
  }

  /**
   * Broadcast message to all connections
   */
  broadcast(message: WebSocketMessage, options: BroadcastOptions = {}): number {
    let connections = this.connectionManager.getAllConnections();

    // Filter by rooms
    if (options.rooms && options.rooms.length > 0) {
      connections = connections.filter(conn => {
        return options.rooms!.some(room => conn.rooms.has(room));
      });
    }

    // Filter by users
    if (options.users && options.users.length > 0) {
      connections = connections.filter(conn => {
        return options.users!.includes(conn.userId || '');
      });
    }

    // Apply custom filter
    if (options.filter) {
      connections = connections.filter(options.filter);
    }

    // Exclude self
    if (options.excludeSelf && message.from) {
      connections = connections.filter(conn => conn.id !== message.from);
    }

    const connectionIds = connections.map(c => c.id);
    return this.sendToConnections(connectionIds, message);
  }

  /**
   * Send message with options
   */
  send(message: WebSocketMessage, options: BroadcastOptions = {}): number {
    // Send to specific connection
    if (message.to) {
      return this.sendToConnection(message.to, message) ? 1 : 0;
    }

    // Send to room
    if (message.room) {
      return this.sendToRoom(message.room, message, options);
    }

    // Broadcast to all
    return this.broadcast(message, options);
  }

  /**
   * Send message to a connection (internal)
   */
  private sendMessage(connection: Connection, message: WebSocketMessage): void {
    const socket = connection.socket as any; // WebSocket instance
    if (socket && socket.readyState === 1) { // OPEN
      socket.send(JSON.stringify(message));
      connection.lastActivity = Date.now();
    }
  }
}
