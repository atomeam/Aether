/**
 * @aether/response-cache - Response Caching Middleware
 * 
 * Provides response caching middleware for Express applications.
 * Supports in-memory caching with TTL and cache invalidation.
 */

export interface CacheConfig {
  ttl?: number;              // Time to live in milliseconds
  maxSize?: number;         // Maximum cache size
  cacheableMethods?: string[];  // Cacheable HTTP methods
  skipCache?: (req: any) => boolean;  // Skip cache function
}

export interface CacheEntry {
  key: string;
  value: any;
  headers: Record<string, string>;
  status: number;
  expiresAt: number;
  createdAt: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number;

  constructor(config: CacheConfig = {}) {
    const {
      ttl = 60000,  // 1 minute default
      maxSize = 1000
    } = config;

    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);  // Every minute
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, value: any, headers: Record<string, string>, status: number): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      value,
      headers,
      status,
      expiresAt: Date.now() + this.ttl,
      createdAt: Date.now()
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export function responseCache(config: CacheConfig = {}) {
  const cache = new ResponseCache(config);
  const {
    cacheableMethods = ['GET', 'HEAD'],
    skipCache = () => false
  } = config;

  return function (req: any, res: any, next: any) {
    // Skip non-cacheable methods
    if (!cacheableMethods.includes(req.method)) {
      return next();
    }

    // Skip if configured
    if (skipCache(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', Math.floor((cached.expiresAt - Date.now()) / 1000).toString());
      
      Object.entries(cached.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return res.status(cached.status).json(cached.value);
    }

    res.setHeader('X-Cache', 'MISS');

    // Store the original send function
    const originalSend = res.send;

    // Override send to cache successful responses
    res.send = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const headers: Record<string, string> = {};
        
        // Copy relevant headers
        ['Content-Type', 'Content-Encoding', 'ETag', 'Last-Modified'].forEach(header => {
          const value = res.getHeader(header);
          if (value) {
            headers[header] = value;
          }
        });

        cache.set(cacheKey, data, headers, res.statusCode);
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

function generateCacheKey(req: any): string {
  return `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
}

// Global cache instance
let globalCache: ResponseCache | null = null;

export function setupResponseCache(config?: CacheConfig): ResponseCache {
  globalCache = new ResponseCache(config);
  return globalCache;
}

export function getResponseCache(): ResponseCache | null {
  return globalCache;
}

export function clearResponseCache(): void {
  globalCache?.clear();
}