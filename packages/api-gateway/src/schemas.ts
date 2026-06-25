/**
 * API Gateway Zod Schemas
 * 
 * Validation schemas for all API Gateway types and configurations.
 */

import { z } from 'zod';

// Request Context
export const RequestContextSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  path: z.string(),
  headers: z.record(z.string()),
  query: z.record(z.string()),
  body: z.unknown().optional(),
  timestamp: z.number(),
  version: z.string().optional(),
  userId: z.string().optional(),
  ip: z.string().optional(),
});

export type RequestContextInput = z.infer<typeof RequestContextSchema>;

// Response Context
export const ResponseContextSchema = z.object({
  status: z.number().int().min(100).max(599),
  headers: z.record(z.string()),
  body: z.unknown().optional(),
  timestamp: z.number(),
  duration: z.number().nonnegative(),
});

export type ResponseContextInput = z.infer<typeof ResponseContextSchema>;

// Rate Limit Config
export const RateLimitConfigSchema = z.object({
  windowMs: z.number().positive(),
  maxRequests: z.number().int().positive(),
  keyGenerator: z.function().optional(),
  skipSuccessfulRequests: z.boolean().optional().default(false),
  skipFailedRequests: z.boolean().optional().default(false),
});

export type RateLimitConfigInput = z.infer<typeof RateLimitConfigSchema>;

// Rate Limit Result
export const RateLimitResultSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int().nonnegative(),
  reset: z.number(),
  limit: z.number().int().positive(),
});

export type RateLimitResultInput = z.infer<typeof RateLimitResultSchema>;

// Circuit Breaker Config
export const CircuitBreakerConfigSchema = z.object({
  threshold: z.number().int().positive(),
  timeout: z.number().positive(),
  resetTimeout: z.number().positive(),
  monitoringPeriod: z.number().positive().optional(),
});

export type CircuitBreakerConfigInput = z.infer<typeof CircuitBreakerConfigSchema>;

// Circuit Breaker State
export const CircuitBreakerStateSchema = z.object({
  state: z.enum(['closed', 'open', 'half-open']),
  failureCount: z.number().int().nonnegative(),
  lastFailureTime: z.number().optional(),
  lastSuccessTime: z.number().optional(),
  successCount: z.number().int().nonnegative(),
});

export type CircuitBreakerStateInput = z.infer<typeof CircuitBreakerStateSchema>;

// Transform Config
export const RequestTransformSchema = z.object({
  body: z.function().optional(),
  headers: z.function().optional(),
  query: z.function().optional(),
});

export const ResponseTransformSchema = z.object({
  body: z.function().optional(),
  headers: z.function().optional(),
  status: z.function().optional(),
});

export const TransformConfigSchema = z.object({
  request: RequestTransformSchema.optional(),
  response: ResponseTransformSchema.optional(),
});

export type TransformConfigInput = z.infer<typeof TransformConfigSchema>;

// Version Config
export const VersionConfigSchema = z.object({
  header: z.string().optional(),
  queryParam: z.string().optional(),
  defaultVersion: z.string().optional(),
  versions: z.record(z.array(z.any())), // Route[] - will be validated separately
});

export type VersionConfigInput = z.infer<typeof VersionConfigSchema>;

// Gateway Config
export const GatewayConfigSchema = z.object({
  routes: z.array(z.any()), // Route[] - will be validated separately
  rateLimit: RateLimitConfigSchema.optional(),
  circuitBreaker: CircuitBreakerConfigSchema.optional(),
  transform: TransformConfigSchema.optional(),
  versioning: VersionConfigSchema.optional(),
  globalMiddleware: z.array(z.any()).optional(), // Middleware[]
});

export type GatewayConfigInput = z.infer<typeof GatewayConfigSchema>;

// Gateway Metrics
export const GatewayMetricsSchema = z.object({
  totalRequests: z.number().int().nonnegative(),
  successfulRequests: z.number().int().nonnegative(),
  failedRequests: z.number().int().nonnegative(),
  rateLimitedRequests: z.number().int().nonnegative(),
  circuitBreakerTrips: z.number().int().nonnegative(),
  averageResponseTime: z.number().nonnegative(),
  requestsByVersion: z.record(z.number().int().nonnegative()),
  requestsByRoute: z.record(z.number().int().nonnegative()),
});

export type GatewayMetricsInput = z.infer<typeof GatewayMetricsSchema>;
