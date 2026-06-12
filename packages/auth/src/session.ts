/**
 * @aether/auth - Session Management Module
 * 
 * In-memory session management with support for rolling sessions,
 * secure cookies, and session metadata
 */

import crypto from 'crypto';
import {
  Session,
  SessionConfig,
  AuthError
} from './types.js';
import { SessionSchema, SessionConfigSchema } from './schemas.js';

export class SessionManager {
  private sessions: Map<string, Session>;
  private config: SessionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SessionConfig>) {
    this.config = SessionConfigSchema.parse(config || {});
    this.sessions = new Map();
    this.startCleanup();
  }

  /**
   * Create a new session
   */
  createSession(userId: string, metadata?: Record<string, any>): Session {
    const sessionId = this.generateSessionId();
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge!);

    const session: Session = {
      id: sessionId,
      userId,
      token,
      expiresAt,
      createdAt: now,
      lastAccessedAt: now,
      metadata
    };

    this.sessions.set(sessionId, session);
    return SessionSchema.parse(session);
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time for rolling sessions
    if (this.config.rolling) {
      session.lastAccessedAt = new Date();
      session.expiresAt = new Date(Date.now() + this.config.maxAge!);
    }

    return session;
  }

  /**
   * Get a session by token
   */
  getSessionByToken(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        return this.getSession(session.id);
      }
    }
    return null;
  }

  /**
   * Update session metadata
   */
  updateSession(sessionId: string, updates: Partial<Session>): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updated = { ...session, ...updates };
    this.sessions.set(sessionId, updated);
    return SessionSchema.parse(updated);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Delete all sessions for a user
   */
  deleteUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessions: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.expiresAt > new Date()) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * Validate a session
   */
  validateSession(sessionId: string): boolean {
    return this.getSession(sessionId) !== null;
  }

  /**
   * Refresh a session (extend expiration)
   */
  refreshSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.lastAccessedAt = new Date();
    session.expiresAt = new Date(Date.now() + this.config.maxAge!);
    
    return SessionSchema.parse(session);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get active session count (non-expired)
   */
  getActiveSessionCount(): number {
    let count = 0;
    const now = new Date();
    for (const session of this.sessions.values()) {
      if (session.expiresAt > now) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    let count = 0;
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a session token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy the session manager
   */
  destroy(): void {
    this.stopCleanup();
    this.clearAllSessions();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalSessionManager: SessionManager | null = null;

export function setupSessionManager(config?: Partial<SessionConfig>): SessionManager {
  if (globalSessionManager) {
    globalSessionManager.destroy();
  }
  globalSessionManager = new SessionManager(config);
  return globalSessionManager;
}

export function getSessionManager(): SessionManager | null {
  return globalSessionManager;
}

export function createSessionManager(config?: Partial<SessionConfig>): SessionManager {
  return new SessionManager(config);
}
