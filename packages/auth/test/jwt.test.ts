/**
 * @aether/auth - JWT Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JWTAuth, setupJWTAuth, InvalidTokenError, TokenExpiredError } from '../src/jwt.js';
import { JWTConfigSchema } from '../src/schemas.js';

describe('JWTAuth', () => {
  let jwt: JWTAuth;
  const config = {
    secret: 'test-secret-key-at-least-32-characters-long',
    expiresIn: '1h',
    algorithm: 'HS256' as const,
    issuer: 'test-issuer',
    audience: 'test-audience'
  };

  beforeEach(() => {
    jwt = new JWTAuth(config);
  });

  describe('constructor', () => {
    it('should validate config', () => {
      expect(() => new JWTAuth({ secret: 'short' })).toThrow();
    });

    it('should accept valid config', () => {
      expect(() => new JWTAuth(config)).not.toThrow();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = { sub: 'user123', role: 'admin' };
      const token = jwt.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include type in payload', () => {
      const payload = { sub: 'user123' };
      const token = jwt.generateAccessToken(payload);
      const decoded = jwt.decodeToken(token);

      expect(decoded?.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = { sub: 'user123' };
      const token = jwt.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include type in payload', () => {
      const payload = { sub: 'user123' };
      const token = jwt.generateRefreshToken(payload);
      const decoded = jwt.decodeToken(token);

      expect(decoded?.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = { sub: 'user123' };
      const pair = jwt.generateTokenPair(payload);

      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      expect(pair.expiresIn).toBeDefined();
    });

    it('should have different tokens', () => {
      const payload = { sub: 'user123' };
      const pair = jwt.generateTokenPair(payload);

      expect(pair.accessToken).not.toBe(pair.refreshToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { sub: 'user123', role: 'admin' };
      const token = jwt.generateAccessToken(payload);
      const verified = jwt.verifyToken(token);

      expect(verified.sub).toBe('user123');
      expect(verified.role).toBe('admin');
    });

    it('should throw for invalid token format', () => {
      expect(() => jwt.verifyToken('invalid')).toThrow(InvalidTokenError);
    });

    it('should throw for invalid signature', () => {
      const token = jwt.generateAccessToken({ sub: 'user123' });
      const tampered = token.slice(0, -1) + 'X';

      expect(() => jwt.verifyToken(tampered)).toThrow(InvalidTokenError);
    });

    it('should throw for expired token', () => {
      const shortLivedJWT = new JWTAuth({
        ...config,
        expiresIn: '0s'
      });
      const token = shortLivedJWT.generateAccessToken({ sub: 'user123' });

      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          expect(() => shortLivedJWT.verifyToken(token)).toThrow(TokenExpiredError);
          resolve(undefined);
        }, 1100);
      });
    });

    it('should validate issuer', () => {
      const token = jwt.generateAccessToken({ sub: 'user123' });
      const verified = jwt.verifyToken(token);

      expect(verified.iss).toBe('test-issuer');
    });

    it('should validate audience', () => {
      const token = jwt.generateAccessToken({ sub: 'user123' });
      const verified = jwt.verifyToken(token);

      expect(verified.aud).toBe('test-audience');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = { sub: 'user123', role: 'admin' };
      const token = jwt.generateAccessToken(payload);
      const decoded = jwt.decodeToken(token);

      expect(decoded?.sub).toBe('user123');
      expect(decoded?.role).toBe('admin');
    });

    it('should return null for invalid token', () => {
      const decoded = jwt.decodeToken('invalid');
      expect(decoded).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with refresh token', () => {
      const payload = { sub: 'user123' };
      const refreshToken = jwt.generateRefreshToken(payload);
      const newAccessToken = jwt.refreshAccessToken(refreshToken);

      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(refreshToken);
    });

    it('should throw for non-refresh token', () => {
      const accessToken = jwt.generateAccessToken({ sub: 'user123' });

      expect(() => jwt.refreshAccessToken(accessToken)).toThrow(InvalidTokenError);
    });
  });

  describe('factory functions', () => {
    it('should setup global JWT auth', () => {
      const globalJWT = setupJWTAuth(config);
      expect(globalJWT).toBeInstanceOf(JWTAuth);
      expect(getJWTAuth()).toBe(globalJWT);
    });
  });
});
