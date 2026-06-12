/**
 * Version Manager Tests
 */

import { describe, it, expect } from 'vitest';
import { VersionManager } from '../src/versioning.js';
import type { RequestContext } from '../src/types.js';

describe('VersionManager', () => {
  describe('extractVersion', () => {
    it('should extract version from header', () => {
      const manager = new VersionManager({
        header: 'API-Version',
        versions: {},
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: { 'api-version': '2' },
        query: {},
        timestamp: Date.now(),
      };

      const version = manager.extractVersion(ctx);
      expect(version).toBe('2');
    });

    it('should extract version from query parameter', () => {
      const manager = new VersionManager({
        queryParam: 'version',
        versions: {},
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/test',
        headers: {},
        query: { version: '3' },
        timestamp: Date.now(),
      };

      const version = manager.extractVersion(ctx);
      expect(version).toBe('3');
    });

    it('should extract version from path', () => {
      const manager = new VersionManager({
        versions: {},
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/v2/users',
        headers: {},
        query: {},
        timestamp: Date.now(),
      };

      const version = manager.extractVersion(ctx);
      expect(version).toBe('2');
    });

    it('should return default version when not found', () => {
      const manager = new VersionManager({
        defaultVersion: '1',
        versions: {},
      });

      const ctx: RequestContext = {
        id: '1',
        method: 'GET',
        path: '/users',
        headers: {},
        query: {},
        timestamp: Date.now(),
      };

      const version = manager.extractVersion(ctx);
      expect(version).toBe('1');
    });
  });

  describe('getRoutes', () => {
    it('should return routes for version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [{ path: '/v1/users', method: 'GET' }],
          '2': [{ path: '/v2/users', method: 'GET' }],
        },
      });

      const routes = manager.getRoutes('2');
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe('/v2/users');
    });

    it('should return empty array for unsupported version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [{ path: '/v1/users', method: 'GET' }],
        },
      });

      const routes = manager.getRoutes('3');
      expect(routes).toHaveLength(0);
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for supported version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [],
          '2': [],
        },
      });

      expect(manager.isVersionSupported('1')).toBe(true);
      expect(manager.isVersionSupported('2')).toBe(true);
    });

    it('should return false for unsupported version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [],
        },
      });

      expect(manager.isVersionSupported('3')).toBe(false);
    });
  });

  describe('getSupportedVersions', () => {
    it('should return all supported versions', () => {
      const manager = new VersionManager({
        versions: {
          '1': [],
          '2': [],
          '3': [],
        },
      });

      const versions = manager.getSupportedVersions();
      expect(versions).toEqual(['1', '2', '3']);
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [],
          '2': [],
          '3': [],
        },
      });

      expect(manager.getLatestVersion()).toBe('3');
    });

    it('should return default version when no versions', () => {
      const manager = new VersionManager({
        defaultVersion: '1',
        versions: {},
      });

      expect(manager.getLatestVersion()).toBe('1');
    });
  });

  describe('addVersion', () => {
    it('should add version routes', () => {
      const manager = new VersionManager({
        versions: {},
      });

      manager.addVersion('4', [{ path: '/v4/users', method: 'GET' }]);

      expect(manager.isVersionSupported('4')).toBe(true);
      expect(manager.getRoutes('4')).toHaveLength(1);
    });
  });

  describe('removeVersion', () => {
    it('should remove version', () => {
      const manager = new VersionManager({
        versions: {
          '1': [],
          '2': [],
        },
      });

      manager.removeVersion('2');

      expect(manager.isVersionSupported('2')).toBe(false);
      expect(manager.getSupportedVersions()).toEqual(['1']);
    });
  });

  describe('normalizeVersion', () => {
    it('should remove v prefix', () => {
      expect(VersionManager.normalizeVersion('v1')).toBe('1');
      expect(VersionManager.normalizeVersion('V2')).toBe('2');
      expect(VersionManager.normalizeVersion('3')).toBe('3');
    });
  });

  describe('compareVersions', () => {
    it('should compare versions', () => {
      expect(VersionManager.compareVersions('1', '2')).toBeLessThan(0);
      expect(VersionManager.compareVersions('2', '1')).toBeGreaterThan(0);
      expect(VersionManager.compareVersions('1', '1')).toBe(0);
      expect(VersionManager.compareVersions('v1', 'v2')).toBeLessThan(0);
    });
  });
});
