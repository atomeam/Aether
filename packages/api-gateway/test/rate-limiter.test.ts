/**
 * Rate Limiter Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../src/rate-limiter.js';
import type { RequestContext } from '../src/types.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let ctx: RequestContext;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 5,
    });

    ctx = {
      id: '1',
      method: 'GET',
      path: '/test',
      headers: {},
      query: {},
      timestamp: Date.now(),
      ip: '127.0.0.1',
    };
  });

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.check(ctx);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should deny requests exceeding limit', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(ctx);
      }

      // 6th request should be denied
      const result = await rateLimiter.check(ctx);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(ctx);
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should allow again
      const result = await rateLimiter.check(ctx);
      expect(result.allowed).toBe(true);
    });

    it('should use custom key generator', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
        keyGenerator: (ctx) => ctx.userId || 'anonymous',
      });

      const ctx1 = { ...ctx, userId: 'user1' };
      const ctx2 = { ...ctx, userId: 'user2' };

      // Each user should have their own limit
      await customLimiter.check(ctx1);
      await customLimiter.check(ctx1);
      const result1 = await customLimiter.check(ctx1);
      expect(result1.allowed).toBe(false);

      const result2 = await customLimiter.check(ctx2);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('recordSuccess', () => {
    it('should decrement count when skipSuccessfulRequests is true', async () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 3,
        skipSuccessfulRequests: true,
      });

      await limiter.check(ctx);
      await limiter.check(ctx);
      limiter.recordSuccess(ctx);

      const result = await limiter.check(ctx);
      expect(result.allowed).toBe(true);
    });
  });

  describe('recordFailure', () => {
    it('should decrement count when skipFailedRequests is true', async () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 3,
        skipFailedRequests: true,
      });

      await limiter.check(ctx);
      await limiter.check(ctx);
      limiter.recordFailure(ctx);

      const result = await limiter.check(ctx);
      expect(result.allowed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset specific key', async () => {
      await rateLimiter.check(ctx);
      await rateLimiter.check(ctx);

      rateLimiter.reset('127.0.0.1:/test');

      const result = await rateLimiter.check(ctx);
      expect(result.remaining).toBe(4);
    });

    it('should reset all keys', async () => {
      await rateLimiter.check(ctx);
      await rateLimiter.check(ctx);

      rateLimiter.resetAll();

      const result = await rateLimiter.check(ctx);
      expect(result.remaining).toBe(4);
    });
  });

  describe('size', () => {
    it('should return store size', () => {
      expect(rateLimiter.size()).toBe(0);

      rateLimiter.check(ctx);
      expect(rateLimiter.size()).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      rateLimiter.destroy();
      expect(rateLimiter.size()).toBe(0);
    });
  });
});
