/**
 * Authentication Manager
 * 
 * Handles WebSocket connection authentication.
 */

import type { AuthConfig, Connection } from './types.js';

export class AuthManager {
  private config: Required<AuthConfig>;

  constructor(config: AuthConfig) {
    this.config = {
      enabled: config.enabled || false,
      validateToken: config.validateToken || this.defaultValidateToken,
      getUserId: config.getUserId || this.defaultGetUserId,
      handshakeTimeout: config.handshakeTimeout || 5000,
    };
  }

  /**
   * Validate a token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.config.enabled) return true;
    return this.config.validateToken(token);
  }

  /**
   * Get user ID from token
   */
  async getUserId(token: string): Promise<string | null> {
    if (!this.config.enabled) return null;
    const userId = await this.config.getUserId(token);
    return userId || null;
  }

  /**
   * Authenticate a connection
   */
  async authenticate(connection: Connection, token: string): Promise<boolean> {
    if (!this.config.enabled) {
      connection.isAuthenticated = true;
      return true;
    }

    const isValid = await this.validateToken(token);
    if (isValid) {
      const userId = await this.getUserId(token);
      if (userId) {
        connection.userId = userId;
        connection.isAuthenticated = true;
        return true;
      }
    }

    connection.isAuthenticated = false;
    return false;
  }

  /**
   * Check if connection is authenticated
   */
  isAuthenticated(connection: Connection): boolean {
    if (!this.config.enabled) return true;
    return connection.isAuthenticated;
  }

  /**
   * Default token validator (always returns true)
   */
  private defaultValidateToken(token: string): boolean {
    return true;
  }

  /**
   * Default user ID getter (returns null)
   */
  private defaultGetUserId(token: string): string {
    return '';
  }
}
