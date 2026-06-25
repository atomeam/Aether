/**
 * API Gateway
 * 
 * Main gateway class that orchestrates routing, rate limiting,
 * transformation, versioning, and circuit breaking.
 */

import type {
  RequestContext,
  ResponseContext,
  GatewayConfig,
  GatewayMetrics,
  Middleware,
} from './types.js';
import { Router } from './router.js';
import { RateLimiter } from './rate-limiter.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { Transformer } from './transformer.js';
import { VersionManager } from './versioning.js';

export class ApiGateway {
  private router: Router;
  private rateLimiter?: RateLimiter;
  private circuitBreaker?: CircuitBreaker;
  private transformer: Transformer;
  private versionManager?: VersionManager;
  private metrics: GatewayMetrics;
  private globalMiddleware: Middleware[];

  constructor(config: GatewayConfig) {
    this.router = new Router(config.globalMiddleware);
    this.globalMiddleware = config.globalMiddleware || [];

    // Add routes
    this.router.addRoutes(config.routes);

    // Initialize rate limiter
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit);
    }

    // Initialize circuit breaker
    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    }

    // Initialize transformer
    this.transformer = new Transformer(config.transform);

    // Initialize version manager
    if (config.versioning) {
      this.versionManager = new VersionManager(config.versioning);
    }

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      requestsByVersion: {},
      requestsByRoute: {},
    };
  }

  /**
   * Handle an incoming request
   */
  async handle(ctx: RequestContext): Promise<ResponseContext> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Extract version if versioning is enabled
      if (this.versionManager) {
        ctx.version = this.versionManager.extractVersion(ctx);
        this.metrics.requestsByVersion[ctx.version] =
          (this.metrics.requestsByVersion[ctx.version] || 0) + 1;
      }

      // Transform request
      ctx = this.transformer.transformRequest(ctx);

      // Check rate limit
      if (this.rateLimiter) {
        const rateLimitResult = await this.rateLimiter.check(ctx);
        if (!rateLimitResult.allowed) {
          this.metrics.rateLimitedRequests++;
          return {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            },
            body: {
              error: 'Too Many Requests',
              message: 'Rate limit exceeded',
            },
            timestamp: Date.now(),
            duration: Date.now() - startTime,
          };
        }
      }

      // Find route
      const route = this.router.findRoute(ctx);
      if (!route) {
        this.metrics.failedRequests++;
        return {
          status: 404,
          headers: {},
          body: {
            error: 'Not Found',
            message: 'Route not found',
          },
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }

      // Track route metrics
      const routeKey = `${ctx.method}:${ctx.path}`;
      this.metrics.requestsByRoute[routeKey] =
        (this.metrics.requestsByRoute[routeKey] || 0) + 1;

      // Execute with circuit breaker if configured
      let response: ResponseContext;
      if (this.circuitBreaker && route.circuitBreaker) {
        response = await this.circuitBreaker.execute(async () => {
          return this.executeRoute(ctx, route);
        });
      } else {
        response = await this.executeRoute(ctx, route);
      }

      // Transform response
      response = this.transformer.transformResponse(response);

      // Record success for rate limiter
      if (this.rateLimiter && response.status < 400) {
        this.rateLimiter.recordSuccess(ctx);
      } else if (this.rateLimiter) {
        this.rateLimiter.recordFailure(ctx);
      }

      // Update metrics
      if (response.status >= 200 && response.status < 300) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.failedRequests++;
      }

      return response;
    } catch (error) {
      this.metrics.failedRequests++;

      // Record failure for rate limiter
      if (this.rateLimiter) {
        this.rateLimiter.recordFailure(ctx);
      }

      return {
        status: 500,
        headers: {},
        body: {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    } finally {
      // Update average response time
      const duration = Date.now() - startTime;
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) /
        this.metrics.totalRequests;
    }
  }

  /**
   * Execute a route with middleware
   */
  private async executeRoute(
    ctx: RequestContext,
    route: any
  ): Promise<ResponseContext> {
    // Build middleware chain
    const middleware = [
      ...this.globalMiddleware,
      ...(route.middleware || []),
    ];

    let index = 0;

    const next = async (): Promise<ResponseContext> => {
      if (index < middleware.length) {
        const fn = middleware[index++];
        return fn(ctx, next);
      }
      return route.handler(ctx);
    };

    return next();
  }

  /**
   * Get current metrics
   */
  getMetrics(): GatewayMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      requestsByVersion: {},
      requestsByRoute: {},
    };
  }

  /**
   * Get router instance
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get rate limiter instance
   */
  getRateLimiter(): RateLimiter | undefined {
    return this.rateLimiter;
  }

  /**
   * Get circuit breaker instance
   */
  getCircuitBreaker(): CircuitBreaker | undefined {
    return this.circuitBreaker;
  }

  /**
   * Get transformer instance
   */
  getTransformer(): Transformer {
    return this.transformer;
  }

  /**
   * Get version manager instance
   */
  getVersionManager(): VersionManager | undefined {
    return this.versionManager;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.rateLimiter) {
      this.rateLimiter.destroy();
    }
  }
}
