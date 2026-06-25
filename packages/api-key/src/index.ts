/**
 * @aether/api-key - API Key Management
 * 
 * Provides API key management middleware for Express applications.
 * Supports API key generation, validation, and revocation.
 */

import crypto from 'crypto';

export interface APIKeyConfig {
  keyLength?: number;
  keyPrefix?: string;
  headerName?: string;
  queryParam?: string;
}

export interface APIKey {
  key: string;
  name: string;
  createdAt: number;
  expiresAt?: number;
  scopes: string[];
  isActive: boolean;
}

export class APIKeyManager {
  private keys: Map<string, APIKey>;
  private keyLength: number;
  private keyPrefix: string;

  constructor(config: APIKeyConfig = {}) {
    const {
      keyLength = 32,
      keyPrefix = 'ak_'
    } = config;

    this.keys = new Map();
    this.keyLength = keyLength;
    this.keyPrefix = keyPrefix;
  }

  generateKey(name: string, scopes: string[], expiresIn?: number): APIKey {
    const key = this.keyPrefix + crypto.randomBytes(this.keyLength).toString('hex');
    const now = Date.now();

    const apiKey: APIKey = {
      key,
      name,
      createdAt: now,
      expiresAt: expiresIn ? now + expiresIn : undefined,
      scopes,
      isActive: true
    };

    this.keys.set(key, apiKey);
    return apiKey;
  }

  validateKey(key: string): APIKey | null {
    const apiKey = this.keys.get(key);

    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return null;
    }

    return apiKey;
  }

  revokeKey(key: string): boolean {
    const apiKey = this.keys.get(key);
    if (apiKey) {
      apiKey.isActive = false;
      return true;
    }
    return false;
  }

  deleteKey(key: string): boolean {
    return this.keys.delete(key);
  }

  getKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }

  getKey(key: string): APIKey | undefined {
    return this.keys.get(key);
  }
}

// Global API key manager instance
let globalAPIKeyManager: APIKeyManager | null = null;

export function setupAPIKeyManager(config?: APIKeyConfig): APIKeyManager {
  globalAPIKeyManager = new APIKeyManager(config);
  return globalAPIKeyManager;
}

export function getAPIKeyManager(): APIKeyManager {
  if (!globalAPIKeyManager) {
    globalAPIKeyManager = new APIKeyManager();
  }
  return globalAPIKeyManager;
}

// Express middleware
export function apiKeyAuth(config: APIKeyConfig = {}) {
  const {
    headerName = 'X-API-Key',
    queryParam = 'api_key'
  } = config;

  const manager = getAPIKeyManager();

  return (req: any, res: any, next: any) => {
    const key = req.headers[headerName.toLowerCase()] || req.query[queryParam];

    if (!key) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required'
      });
    }

    const apiKey = manager.validateKey(key);

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key'
      });
    }

    req.apiKey = apiKey;
    next();
  };
}

// Scope-based middleware
export function requireScope(scope: string) {
  return (req: any, res: any, next: any) => {
    if (!req.apiKey || !req.apiKey.scopes.includes(scope)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required scope: ${scope}`
      });
    }
    next();
  };
}