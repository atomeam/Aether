/**
 * Connection Manager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionManager } from '../src/connection-manager.js';
import type { Connection } from '../src/types.js';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  describe('createConnection', () => {
    it('should create a new connection', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      expect(connection).toHaveProperty('id');
      expect(connection.socket).toBe(socket);
      expect(connection.rooms).toBeInstanceOf(Set);
      expect(connection.isAuthenticated).toBe(false);
      expect(manager.getCount()).toBe(1);
    });

    it('should create connection with metadata', () => {
      const socket = { readyState: 1 };
      const metadata = { userAgent: 'test' };
      const connection = manager.createConnection(socket, metadata);

      expect(connection.metadata).toEqual(metadata);
    });
  });

  describe('getConnection', () => {
    it('should get connection by ID', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      const found = manager.getConnection(connection.id);
      expect(found).toBe(connection);
    });

    it('should return undefined for non-existent connection', () => {
      const found = manager.getConnection('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getAllConnections', () => {
    it('should return all connections', () => {
      manager.createConnection({ readyState: 1 });
      manager.createConnection({ readyState: 1 });

      const connections = manager.getAllConnections();
      expect(connections).toHaveLength(2);
    });
  });

  describe('getConnectionsByUser', () => {
    it('should return connections for user', () => {
      const socket1 = { readyState: 1 };
      const socket2 = { readyState: 1 };
      const conn1 = manager.createConnection(socket1);
      const conn2 = manager.createConnection(socket2);

      manager.updateConnection(conn1.id, { userId: 'user1' });
      manager.updateConnection(conn2.id, { userId: 'user1' });

      const userConnections = manager.getConnectionsByUser('user1');
      expect(userConnections).toHaveLength(2);
    });
  });

  describe('updateConnection', () => {
    it('should update connection', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      const updated = manager.updateConnection(connection.id, { userId: 'user1' });
      expect(updated).toBe(true);

      const found = manager.getConnection(connection.id);
      expect(found?.userId).toBe('user1');
    });

    it('should return false for non-existent connection', () => {
      const updated = manager.updateConnection('non-existent', { userId: 'user1' });
      expect(updated).toBe(false);
    });
  });

  describe('removeConnection', () => {
    it('should remove connection', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      const removed = manager.removeConnection(connection.id);
      expect(removed).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('should return false for non-existent connection', () => {
      const removed = manager.removeConnection('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('hasConnection', () => {
    it('should return true for existing connection', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      expect(manager.hasConnection(connection.id)).toBe(true);
    });

    it('should return false for non-existent connection', () => {
      expect(manager.hasConnection('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all connections', () => {
      manager.createConnection({ readyState: 1 });
      manager.createConnection({ readyState: 1 });

      manager.clear();
      expect(manager.getCount()).toBe(0);
    });
  });

  describe('event listeners', () => {
    it('should emit connect event', () => {
      const listener = vi.fn();
      manager.on('connect', listener);

      manager.createConnection({ readyState: 1 });
      expect(listener).toHaveBeenCalled();
    });

    it('should emit disconnect event', () => {
      const listener = vi.fn();
      manager.on('disconnect', listener);

      const connection = manager.createConnection({ readyState: 1 });
      manager.removeConnection(connection.id);

      expect(listener).toHaveBeenCalled();
    });

    it('should remove event listener', () => {
      const listener = vi.fn();
      manager.on('connect', listener);
      manager.off('connect', listener);

      manager.createConnection({ readyState: 1 });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('cleanupInactive', () => {
    it('should cleanup inactive connections', () => {
      const socket = { readyState: 1 };
      const connection = manager.createConnection(socket);

      // Make connection inactive
      connection.lastActivity = Date.now() - 100000;

      const cleaned = manager.cleanupInactive(60000);
      expect(cleaned).toBe(1);
      expect(manager.getCount()).toBe(0);
    });
  });
});
