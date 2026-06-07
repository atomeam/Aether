/**
 * Rate Limiting Middleware
 * 
 * Express middleware for rate limiting using @aether/rate-limiter
 */

import { Request, Response, NextFunction } from 'express';
import { allow, checkLimit, RateLimitConfig, RateLimitResult } from '@aether/rate-limiter';

// Rate limit configurations for different endpoint categories
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Expensive endpoints (AI generation, heavy computation)
  expensive: {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  
  // Normal endpoints (API calls, moderate computation)
  normal: {
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  // Read-only endpoints (GET requests, low cost)
  readonly: {
    windowMs: 60000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
  
  // Strict endpoints (security-sensitive operations)
  strict: {
    windowMs: 60000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
};

// Endpoint to config mapping
export const ENDPOINT_RATE_LIMITS: Record<string, string> = {
  '/api/build': 'expensive',
  '/api/evolve': 'expensive',
  '/api/agents/chaos': 'strict',
  '/api/agents/reflect': 'normal',
  '/api/workflows/trigger': 'normal',
  '/api/alerts': 'normal',
  '/api/human-queue': 'normal',
  '/api/triage': 'normal',
  '/api/council/evaluate': 'expensive',
  '/api/adversarial': 'expensive',
  '/api/replay': 'expensive',
  '/api/compactor': 'normal',
  '/api/git/commit': 'normal',
  '/api/bridge/execute': 'normal',
  '/api/sandbox': 'normal',
  '/api/provenance/sign': 'strict',
  '/api/tombstone': 'normal',
  '/api/convene': 'normal',
  '/api/create-checkout-session': 'strict',
  '/api/stripe-webhook': 'normal',
};

// Get client identifier (IP address or custom header)
function getClientId(req: Request): string {
  // Check for custom header (e.g., from reverse proxy)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }
  
  return req.ip || 'unknown';
}

// Get rate limit key based on endpoint and client
function getRateLimitKey(req: Request, endpoint: string): string {
  const clientId = getClientId(req);
  return `${endpoint}:${clientId}`;
}

// Rate limiting middleware factory
export function createRateLimiterMiddleware(configName: string) {
  const config = RATE_LIMIT_CONFIGS[configName];
  
  if (!config) {
    throw new Error(`Unknown rate limit config: ${configName}`);
  }
  
  return (req: Request, res: Response, next: NextFunction) => {
    const endpoint = req.path;
    const key = getRateLimitKey(req, endpoint);
    
    // Check rate limit
    const result = checkLimit(key, config);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.resetMs).toISOString());
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(result.resetMs / 1000),
        limit: config.maxRequests,
        window: config.windowMs,
      });
    }
    
    // Allow the request and record it
    allow(key, config);
    next();
  };
}

// Generic rate limiting middleware (uses endpoint mapping)
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const endpoint = req.path;
  const configName = ENDPOINT_RATE_LIMITS[endpoint];
  
  if (!configName) {
    // No rate limit configured for this endpoint
    return next();
  }
  
  const middleware = createRateLimiterMiddleware(configName);
  middleware(req, res, next);
}

// Get current rate limit status for a client
export function getRateLimitStatus(req: Request, endpoint: string): RateLimitResult | null {
  const configName = ENDPOINT_RATE_LIMITS[endpoint];
  
  if (!configName) {
    return null;
  }
  
  const config = RATE_LIMIT_CONFIGS[configName];
  const key = getRateLimitKey(req, endpoint);
  
  return checkLimit(key, config);
}

// Reset rate limit for a client (admin function)
export function resetRateLimit(req: Request, endpoint: string): void {
  const key = getRateLimitKey(req, endpoint);
  const { resetLimit } = require('@aether/rate-limiter');
  resetLimit(key);
}
