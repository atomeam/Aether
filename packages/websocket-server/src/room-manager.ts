/**
 * Room Manager
 * 
 * Manages WebSocket rooms for grouping connections and broadcasting messages.
 */

import type { Room, RoomEvent } from './types.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private eventListeners: Map<string, Set<(event: RoomEvent) => void>> = new Map();

  /**
   * Create a new room
   */
  createRoom(name: string, metadata: Record<string, unknown> = {}, maxConnections?: number): Room {
    if (this.rooms.has(name)) {
      return this.rooms.get(name)!;
    }

    const room: Room = {
      name,
      connections: new Set(),
      metadata,
      createdAt: Date.now(),
      maxConnections,
    };

    this.rooms.set(name, room);
    return room;
  }

  /**
   * Get a room by name
   */
  getRoom(name: string): Room | undefined {
    return this.rooms.get(name);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Delete a room
   */
  deleteRoom(name: string): boolean {
    const room = this.rooms.get(name);
    if (!room) return false;

    // Notify all connections in room
    room.connections.forEach(connectionId => {
      this.emit('leave', { type: 'leave', room: name, connectionId });
    });

    this.rooms.delete(name);
    this.emit('delete', { type: 'delete', room: name, connectionId: '' });
    return true;
  }

  /**
   * Add connection to room
   */
  joinRoom(roomName: string, connectionId: string): boolean {
    const room = this.rooms.get(roomName);
    if (!room) return false;

    // Check max connections
    if (room.maxConnections && room.connections.size >= room.maxConnections) {
      return false;
    }

    room.connections.add(connectionId);
    this.emit('join', { type: 'join', room: roomName, connectionId });
    return true;
  }

  /**
   * Remove connection from room
   */
  leaveRoom(roomName: string, connectionId: string): boolean {
    const room = this.rooms.get(roomName);
    if (!room) return false;

    const removed = room.connections.delete(connectionId);
    if (removed) {
      this.emit('leave', { type: 'leave', room: roomName, connectionId });

      // Auto-delete room if empty
      if (room.connections.size === 0) {
        this.deleteRoom(roomName);
      }
    }

    return removed;
  }

  /**
   * Remove connection from all rooms
   */
  leaveAllRooms(connectionId: string): string[] {
    const leftRooms: string[] = [];

    for (const [roomName, room] of this.rooms.entries()) {
      if (room.connections.has(connectionId)) {
        this.leaveRoom(roomName, connectionId);
        leftRooms.push(roomName);
      }
    }

    return leftRooms;
  }

  /**
   * Get rooms for a connection
   */
  getConnectionRooms(connectionId: string): Room[] {
    return this.getAllRooms().filter(room => room.connections.has(connectionId));
  }

  /**
   * Get connections in a room
   */
  getRoomConnections(roomName: string): Set<string> {
    const room = this.rooms.get(roomName);
    return room ? room.connections : new Set();
  }

  /**
   * Get room count
   */
  getCount(): number {
    return this.rooms.size;
  }

  /**
   * Check if room exists
   */
  hasRoom(name: string): boolean {
    return this.rooms.has(name);
  }

  /**
   * Update room metadata
   */
  updateRoom(name: string, metadata: Record<string, unknown>): boolean {
    const room = this.rooms.get(name);
    if (!room) return false;

    room.metadata = { ...room.metadata, ...metadata };
    return true;
  }

  /**
   * Clear all rooms
   */
  clear(): void {
    this.rooms.clear();
  }

  /**
   * Add event listener
   */
  on(event: string, listener: (event: RoomEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (event: RoomEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: RoomEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}
