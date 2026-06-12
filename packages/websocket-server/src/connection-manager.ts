/**
 * Connection Manager
 * 
 * Manages WebSocket connections, including creation, tracking, and cleanup.
 */

import type { Connection, ConnectionEvent } from './types.js';
import { randomUUID } from 'crypto';

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private eventListeners: Map<string, Set<(event: ConnectionEvent) => void>> = new Map();

  /**
   * Create a new connection
   */
  createConnection(socket: unknown, metadata: Record<string, unknown> = {}): Connection {
    const connection: Connection = {
      id: randomUUID(),
      socket,
      rooms: new Set(),
      metadata,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      isAuthenticated: false,
    };

    this.connections.set(connection.id, connection);
    this.emit('connect', { type: 'connect', connection });

    return connection;
  }

  /**
   * Get a connection by ID
   */
  getConnection(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections by user ID
   */
  getConnectionsByUser(userId: string): Connection[] {
    return this.getAllConnections().filter(c => c.userId === userId);
  }

  /**
   * Update connection metadata
   */
  updateConnection(id: string, updates: Partial<Connection>): boolean {
    const connection = this.connections.get(id);
    if (!connection) return false;

    Object.assign(connection, updates);
    connection.lastActivity = Date.now();
    return true;
  }

  /**
   * Remove a connection
   */
  removeConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) return false;

    this.connections.delete(id);
    this.emit('disconnect', { type: 'disconnect', connection });
    return true;
  }

  /**
   * Get connection count
   */
  getCount(): number {
    return this.connections.size;
  }

  /**
   * Check if connection exists
   */
  hasConnection(id: string): boolean {
    return this.connections.has(id);
  }

  /**
   * Clear all connections
   */
  clear(): void {
    this.connections.clear();
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (event: ConnectionEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (event: ConnectionEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: ConnectionEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactive(maxInactiveTime: number): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > maxInactiveTime) {
        this.removeConnection(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
