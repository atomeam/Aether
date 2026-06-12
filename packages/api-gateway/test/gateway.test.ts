/**
 * API Gateway Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiGateway } from '../src/gateway.js';
import type { RequestContext, GatewayConfig, Route } from '../src/types.js';

describe('ApiGateway', () => {
  let gateway: ApiGateway;
  let config: GatewayConfig;

  beforeEach(() => {
    config = {
      routes: [
        {
          path: '/test',
          method: 'GET',
          handler: async (ctx) => ({
            status: 200,
            headers: {},
            body: { message: 'success' },
            timestamp: Date.now(),
            duration: 0,
          }),
        },
      ],
      rateLimit: {
        windowMs: 1000,
        maxRequests: 5,
      },
      circuitBreaker: {
        threshold: 3,
        timeout: 1000,
        resetTimeout: 2000,
      },
      transform: {
        response: {
          headers: (headers) => ({
            ...headers,
            'X-Custom': 'value',
          }),
        },
      },
    };

    gateway = new ApiGateway(config);
  });

  describe('handle', () => {
    it('should handle successful request', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      const response = await gateway.handle(ctx);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'success' });
      expect(response.headers['X-Custom']).toBe('value');
    });

    it('should return 404 for unknown route', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/unknown',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      const response = await gateway.handle(ctx);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should rate limit requests', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      // Make 5 requests (limit)
      for (let i = 0; i < 5; i++) {
        await gateway.handle(ctx);
      }

      // 6th request should be rate limited
      const response = await gateway.handle(ctx);
      expect(response.status).toBe(429);
    });

    it('should handle errors gracefully', async () => {
      const errorConfig: GatewayConfig = {
        routes: [
          {
            path: '/error',
            method: 'GET',
            handler: async () => {
              throw new Error('Test error');
            },
          },
        ],
      };

      const errorGateway = new ApiGateway(errorConfig);

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/error',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      const response = await errorGateway.handle(ctx);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('getMetrics', () => {
    it('should track request metrics', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      await gateway.handle(ctx);
      const metrics = gateway.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track failed requests', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/unknown',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      await gateway.handle(ctx);
      const metrics = gateway.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics', async () => {
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
        ip: '127.0.0.1',
      };

      await gateway.handle(ctx);
      gateway.resetMetrics();

      const metrics = gateway.getMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe('getters', () => {
    it('should return router instance', () => {
      expect(gateway.getRouter()).toBeTruthy();
    });

    it('should return rate limiter instance', () => {
      expect(gateway.getRateLimiter()).toBeTruthy();
    });

    it('should return circuit breaker instance', () => {
      expect(gateway.getCircuitBreaker()).toBeTruthy();
    });

    it('should return transformer instance', () => {
      expect(gateway.getTransformer()).toBeTruthy();
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      expect(() => gateway.destroy()).not.toThrow();
    });
  });
});
