/**
 * API Gateway Versioning
 * 
 * Handles API versioning via headers, query parameters, or URL paths.
 */

import type { RequestContext, VersionConfig } from './types.js';

export class VersionManager {
  private config: Required<VersionConfig>;

  constructor(config: VersionConfig) {
    this.config = {
      header: config.header || 'API-Version',
      queryParam: config.queryParam || 'version',
      defaultVersion: config.defaultVersion || '1',
      versions: config.versions,
    };
  }

  /**
   * Extract version from request context
   */
  extractVersion(ctx: RequestContext): string {
    // Try header first
    if (this.config.header) {
      const headerVersion = ctx.headers[this.config.header.toLowerCase()];
      if (headerVersion) {
        return headerVersion;
      }
    }

    // Try query parameter
    if (this.config.queryParam) {
      const queryVersion = ctx.query[this.config.queryParam];
      if (queryVersion) {
        return queryVersion;
      }
    }

    // Try path version
    const pathVersion = this.extractPathVersion(ctx.path);
    if (pathVersion) {
      return pathVersion;
    }

    // Return default
    return this.config.defaultVersion;
  }

  /**
   * Get routes for a specific version
   */
  getRoutes(version: string) {
    return this.config.versions[version] || [];
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: string): boolean {
    return version in this.config.versions;
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions(): string[] {
    return Object.keys(this.config.versions);
  }

  /**
   * Get latest version
   */
  getLatestVersion(): string {
    const versions = this.getSupportedVersions();
    if (versions.length === 0) return this.config.defaultVersion;
    return versions[versions.length - 1];
  }

  /**
   * Add version routes
   */
  addVersion(version: string, routes: any[]): void {
    this.config.versions[version] = routes;
  }

  /**
   * Remove version
   */
  removeVersion(version: string): void {
    delete this.config.versions[version];
  }

  /**
   * Extract version from path (e.g., /v1/users -> v1)
   */
  private extractPathVersion(path: string): string | null {
    const match = path.match(/^\/v(\d+)\//);
    return match ? match[1] : null;
  }

  /**
   * Normalize version string (remove 'v' prefix if present)
   */
  static normalizeVersion(version: string): string {
    return version.replace(/^v/i, '');
  }

  /**
   * Compare versions
   */
  static compareVersions(v1: string, v2: string): number {
    const n1 = parseInt(VersionManager.normalizeVersion(v1), 10);
    const n2 = parseInt(VersionManager.normalizeVersion(v2), 10);
    return n1 - n2;
  }
}
