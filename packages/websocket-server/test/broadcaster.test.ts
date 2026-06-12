/**
 * Broadcaster Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Broadcaster } from '../src/broadcaster.js';
import { ConnectionManager } from '../src/connection-manager.js';
import { RoomManager } from '../src/room-manager.js';
import type { WebSocketMessage } from '../src/types.js';

describe('Broadcaster', () => {
  let connectionManager: ConnectionManager;
  let roomManager: RoomManager;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    roomManager = new RoomManager();
    broadcaster = new Broadcaster(connectionManager, roomManager);
  });

  describe('sendToConnection', () => {
    it('should send message to connection', () => {
      const socket = { readyState: 1, send: vi.fn() };
      const connection = connectionManager.createConnection(socket);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToConnection(connection.id, message);

      expect(sent).toBe(true);
      expect(socket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should return false for non-existent connection', () => {
      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToConnection('non-existent', message);

      expect(sent).toBe(false);
    });
  });

  describe('sendToConnections', () => {
    it('should send message to multiple connections', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToConnections([conn1.id, conn2.id], message);

      expect(sent).toBe(2);
      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).toHaveBeenCalled();
    });
  });

  describe('sendToRoom', () => {
    it('should send message to room', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      roomManager.createRoom('test-room');
      roomManager.joinRoom('test-room', conn1.id);
      roomManager.joinRoom('test-room', conn2.id);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToRoom('test-room', message);

      expect(sent).toBe(2);
    });

    it('should return 0 for non-existent room', () => {
      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToRoom('non-existent', message);

      expect(sent).toBe(0);
    });
  });

  describe('sendToRooms', () => {
    it('should send message to multiple rooms', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      roomManager.createRoom('room1');
      roomManager.createRoom('room2');
      roomManager.joinRoom('room1', conn1.id);
      roomManager.joinRoom('room2', conn2.id);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToRooms(['room1', 'room2'], message);

      expect(sent).toBe(2);
    });
  });

  describe('sendToUser', () => {
    it('should send message to user connections', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      connectionManager.updateConnection(conn1.id, { userId: 'user1' });
      connectionManager.updateConnection(conn2.id, { userId: 'user1' });

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.sendToUser('user1', message);

      expect(sent).toBe(2);
    });
  });

  describe('broadcast', () => {
    it('should broadcast to all connections', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      connectionManager.createConnection(socket1);
      connectionManager.createConnection(socket2);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.broadcast(message);

      expect(sent).toBe(2);
    });

    it('should filter by rooms', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      roomManager.createRoom('room1');
      roomManager.joinRoom('room1', conn1.id);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.broadcast(message, { rooms: ['room1'] });

      expect(sent).toBe(1);
      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).not.toHaveBeenCalled();
    });

    it('should filter by users', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      connectionManager.updateConnection(conn1.id, { userId: 'user1' });
      connectionManager.updateConnection(conn2.id, { userId: 'user2' });

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.broadcast(message, { users: ['user1'] });

      expect(sent).toBe(1);
      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).not.toHaveBeenCalled();
    });

    it('should exclude self', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      const message: WebSocketMessage = { type: 'test', data: 'hello', from: conn1.id };
      const sent = broadcaster.broadcast(message, { excludeSelf: true });

      expect(sent).toBe(1);
      expect(socket1.send).not.toHaveBeenCalled();
      expect(socket2.send).toHaveBeenCalled();
    });

    it('should apply custom filter', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      connectionManager.updateConnection(conn1.id, { metadata: { role: 'admin' } });

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.broadcast(message, {
        filter: (conn) => conn.metadata.role === 'admin',
      });

      expect(sent).toBe(1);
      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).not.toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should send to specific connection when to is set', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      connectionManager.createConnection(socket2);

      const message: WebSocketMessage = { type: 'test', data: 'hello', to: conn1.id };
      const sent = broadcaster.send(message);

      expect(sent).toBe(1);
      expect(socket1.send).toHaveBeenCalled();
      expect(socket2.send).not.toHaveBeenCalled();
    });

    it('should send to room when room is set', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      const conn1 = connectionManager.createConnection(socket1);
      const conn2 = connectionManager.createConnection(socket2);

      roomManager.createRoom('room1');
      roomManager.joinRoom('room1', conn1.id);

      const message: WebSocketMessage = { type: 'test', data: 'hello', room: 'room1' };
      const sent = broadcaster.send(message);

      expect(sent).toBe(1);
    });

    it('should broadcast when no specific target', () => {
      const socket1 = { readyState: 1, send: vi.fn() };
      const socket2 = { readyState: 1, send: vi.fn() };
      connectionManager.createConnection(socket1);
      connectionManager.createConnection(socket2);

      const message: WebSocketMessage = { type: 'test', data: 'hello' };
      const sent = broadcaster.send(message);

      expect(sent).toBe(2);
    });
  });
});
