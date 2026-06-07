/**
 * Rate Limiter Middleware Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  createRateLimiterMiddleware,
  getRateLimitStatus,
  resetRateLimit,
  RATE_LIMIT_CONFIGS,
  ENDPOINT_RATE_LIMITS,
} from '../src/middleware/rateLimiter';
import {
  ddosProtection,
  getDDoSStatus,
  unblockIP,
  clearAllBlocks,
} from '../src/middleware/ddosProtection';
import { resetLimit } from '@aether/rate-limiter';

// Mock Express request/response
function createMockRequest(ip: string = '127.0.0.1', path: string = '/api/build'): Partial<Request> {
  return {
    ip,
    path,
    headers: {},
    query: {},
  };
}

function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
}

function createMockNext(): NextFunction {
  return vi.fn();
}

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    const limiters = (global as any).__rateLimiters;
    if (limiters) {
      limiters.clear();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRateLimiterMiddleware', () => {
    it('should create middleware with valid config', () => {
      const middleware = createRateLimiterMiddleware('expensive');
      expect(typeof middleware).toBe('function');
    });

    it('should throw error for invalid config', () => {
      expect(() => createRateLimiterMiddleware('invalid' as any)).toThrow();
    });

    it('should allow requests within limit', () => {
      const middleware = createRateLimiterMiddleware('expensive');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      // Make 5 requests (limit is 10)
      for (let i = 0; i < 5; i++) {
        middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
      }

      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const middleware = createRateLimiterMiddleware('expensive');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      // Make 11 requests (limit is 10)
      for (let i = 0; i < 11; i++) {
        middleware(req as Request, res as Response, next);
      }

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
        })
      );
    });

    it('should set rate limit headers', () => {
      const middleware = createRateLimiterMiddleware('expensive');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null for unconfigured endpoint', () => {
      const req = createMockRequest();
      const status = getRateLimitStatus(req as Request, '/api/unconfigured');
      expect(status).toBeNull();
    });

    it('should return status for configured endpoint', () => {
      const req = createMockRequest();
      const status = getRateLimitStatus(req as Request, '/api/build');
      expect(status).not.toBeNull();
      expect(status).toHaveProperty('allowed');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('resetMs');
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have all required configs', () => {
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('expensive');
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('normal');
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('readonly');
      expect(RATE_LIMIT_CONFIGS).toHaveProperty('strict');
    });

    it('should have valid config structure', () => {
      Object.values(RATE_LIMIT_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('windowMs');
        expect(config).toHaveProperty('maxRequests');
        expect(typeof config.windowMs).toBe('number');
        expect(typeof config.maxRequests).toBe('number');
      });
    });
  });

  describe('ENDPOINT_RATE_LIMITS', () => {
    it('should map endpoints to valid configs', () => {
      Object.entries(ENDPOINT_RATE_LIMITS).forEach(([endpoint, configName]) => {
        expect(RATE_LIMIT_CONFIGS).toHaveProperty(configName);
      });
    });

    it('should include expensive endpoints', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/build']).toBe('expensive');
      expect(ENDPOINT_RATE_LIMITS['/api/evolve']).toBe('expensive');
      expect(ENDPOINT_RATE_LIMITS['/api/council/evaluate']).toBe('expensive');
    });

    it('should include strict endpoints', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/agents/chaos']).toBe('strict');
      expect(ENDPOINT_RATE_LIMITS['/api/provenance/sign']).toBe('strict');
      expect(ENDPOINT_RATE_LIMITS['/api/create-checkout-session']).toBe('strict');
    });
  });
});

describe('DDoS Protection Middleware', () => {
  beforeEach(() => {
    // Clear all blocks before each test
    clearAllBlocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ddosProtection', () => {
    it('should allow requests within DDoS limit', () => {
      const middleware = ddosProtection;
      const req = createMockRequest('192.168.1.1');
      const res = createMockResponse();
      const next = createMockNext();

      // Make 50 requests (limit is 100)
      for (let i = 0; i < 50; i++) {
        middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
      }

      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding DDoS limit', () => {
      const middleware = ddosProtection;
      const req = createMockRequest('192.168.1.2');
      const res = createMockResponse();
      const next = createMockNext();

      // Make 101 requests (limit is 100)
      for (let i = 0; i < 101; i++) {
        middleware(req as Request, res as Response, next);
      }

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
          message: 'DDoS protection triggered',
        })
      );
    });

    it('should block IPs with too many violations', () => {
      const middleware = ddosProtection;
      const req = createMockRequest('192.168.1.3');
      const res = createMockResponse();
      const next = createMockNext();

      // Trigger violations by exceeding limit multiple times
      for (let violation = 0; violation < 3; violation++) {
        // Exceed limit to trigger violation
        for (let i = 0; i < 101; i++) {
          middleware(req as Request, res as Response, next);
        }
        
        // Reset for next violation
        clearAllBlocks();
      }

      // After 3 violations, IP should be permanently blocked
      middleware(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getDDoSStatus', () => {
    it('should return DDoS protection status', () => {
      const status = getDDoSStatus();
      expect(status).toHaveProperty('blockedIPs');
      expect(status).toHaveProperty('violations');
      expect(status).toHaveProperty('config');
      expect(Array.isArray(status.blockedIPs)).toBe(true);
      expect(Array.isArray(status.violations)).toBe(true);
    });
  });

  describe('unblockIP', () => {
    it('should unblock a blocked IP', () => {
      const ip = '192.168.1.4';
      
      // Manually block the IP by triggering DDoS protection
      const middleware = ddosProtection;
      const req = createMockRequest(ip);
      const res = createMockResponse();
      const next = createMockNext();

      for (let i = 0; i < 101; i++) {
        middleware(req as Request, res as Response, next);
      }

      // Unblock the IP
      unblockIP(ip);

      // IP should no longer be blocked
      middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('clearAllBlocks', () => {
    it('should clear all blocked IPs', () => {
      // Block multiple IPs
      const middleware = ddosProtection;
      const next = createMockNext();

      for (let ipNum = 1; ipNum <= 5; ipNum++) {
        const req = createMockRequest(`192.168.1.${ipNum}`);
        const res = createMockResponse();

        for (let i = 0; i < 101; i++) {
          middleware(req as Request, res as Response, next);
        }
      }

      // Clear all blocks
      const count = clearAllBlocks();
      expect(count).toBeGreaterThan(0);

      // All IPs should be unblocked
      const status = getDDoSStatus();
      expect(status.blockedIPs.length).toBe(0);
    });
  });
});
