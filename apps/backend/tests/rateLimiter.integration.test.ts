/**
 * Rate Limiter Integration Test
 * 
 * Simple integration test to verify rate limiting works with the server
 */

import { describe, it, expect } from 'vitest';
import {
  createRateLimiterMiddleware,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  ENDPOINT_RATE_LIMITS,
} from '../src/middleware/rateLimiter';
import {
  ddosProtection,
  getDDoSStatus,
  unblockIP,
  clearAllBlocks,
} from '../src/middleware/ddosProtection';

describe('Rate Limiter Integration', () => {
  it('should export required middleware functions', () => {
    expect(typeof createRateLimiterMiddleware).toBe('function');
    expect(typeof getRateLimitStatus).toBe('function');
    expect(typeof RATE_LIMIT_CONFIGS).toBe('object');
    expect(typeof ENDPOINT_RATE_LIMITS).toBe('object');

    expect(typeof ddosProtection).toBe('function');
    expect(typeof getDDoSStatus).toBe('function');
    expect(typeof unblockIP).toBe('function');
    expect(typeof clearAllBlocks).toBe('function');
  });

  it('should have valid rate limit configurations', () => {
    // Verify all configs have required properties
    Object.values(RATE_LIMIT_CONFIGS).forEach(config => {
      expect(config).toHaveProperty('windowMs');
      expect(config).toHaveProperty('maxRequests');
      expect(typeof config.windowMs).toBe('number');
      expect(typeof config.maxRequests).toBe('number');
      expect(config.windowMs).toBeGreaterThan(0);
      expect(config.maxRequests).toBeGreaterThan(0);
    });

    // Verify endpoint mappings point to valid configs
    Object.values(ENDPOINT_RATE_LIMITS).forEach(configName => {
      expect(RATE_LIMIT_CONFIGS).toHaveProperty(configName);
    });
  });

  it('should include all expensive endpoints', () => {
    // Verify key expensive endpoints are configured
    expect(ENDPOINT_RATE_LIMITS['/api/build']).toBe('expensive');
    expect(ENDPOINT_RATE_LIMITS['/api/evolve']).toBe('expensive');
    expect(ENDPOINT_RATE_LIMITS['/api/council/evaluate']).toBe('expensive');
    expect(ENDPOINT_RATE_LIMITS['/api/adversarial']).toBe('expensive');
    expect(ENDPOINT_RATE_LIMITS['/api/replay']).toBe('expensive');
  });

  it('should include all strict endpoints', () => {
    // Verify key strict endpoints are configured
    expect(ENDPOINT_RATE_LIMITS['/api/agents/chaos']).toBe('strict');
    expect(ENDPOINT_RATE_LIMITS['/api/provenance/sign']).toBe('strict');
    expect(ENDPOINT_RATE_LIMITS['/api/create-checkout-session']).toBe('strict');
  });

  it('should create middleware for all config types', () => {
    expect(() => createRateLimiterMiddleware('expensive')).not.toThrow();
    expect(() => createRateLimiterMiddleware('normal')).not.toThrow();
    expect(() => createRateLimiterMiddleware('readonly')).not.toThrow();
    expect(() => createRateLimiterMiddleware('strict')).not.toThrow();
  });
});
