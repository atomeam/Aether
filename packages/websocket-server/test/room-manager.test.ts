/**
 * Room Manager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomManager } from '../src/room-manager.js';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a new room', () => {
      const room = manager.createRoom('test-room');

      expect(room).toHaveProperty('name', 'test-room');
      expect(room.connections).toBeInstanceOf(Set);
      expect(manager.getCount()).toBe(1);
    });

    it('should create room with metadata', () => {
      const metadata = { description: 'Test room' };
      const room = manager.createRoom('test-room', metadata);

      expect(room.metadata).toEqual(metadata);
    });

    it('should create room with max connections', () => {
      const room = manager.createRoom('test-room', {}, 10);

      expect(room.maxConnections).toBe(10);
    });

    it('should return existing room if already exists', () => {
      const room1 = manager.createRoom('test-room');
      const room2 = manager.createRoom('test-room');

      expect(room1).toBe(room2);
      expect(manager.getCount()).toBe(1);
    });
  });

  describe('getRoom', () => {
    it('should get room by name', () => {
      manager.createRoom('test-room');
      const room = manager.getRoom('test-room');

      expect(room).toBeTruthy();
      expect(room?.name).toBe('test-room');
    });

    it('should return undefined for non-existent room', () => {
      const room = manager.getRoom('non-existent');
      expect(room).toBeUndefined();
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms', () => {
      manager.createRoom('room1');
      manager.createRoom('room2');

      const rooms = manager.getAllRooms();
      expect(rooms).toHaveLength(2);
    });
  });

  describe('deleteRoom', () => {
    it('should delete room', () => {
      manager.createRoom('test-room');
      const deleted = manager.deleteRoom('test-room');

      expect(deleted).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('should return false for non-existent room', () => {
      const deleted = manager.deleteRoom('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('joinRoom', () => {
    it('should add connection to room', () => {
      manager.createRoom('test-room');
      const joined = manager.joinRoom('test-room', 'conn1');

      expect(joined).toBe(true);
      expect(manager.getRoomConnections('test-room').has('conn1')).toBe(true);
    });

    it('should return false for non-existent room', () => {
      const joined = manager.joinRoom('non-existent', 'conn1');
      expect(joined).toBe(false);
    });

    it('should respect max connections', () => {
      manager.createRoom('test-room', {}, 2);
      manager.joinRoom('test-room', 'conn1');
      manager.joinRoom('test-room', 'conn2');

      const joined = manager.joinRoom('test-room', 'conn3');
      expect(joined).toBe(false);
    });
  });

  describe('leaveRoom', () => {
    it('should remove connection from room', () => {
      manager.createRoom('test-room');
      manager.joinRoom('test-room', 'conn1');

      const left = manager.leaveRoom('test-room', 'conn1');
      expect(left).toBe(true);
      expect(manager.getRoomConnections('test-room').has('conn1')).toBe(false);
    });

    it('should return false for non-existent room', () => {
      const left = manager.leaveRoom('non-existent', 'conn1');
      expect(left).toBe(false);
    });

    it('should auto-delete empty room', () => {
      manager.createRoom('test-room');
      manager.joinRoom('test-room', 'conn1');
      manager.leaveRoom('test-room', 'conn1');

      expect(manager.hasRoom('test-room')).toBe(false);
    });
  });

  describe('leaveAllRooms', () => {
    it('should remove connection from all rooms', () => {
      manager.createRoom('room1');
      manager.createRoom('room2');
      manager.joinRoom('room1', 'conn1');
      manager.joinRoom('room2', 'conn1');

      const leftRooms = manager.leaveAllRooms('conn1');
      expect(leftRooms).toEqual(['room1', 'room2']);
    });
  });

  describe('getConnectionRooms', () => {
    it('should get rooms for connection', () => {
      manager.createRoom('room1');
      manager.createRoom('room2');
      manager.joinRoom('room1', 'conn1');
      manager.joinRoom('room2', 'conn1');

      const rooms = manager.getConnectionRooms('conn1');
      expect(rooms).toHaveLength(2);
    });
  });

  describe('getRoomConnections', () => {
    it('should get connections in room', () => {
      manager.createRoom('test-room');
      manager.joinRoom('test-room', 'conn1');
      manager.joinRoom('test-room', 'conn2');

      const connections = manager.getRoomConnections('test-room');
      expect(connections.size).toBe(2);
    });

    it('should return empty set for non-existent room', () => {
      const connections = manager.getRoomConnections('non-existent');
      expect(connections.size).toBe(0);
    });
  });

  describe('hasRoom', () => {
    it('should return true for existing room', () => {
      manager.createRoom('test-room');
      expect(manager.hasRoom('test-room')).toBe(true);
    });

    it('should return false for non-existent room', () => {
      expect(manager.hasRoom('non-existent')).toBe(false);
    });
  });

  describe('updateRoom', () => {
    it('should update room metadata', () => {
      manager.createRoom('test-room');
      const updated = manager.updateRoom('test-room', { description: 'Updated' });

      expect(updated).toBe(true);
      expect(manager.getRoom('test-room')?.metadata.description).toBe('Updated');
    });

    it('should return false for non-existent room', () => {
      const updated = manager.updateRoom('non-existent', { description: 'Updated' });
      expect(updated).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all rooms', () => {
      manager.createRoom('room1');
      manager.createRoom('room2');

      manager.clear();
      expect(manager.getCount()).toBe(0);
    });
  });

  describe('event listeners', () => {
    it('should emit join event', () => {
      const listener = vi.fn();
      manager.on('join', listener);

      manager.createRoom('test-room');
      manager.joinRoom('test-room', 'conn1');

      expect(listener).toHaveBeenCalled();
    });

    it('should emit leave event', () => {
      const listener = vi.fn();
      manager.on('leave', listener);

      manager.createRoom('test-room');
      manager.joinRoom('test-room', 'conn1');
      manager.leaveRoom('test-room', 'conn1');

      expect(listener).toHaveBeenCalled();
    });

    it('should emit delete event', () => {
      const listener = vi.fn();
      manager.on('delete', listener);

      manager.createRoom('test-room');
      manager.deleteRoom('test-room');

      expect(listener).toHaveBeenCalled();
    });
  });
});
