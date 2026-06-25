/**
 * @aether/auth - JWT Authentication Module
 * 
 * Comprehensive JWT authentication implementation with support for
 * access tokens, refresh tokens, and multiple algorithms
 */

import crypto from 'crypto';
import {
  JWTConfig,
  JWTPayload,
  TokenPair,
  InvalidTokenError,
  TokenExpiredError
} from './types.js';
import { JWTConfigSchema, JWTPayloadSchema, TokenPairSchema } from './schemas.js';

export class JWTAuth {
  private config: JWTConfig;
  private privateKey?: Buffer;
  private publicKey?: Buffer;

  constructor(config: JWTConfig) {
    // Validate config
    const validated = JWTConfigSchema.parse(config);
    this.config = validated;

    // For RSA algorithms, we need keys
    if (validated.algorithm?.startsWith('RS')) {
      if (!config.secret.includes('-----BEGIN')) {
        throw new Error('RSA algorithms require PEM-formatted private key in secret');
      }
      this.privateKey = Buffer.from(config.secret);
      // In production, you'd load the public key separately
      this.publicKey = this.privateKey; // Simplified for demo
    }
  }

  /**
   * Generate an access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    if (!payload.sub) {
      throw new Error('Payload must include "sub" (subject) property');
    }
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'access'
    } as JWTPayload;
    return this.generateToken(tokenPayload, this.config.expiresIn || '1h');
  }

  /**
   * Generate a refresh token
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    if (!payload.sub) {
      throw new Error('Payload must include "sub" (subject) property');
    }
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'refresh'
    } as JWTPayload;
    return this.generateToken(tokenPayload, this.config.refreshExpiresIn || '7d');
  }

  /**
   * Generate a token pair (access + refresh)
   */
  generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    const expiresIn = this.parseExpiration(this.config.expiresIn || '1h');

    const tokenPair: TokenPair = {
      accessToken,
      refreshToken,
      expiresIn
    };

    return TokenPairSchema.parse(tokenPair);
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      if (!encodedHeader || !encodedPayload || !signature) {
        throw new InvalidTokenError('Invalid token format');
      }

      // Verify signature
      const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
      if (signature !== expectedSignature) {
        throw new InvalidTokenError('Invalid signature');
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Validate payload structure
      const validated = JWTPayloadSchema.parse(payload);

      // Check expiration
      if (validated.exp && validated.exp < Math.floor(Date.now() / 1000)) {
        throw new TokenExpiredError('Token has expired');
      }

      // Check issuer
      if (this.config.issuer && validated.iss !== this.config.issuer) {
        throw new InvalidTokenError('Invalid issuer');
      }

      // Check audience
      if (this.config.audience && validated.aud !== this.config.audience) {
        throw new InvalidTokenError('Invalid audience');
      }

      return validated;
    } catch (error) {
      if (error instanceof InvalidTokenError || error instanceof TokenExpiredError) {
        throw error;
      }
      throw new InvalidTokenError('Token verification failed');
    }
  }

  /**
   * Decode a token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const [, encodedPayload] = token.split('.');
      if (!encodedPayload) return null;
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
      return JWTPayloadSchema.parse(payload);
    } catch {
      return null;
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  refreshAccessToken(refreshToken: string): string {
    const payload = this.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new InvalidTokenError('Invalid token type for refresh');
    }

    // Generate new access token with same payload
    const { type, iat, exp, ...rest } = payload;
    return this.generateAccessToken(rest);
  }

  /**
   * Generate a token with the given expiration
   */
  private generateToken(payload: JWTPayload, expiresIn: string): string {
    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiration(expiresIn);

    const tokenPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp,
      iss: this.config.issuer,
      aud: this.config.audience
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Sign data using the configured algorithm
   */
  private sign(data: string): string {
    if (this.config.algorithm?.startsWith('HS')) {
      // HMAC algorithms
      const algo = this.config.algorithm.replace('HS', 'sha');
      const hmac = crypto.createHmac(algo, this.config.secret);
      hmac.update(data);
      return this.base64UrlEncode(hmac.digest());
    } else if (this.config.algorithm?.startsWith('RS')) {
      // RSA algorithms
      const algo = this.config.algorithm.replace('RS', 'rsa');
      const sign = crypto.createSign(algo);
      sign.update(data);
      sign.end();
      const signature = sign.sign(this.privateKey!);
      return this.base64UrlEncode(signature);
    }
    throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
  }

  /**
   * Base64URL encode
   */
  private base64UrlEncode(data: string | Buffer): string {
    const base64 = Buffer.isBuffer(data) 
      ? data.toString('base64') 
      : Buffer.from(data).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64URL decode
   */
  private base64UrlDecode(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600; // Default to 1 hour
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalJWTAuth: JWTAuth | null = null;

export function setupJWTAuth(config: JWTConfig): JWTAuth {
  globalJWTAuth = new JWTAuth(config);
  return globalJWTAuth;
}

export function getJWTAuth(): JWTAuth | null {
  return globalJWTAuth;
}

export function createJWTAuth(config: JWTConfig): JWTAuth {
  return new JWTAuth(config);
}
