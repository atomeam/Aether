/**
 * @aether/user-rate-limiter - User-Based Rate Limiting
 * 
 * Provides user-based rate limiting middleware.
 * Limits requests per user ID instead of just IP address.
 */

export interface UserRateLimitConfig {
  windowMs?: number;        // Time window in milliseconds
  maxRequests?: number;     // Max requests per window
  keyGenerator?: (req: any) => string;  // User ID generator
  skipSuccessful?: boolean;  // Skip successful requests
  skipFailed?: boolean;     // Skip failed requests
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  reset: number;
}

export class UserRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: any) => string;
  private skipSuccessful: boolean;
  private skipFailed: boolean;
  private store: Map<string, { count: number; resetTime: number }>;

  constructor(config: UserRateLimitConfig = {}) {
    const {
      windowMs = 60000,  // 1 minute
      maxRequests = 100,
      keyGenerator = (req: any) => req.user?.id || req.headers['user-id'] || req.ip,
      skipSuccessful = false,
      skipFailed = false
    } = config;

    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.keyGenerator = keyGenerator;
    this.skipSuccessful = skipSuccessful;
    this.skipFailed = skipFailed;
    this.store = new Map();

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      
      let entry = this.store.get(key);
      
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + this.windowMs };
        this.store.set(key, entry);
      }
      
      entry.count++;
      
      const info: RateLimitInfo = {
        limit: this.maxRequests,
        current: entry.count,
        remaining: Math.max(0, this.maxRequests - entry.count),
        reset: entry.resetTime
      };
      
      res.setHeader('X-RateLimit-Limit', info.limit.toString());
      res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.reset).toISOString());
      
      if (entry.count > this.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          info
        });
      }
      
      if (this.skipSuccessful || this.skipFailed) {
        const originalSend = res.send;
        res.send = function(data: any) {
          if (this.skipSuccessful && res.statusCode < 400) {
            entry.count--;
          }
          if (this.skipFailed && res.statusCode >= 400) {
            entry.count--;
          }
          originalSend.call(this, data);
        };
      }
      
      next();
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  resetAll(): void {
    this.store.clear();
  }

  getStats(key: string): RateLimitInfo | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    return {
      limit: this.maxRequests,
      current: entry.count,
      remaining: Math.max(0, this.maxRequests - entry.count),
      reset: entry.resetTime
    };
  }

  getAllStats(): Map<string, RateLimitInfo> {
    const stats = new Map<string, RateLimitInfo>();
    
    for (const [key, entry] of this.store.entries()) {
      stats.set(key, {
        limit: this.maxRequests,
        current: entry.count,
        remaining: Math.max(0, this.maxRequests - entry.count),
        reset: entry.resetTime
      });
    }
    
    return stats;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Global user rate limiter instance
let globalUserRateLimiter: UserRateLimiter | null = null;

export function setupUserRateLimiter(config?: UserRateLimitConfig): UserRateLimiter {
  globalUserRateLimiter = new UserRateLimiter(config);
  return globalUserRateLimiter;
}

export function getUserRateLimiter(): UserRateLimiter {
  if (!globalUserRateLimiter) {
    globalUserRateLimiter = new UserRateLimiter();
  }
  return globalUserRateLimiter;
}

// Pre-configured rate limiters
export const standardUserRateLimiter = new UserRateLimiter({
  windowMs: 60000,
  maxRequests: 100
});

export const strictUserRateLimiter = new UserRateLimiter({
  windowMs: 60000,
  maxRequests: 20
});

export const looseUserRateLimiter = new UserRateLimiter({
  windowMs: 60000,
  maxRequests: 1000
});