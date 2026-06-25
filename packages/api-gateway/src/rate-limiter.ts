/**
 * API Gateway Rate Limiter
 * 
 * Implements sliding window rate limiting with configurable windows and limits.
 */

import type {
  RequestContext,
  RateLimitConfig,
  RateLimitResult,
} from './types.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   */
  async check(ctx: RequestContext): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(ctx);
    const now = Date.now();

    let entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store.set(key, entry);
    }

    const allowed = entry.count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining,
      reset: entry.resetTime,
      limit: this.config.maxRequests,
    };
  }

  /**
   * Record successful request (for skipSuccessfulRequests)
   */
  recordSuccess(ctx: RequestContext): void {
    if (this.config.skipSuccessfulRequests) {
      const key = this.config.keyGenerator(ctx);
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  /**
   * Record failed request (for skipFailedRequests)
   */
  recordFailure(ctx: RequestContext): void {
    if (this.config.skipFailedRequests) {
      const key = this.config.keyGenerator(ctx);
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Get current store size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.windowMs);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  /**
   * Default key generator using IP and path
   */
  private defaultKeyGenerator(ctx: RequestContext): string {
    const ip = ctx.ip || 'unknown';
    const path = ctx.path;
    return `${ip}:${path}`;
  }
}
