/**
 * API Gateway Types
 * 
 * Core types for the API Gateway including routing, rate limiting,
 * request/response transformation, versioning, and circuit breaking.
 */

export interface RequestContext {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
  timestamp: number;
  version?: string;
  userId?: string;
  ip?: string;
}

export interface ResponseContext {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
  duration: number;
}

export interface Route {
  path: string;
  method: string;
  version?: string;
  handler: RouteHandler;
  middleware?: Middleware[];
  rateLimit?: RateLimitConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

export type RouteHandler = (
  ctx: RequestContext
) => Promise<ResponseContext> | ResponseContext;

export type Middleware = (
  ctx: RequestContext,
  next: () => Promise<ResponseContext>
) => Promise<ResponseContext>;

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (ctx: RequestContext) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringPeriod?: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  successCount: number;
}

export interface TransformConfig {
  request?: RequestTransform;
  response?: ResponseTransform;
}

export interface RequestTransform {
  body?: (body: unknown) => unknown;
  headers?: (headers: Record<string, string>) => Record<string, string>;
  query?: (query: Record<string, string>) => Record<string, string>;
}

export interface ResponseTransform {
  body?: (body: unknown) => unknown;
  headers?: (headers: Record<string, string>) => Record<string, string>;
  status?: (status: number) => number;
}

export interface VersionConfig {
  header?: string;
  queryParam?: string;
  defaultVersion?: string;
  versions: Record<string, Route[]>;
}

export interface GatewayConfig {
  routes: Route[];
  rateLimit?: RateLimitConfig;
  circuitBreaker?: CircuitBreakerConfig;
  transform?: TransformConfig;
  versioning?: VersionConfig;
  globalMiddleware?: Middleware[];
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  circuitBreakerTrips: number;
  averageResponseTime: number;
  requestsByVersion: Record<string, number>;
  requestsByRoute: Record<string, number>;
}
