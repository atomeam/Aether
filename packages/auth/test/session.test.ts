/**
 * @aether/auth - Session Management Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager, setupSessionManager, createSessionManager } from '../src/session.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager({ maxAge: 3600000 }); // 1 hour
  });

  afterEach(() => {
    sessionManager.destroy();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = sessionManager.createSession('user123');

      expect(session).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.id).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should include metadata', () => {
      const metadata = { ipAddress: '127.0.0.1', userAgent: 'test' };
      const session = sessionManager.createSession('user123', metadata);

      expect(session.metadata).toEqual(metadata);
    });

    it('should generate unique session IDs', () => {
      const session1 = sessionManager.createSession('user123');
      const session2 = sessionManager.createSession('user123');

      expect(session1.id).not.toBe(session2.id);
      expect(session1.token).not.toBe(session2.token);
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const created = sessionManager.createSession('user123');
      const retrieved = sessionManager.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe('user123');
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should return null for expired session', () => {
      const shortLivedManager = new SessionManager({ maxAge: 100 });
      const created = shortLivedManager.createSession('user123');

      return new Promise(resolve => {
        setTimeout(() => {
          const session = shortLivedManager.getSession(created.id);
          expect(session).toBeNull();
          shortLivedManager.destroy();
          resolve(undefined);
        }, 150);
      });
    });

    it('should update last accessed time for rolling sessions', () => {
      const manager = new SessionManager({ maxAge: 3600000, rolling: true });
      const created = manager.createSession('user123');

      return new Promise(resolve => {
        setTimeout(() => {
          const session = manager.getSession(created.id);
          expect(session?.lastAccessedAt.getTime()).toBeGreaterThan(created.lastAccessedAt.getTime());
          manager.destroy();
          resolve(undefined);
        }, 100);
      });
    });
  });

  describe('getSessionByToken', () => {
    it('should retrieve session by token', () => {
      const created = sessionManager.createSession('user123');
      const retrieved = sessionManager.getSessionByToken(created.token);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for invalid token', () => {
      const session = sessionManager.getSessionByToken('invalid-token');
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session metadata', () => {
      const created = sessionManager.createSession('user123');
      const updated = sessionManager.updateSession(created.id, {
        ipAddress: '192.168.1.1'
      });

      expect(updated).toBeDefined();
      expect(updated?.ipAddress).toBe('192.168.1.1');
    });

    it('should return null for non-existent session', () => {
      const updated = sessionManager.updateSession('non-existent', { ipAddress: 'test' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      const created = sessionManager.createSession('user123');
      const deleted = sessionManager.deleteSession(created.id);

      expect(deleted).toBe(true);
      expect(sessionManager.getSession(created.id)).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionManager.deleteSession('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', () => {
      sessionManager.createSession('user123');
      sessionManager.createSession('user123');
      sessionManager.createSession('user456');

      const count = sessionManager.deleteUserSessions('user123');

      expect(count).toBe(2);
      expect(sessionManager.getUserSessions('user123')).toHaveLength(0);
      expect(sessionManager.getUserSessions('user456')).toHaveLength(1);
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', () => {
      sessionManager.createSession('user123');
      sessionManager.createSession('user123');
      sessionManager.createSession('user456');

      const sessions = sessionManager.getUserSessions('user123');

      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.userId === 'user123')).toBe(true);
    });

    it('should not include expired sessions', () => {
      const shortLivedManager = new SessionManager({ maxAge: 100 });
      shortLivedManager.createSession('user123');

      return new Promise(resolve => {
        setTimeout(() => {
          const sessions = shortLivedManager.getUserSessions('user123');
          expect(sessions).toHaveLength(0);
          shortLivedManager.destroy();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('validateSession', () => {
    it('should validate existing session', () => {
      const created = sessionManager.createSession('user123');
      const isValid = sessionManager.validateSession(created.id);

      expect(isValid).toBe(true);
    });

    it('should invalidate non-existent session', () => {
      const isValid = sessionManager.validateSession('non-existent');
      expect(isValid).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session expiration', () => {
      const created = sessionManager.createSession('user123');
      const originalExpires = created.expiresAt;

      return new Promise(resolve => {
        setTimeout(() => {
          const refreshed = sessionManager.refreshSession(created.id);
          expect(refreshed?.expiresAt.getTime()).toBeGreaterThan(originalExpires.getTime());
          resolve(undefined);
        }, 100);
      });
    });
  });

  describe('getSessionCount', () => {
    it('should return total session count', () => {
      sessionManager.createSession('user123');
      sessionManager.createSession('user456');

      expect(sessionManager.getSessionCount()).toBe(2);
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return active session count', () => {
      sessionManager.createSession('user123');
      sessionManager.createSession('user456');

      expect(sessionManager.getActiveSessionCount()).toBe(2);
    });

    it('should not count expired sessions', () => {
      const shortLivedManager = new SessionManager({ maxAge: 100 });
      shortLivedManager.createSession('user123');

      return new Promise(resolve => {
        setTimeout(() => {
          expect(shortLivedManager.getActiveSessionCount()).toBe(0);
          shortLivedManager.destroy();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const shortLivedManager = new SessionManager({ maxAge: 100 });
      shortLivedManager.createSession('user123');
      shortLivedManager.createSession('user456');

      return new Promise(resolve => {
        setTimeout(() => {
          const count = shortLivedManager.cleanupExpiredSessions();
          expect(count).toBe(2);
          expect(shortLivedManager.getSessionCount()).toBe(0);
          shortLivedManager.destroy();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all sessions', () => {
      sessionManager.createSession('user123');
      sessionManager.createSession('user456');

      sessionManager.clearAllSessions();

      expect(sessionManager.getSessionCount()).toBe(0);
    });
  });

  describe('factory functions', () => {
    it('should setup global session manager', () => {
      const globalManager = setupSessionManager();
      expect(globalManager).toBeInstanceOf(SessionManager);
      expect(getSessionManager()).toBe(globalManager);
    });

    it('should create new instance', () => {
      const manager = createSessionManager();
      expect(manager).toBeInstanceOf(SessionManager);
    });
  });
});
