/**
 * Router Tests
 */

import { describe, it, expect } from 'vitest';
import { Router } from '../src/router.js';
import type { RequestContext, ResponseContext, Route } from '../src/types.js';

describe('Router', () => {
  describe('addRoute', () => {
    it('should add a route', () => {
      const router = new Router();
      const route: Route = {
        path: '/test',
        method: 'GET',
        handler: async (ctx) => ({
          status: 200,
          headers: {},
          timestamp: Date.now(),
          duration: 0,
        }),
      };

      router.addRoute(route);
      expect(router.getRoutes()).toHaveLength(1);
    });

    it('should add multiple routes', () => {
      const router = new Router();
      const routes: Route[] = [
        {
          path: '/test1',
          method: 'GET',
          handler: async (ctx) => ({
            status: 200,
            headers: {},
            timestamp: Date.now(),
            duration: 0,
          }),
        },
        {
          path: '/test2',
          method: 'POST',
          handler: async (ctx) => ({
            status: 200,
            headers: {},
            timestamp: Date.now(),
            duration: 0,
          }),
        },
      ];

      router.addRoutes(routes);
      expect(router.getRoutes()).toHaveLength(2);
    });
  });

  describe('findRoute', () => {
    it('should find matching route', () => {
      const router = new Router();
      const route: Route = {
        path: '/test',
        method: 'GET',
        handler: async (ctx) => ({
          status: 200,
          headers: {},
          timestamp: Date.now(),
          duration: 0,
        }),
      };

      router.addRoute(route);

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
      };

      const found = router.findRoute(ctx);
      expect(found).toBeTruthy();
      expect(found?.path).toBe('/test');
    });

    it('should return null for non-matching route', () => {
      const router = new Router();
      const route: Route = {
        path: '/test',
        method: 'GET',
        handler: async (ctx) => ({
          status: 200,
          headers: {},
          timestamp: Date.now(),
          duration: 0,
        }),
      };

      router.addRoute(route);

      const ctx: RequestContext = {
        id: '1',
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
      };

      const found = router.findRoute(ctx);
      expect(found).toBeNull();
    });

    it('should find route by version', () => {
      const router = new Router();
      const routes: Route[] = [
        {
          path: '/test',
          method: 'GET',
          version: '1',
          handler: async (ctx) => ({
            status: 200,
            headers: {},
            timestamp: Date.now(),
            duration: 0,
          }),
        },
        {
          path: '/test',
          method: 'GET',
          version: '2',
          handler: async (ctx) => ({
            status: 200,
            headers: {},
            timestamp: Date.now(),
            duration: 0,
          }),
        },
      ];

      router.addRoutes(routes);

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        timestamp: Date.now(),
        version: '2',
      };

      const found = router.findRoute(ctx);
      expect(found?.version).toBe('2');
    });
  });

  describe('clear', () => {
    it('should clear all routes', () => {
      const router = new Router();
      const route: Route = {
        path: '/test',
        method: 'GET',
        handler: async (ctx) => ({
          status: 200,
          headers: {},
          timestamp: Date.now(),
          duration: 0,
        }),
      };

      router.addRoute(route);
      expect(router.getRoutes()).toHaveLength(1);

      router.clear();
      expect(router.getRoutes()).toHaveLength(0);
    });
  });

  describe('matchPath', () => {
    it('should match exact paths', () => {
      expect(Router.matchPath('/test', '/test')).toBe(true);
      expect(Router.matchPath('/test', '/other')).toBe(false);
    });

    it('should match wildcard', () => {
      expect(Router.matchPath('*', '/anything')).toBe(true);
      expect(Router.matchPath('/users/*', '/users/123')).toBe(true);
      expect(Router.matchPath('/users/*', '/posts/123')).toBe(false);
    });
  });

  describe('extractParams', () => {
    it('should extract path parameters', () => {
      const params = Router.extractParams('/users/:id', '/users/123');
      expect(params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const params = Router.extractParams('/users/:id/posts/:postId', '/users/123/posts/456');
      expect(params).toEqual({ id: '123', postId: '456' });
    });

    it('should return empty object for no parameters', () => {
      const params = Router.extractParams('/users', '/users');
      expect(params).toEqual({});
    });
  });
});
