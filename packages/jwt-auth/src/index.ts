/**
 * @aether/jwt-auth - JWT Authentication Middleware
 * 
 * Provides JWT authentication middleware for Express applications.
 * Supports token generation, validation, and refresh.
 */

import crypto from 'crypto';

export interface JWTConfig {
  secret: string;
  expiresIn?: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
}

export interface JWTPayload {
  sub: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

export class JWTAuth {
  private secret: string;
  private expiresIn: string;
  private algorithm: string;
  private issuer?: string;
  private audience?: string;

  constructor(config: JWTConfig) {
    this.secret = config.secret;
    this.expiresIn = config.expiresIn || '1h';
    this.algorithm = config.algorithm || 'HS256';
    this.issuer = config.issuer;
    this.audience = config.audience;
  }

  generateToken(payload: JWTPayload): string {
    const header = {
      alg: this.algorithm,
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiration(this.expiresIn);

    const tokenPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp,
      iss: this.issuer,
      aud: this.audience
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      if (!encodedHeader || !encodedPayload || !signature) {
        return null;
      }

      // Verify signature
      const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);
      const payload = this.verifyToken(token);

      if (!payload) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      req.user = payload;
      req.token = token;
      next();
    };
  }

  private sign(data: string): string {
    const hmac = crypto.createHmac(this.algorithm.replace('HS', 'sha'), this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest());
  }

  private base64UrlEncode(data: string | Buffer): string {
    const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

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

// Global JWT auth instance
let globalJWTAuth: JWTAuth | null = null;

export function setupJWTAuth(config: JWTConfig): JWTAuth {
  globalJWTAuth = new JWTAuth(config);
  return globalJWTAuth;
}

export function getJWTAuth(): JWTAuth | null {
  return globalJWTAuth;
}

// Express middleware
export function jwtAuth(config: JWTConfig) {
  const auth = setupJWTAuth(config);
  return auth.middleware();
}