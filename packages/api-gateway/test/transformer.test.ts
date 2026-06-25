/**
 * Transformer Tests
 */

import { describe, it, expect } from 'vitest';
import { Transformer, RequestTransformers, ResponseTransformers } from '../src/transformer.js';
import type { RequestContext, ResponseContext } from '../src/types.js';

describe('Transformer', () => {
  describe('transformRequest', () => {
    it('should return unchanged context when no transforms', () => {
      const transformer = new Transformer();
      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
      };

      const result = transformer.transformRequest(ctx);
      expect(result).toEqual(ctx);
    });

    it('should transform body', () => {
      const transformer = new Transformer({
        request: {
          body: (body) => ({ ...body, transformed: true }),
        },
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body: { data: 'test' },
        timestamp: Date.now(),
      };

      const result = transformer.transformRequest(ctx);
      expect(result.body).toEqual({ data: 'test', transformed: true });
    });

    it('should transform headers', () => {
      const transformer = new Transformer({
        request: {
          headers: (headers) => ({ ...headers, 'X-Custom': 'value' }),
        },
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: { 'Content-Type': 'application/json' },
        query: {},
        timestamp: Date.now(),
      };

      const result = transformer.transformRequest(ctx);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
    });

    it('should transform query', () => {
      const transformer = new Transformer({
        request: {
          query: (query) => ({ ...query, filter: 'active' }),
        },
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: { page: '1' },
        timestamp: Date.now(),
      };

      const result = transformer.transformRequest(ctx);
      expect(result.query).toEqual({ page: '1', filter: 'active' });
    });
  });

  describe('transformResponse', () => {
    it('should return unchanged response when no transforms', () => {
      const transformer = new Transformer();
      const response: ResponseContext = {
        status: 200,
        headers: {},
        timestamp: Date.now(),
        duration: 100,
      };

      const result = transformer.transformResponse(response);
      expect(result).toEqual(response);
    });

    it('should transform body', () => {
      const transformer = new Transformer({
        response: {
          body: (body) => ({ ...body, wrapped: true }),
        },
      });

      const response: ResponseContext = {
        status: 200,
        headers: {},
        body: { data: 'test' },
        timestamp: Date.now(),
        duration: 100,
      };

      const result = transformer.transformResponse(response);
      expect(result.body).toEqual({ data: 'test', wrapped: true });
    });

    it('should transform status', () => {
      const transformer = new Transformer({
        response: {
          status: (status) => (status === 200 ? 201 : status),
        },
      });

      const response: ResponseContext = {
        status: 200,
        headers: {},
        timestamp: Date.now(),
        duration: 100,
      };

      const result = transformer.transformResponse(response);
      expect(result.status).toBe(201);
    });
  });

  describe('RequestTransformers', () => {
    it('addDefaultHeaders should add headers', () => {
      const transform = RequestTransformers.addDefaultHeaders({
        'X-API-Key': 'secret',
      });

      const result = transform({ 'Content-Type': 'application/json' });
      expect(result).toEqual({
        'Content-Type': 'application/json',
        'X-API-Key': 'secret',
      });
    });

    it('removeHeaders should remove headers', () => {
      const transform = RequestTransformers.removeHeaders(['authorization']);

      const result = transform({
        'authorization': 'Bearer token',
        'content-type': 'application/json',
      });

      expect(result).toEqual({
        'content-type': 'application/json',
      });
      expect(result).not.toHaveProperty('authorization');
    });

    it('normalizeHeaders should lowercase headers', () => {
      const transform = RequestTransformers.normalizeHeaders();

      const result = transform({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });

      expect(result).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token',
      });
    });

    it('parseJsonBody should parse JSON string', () => {
      const transform = RequestTransformers.parseJsonBody();

      const result = transform('{"data":"test"}');
      expect(result).toEqual({ data: 'test' });
    });

    it('stringifyJsonBody should stringify object', () => {
      const transform = RequestTransformers.stringifyJsonBody();

      const result = transform({ data: 'test' });
      expect(result).toBe('{"data":"test"}');
    });
  });

  describe('ResponseTransformers', () => {
    it('addCorsHeaders should add CORS headers', () => {
      const transform = ResponseTransformers.addCorsHeaders();

      const result = transform({ 'Content-Type': 'application/json' });
      expect(result).toHaveProperty('Access-Control-Allow-Origin');
      expect(result).toHaveProperty('Access-Control-Allow-Methods');
    });

    it('addSecurityHeaders should add security headers', () => {
      const transform = ResponseTransformers.addSecurityHeaders();

      const result = transform({});
      expect(result).toHaveProperty('X-Content-Type-Options');
      expect(result).toHaveProperty('X-Frame-Options');
    });

    it('removeSensitiveHeaders should remove sensitive headers', () => {
      const transform = ResponseTransformers.removeSensitiveHeaders();

      const result = transform({
        'authorization': 'Bearer token',
        'cookie': 'session=abc',
        'content-type': 'application/json',
      });

      expect(result).toEqual({
        'content-type': 'application/json',
      });
    });

    it('wrapEnvelope should wrap response', () => {
      const transform = ResponseTransformers.wrapEnvelope();

      const result = transform({ data: 'test' });
      expect(result).toEqual({
        success: true,
        data: { data: 'test' },
        timestamp: expect.any(Number),
      });
    });

    it('handleError should handle error response', () => {
      const transform = ResponseTransformers.handleError();

      const result = transform('Internal error');
      expect(result).toEqual({
        success: false,
        error: 'Internal error',
        timestamp: expect.any(Number),
      });
    });
  });
});
