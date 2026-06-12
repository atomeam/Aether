/**
 * @aether/api-gateway
 * 
 * Production-ready API Gateway with routing, rate limiting, transformation,
 * versioning, and circuit breaking capabilities.
 */

// Types
export type {
  RequestContext,
  ResponseContext,
  Route,
  RouteHandler,
  Middleware,
  RateLimitConfig,
  RateLimitResult,
  CircuitBreakerConfig,
  CircuitBreakerState,
  TransformConfig,
  RequestTransform,
  ResponseTransform,
  VersionConfig,
  GatewayConfig,
  GatewayMetrics,
} from './types.js';

// Schemas
export {
  RequestContextSchema,
  ResponseContextSchema,
  RateLimitConfigSchema,
  RateLimitResultSchema,
  CircuitBreakerConfigSchema,
  CircuitBreakerStateSchema,
  TransformConfigSchema,
  VersionConfigSchema,
  GatewayConfigSchema,
  GatewayMetricsSchema,
  type RequestContextInput,
  type ResponseContextInput,
  type RateLimitConfigInput,
  type RateLimitResultInput,
  type CircuitBreakerConfigInput,
  type CircuitBreakerStateInput,
  type TransformConfigInput,
  type VersionConfigInput,
  type GatewayConfigInput,
  type GatewayMetricsInput,
} from './schemas.js';

// Core Classes
export { ApiGateway } from './gateway.js';
export { Router } from './router.js';
export { RateLimiter } from './rate-limiter.js';
export { CircuitBreaker } from './circuit-breaker.js';
export { Transformer, RequestTransformers, ResponseTransformers } from './transformer.js';
export { VersionManager } from './versioning.js';
