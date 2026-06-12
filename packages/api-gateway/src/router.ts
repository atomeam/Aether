/**
 * API Gateway Router
 * 
 * Handles request routing with support for versioning and pattern matching.
 */

import type { RequestContext, ResponseContext, Route, Middleware } from './types.js';

export class Router {
  private routes: Map<string, Route[]> = new Map();
  private middleware: Middleware[] = [];

  constructor(middleware: Middleware[] = []) {
    this.middleware = middleware;
  }

  /**
   * Add a route to the router
   */
  addRoute(route: Route): void {
    const key = this.getRouteKey(route.method, route.path);
    if (!this.routes.has(key)) {
      this.routes.set(key, []);
    }
    this.routes.get(key)!.push(route);
  }

  /**
   * Add multiple routes
   */
  addRoutes(routes: Route[]): void {
    routes.forEach(route => this.addRoute(route));
  }

  /**
   * Find matching route for a request
   */
  findRoute(ctx: RequestContext): Route | null {
    const key = this.getRouteKey(ctx.method, ctx.path);
    const routes = this.routes.get(key);

    if (!routes || routes.length === 0) {
      return null;
    }

    // Filter by version if specified
    if (ctx.version) {
      const versionedRoute = routes.find(r => r.version === ctx.version);
      if (versionedRoute) return versionedRoute;
    }

    // Return first matching route (or default version)
    return routes[0];
  }

  /**
   * Get all routes
   */
  getRoutes(): Route[] {
    const allRoutes: Route[] = [];
    this.routes.forEach(routes => allRoutes.push(...routes));
    return allRoutes;
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
  }

  /**
   * Generate a route key for storage
   */
  private getRouteKey(method: string, path: string): string {
    return `${method}:${path}`;
  }

  /**
   * Match path pattern (supports wildcards)
   */
  static matchPath(pattern: string, path: string): boolean {
    if (pattern === path) return true;
    if (pattern === '*') return true;
    
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    return patternParts.every((part, i) => {
      return part === '*' || part === pathParts[i];
    });
  }

  /**
   * Extract path parameters
   */
  static extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    patternParts.forEach((part, i) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = pathParts[i];
      }
    });

    return params;
  }
}
