/**
 * @aether/csrf-protection - CSRF Protection Middleware
 * 
 * Provides CSRF (Cross-Site Request Forgery) protection middleware.
 * Generates and validates CSRF tokens for state-changing requests.
 */

import crypto from 'crypto';

export interface CSRFProtectionConfig {
  tokenLength?: number;
  tokenName?: string;
  headerName?: string;
  cookieName?: string;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
  skipMethods?: string[];
}

export class CSRFProtection {
  private tokenLength: number;
  private tokenName: string;
  private headerName: string;
  private cookieName: string;
  private cookieOptions: any;
  private skipMethods: string[];

  constructor(config: CSRFProtectionConfig = {}) {
    const {
      tokenLength = 32,
      tokenName = 'csrfToken',
      headerName = 'x-csrf-token',
      cookieName = '_csrf',
      cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000  // 1 hour
      },
      skipMethods = ['GET', 'HEAD', 'OPTIONS']
    } = config;

    this.tokenLength = tokenLength;
    this.tokenName = tokenName;
    this.headerName = headerName;
    this.cookieName = cookieName;
    this.cookieOptions = cookieOptions;
    this.skipMethods = skipMethods;
  }

  generateToken(): string {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      // Skip for safe methods
      if (this.skipMethods.includes(req.method)) {
        return next();
      }

      const token = req.cookies?.[this.cookieName] || req.headers[this.headerName];

      if (!token) {
        return res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request'
        });
      }

      // Store token for validation
      req.csrfToken = token;
      next();
    };
  }

  setToken(res: any, token: string): void {
    res.cookie(this.cookieName, token, this.cookieOptions);
  }

  validateToken(req: any, token: string): boolean {
    const storedToken = req.cookies?.[this.cookieName] || req.headers[this.headerName];
    return storedToken === token;
  }
}

// Global CSRF protection instance
let globalCSRFProtection: CSRFProtection | null = null;

export function setupCSRFProtection(config?: CSRFProtectionConfig): CSRFProtection {
  globalCSRFProtection = new CSRFProtection(config);
  return globalCSRFProtection;
}

export function getCSRFProtection(): CSRFProtection {
  if (!globalCSRFProtection) {
    globalCSRFProtection = new CSRFProtection();
  }
  return globalCSRFProtection;
}

// Express middleware
export function csrfProtection(config?: CSRFProtectionConfig) {
  const protection = setupCSRFProtection(config);
  return protection.middleware();
}