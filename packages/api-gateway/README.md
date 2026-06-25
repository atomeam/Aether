# @aether/api-gateway

Production-ready API Gateway with routing, rate limiting, transformation, versioning, and circuit breaking capabilities.

## Features

- **Request Routing**: Flexible route matching with support for wildcards and path parameters
- **Rate Limiting**: Sliding window rate limiting with configurable windows and limits
- **Request/Response Transformation**: Transform requests and responses with custom functions
- **API Versioning**: Support for versioning via headers, query parameters, or URL paths
- **Circuit Breaking**: Prevent cascading failures with circuit breaker pattern
- **TypeScript Types**: Full TypeScript support with type definitions
- **Zod Schemas**: Validation schemas for all configurations
- **Comprehensive Tests**: Full test coverage with Vitest

## Installation

```bash
npm install @aether/api-gateway
```

## Quick Start

```typescript
import { ApiGateway } from '@aether/api-gateway';

const gateway = new ApiGateway({
  routes: [
    {
      path: '/users',
      method: 'GET',
      handler: async (ctx) => ({
        status: 200,
        headers: {},
        body: { users: [] },
        timestamp: Date.now(),
        duration: 0,
      }),
    },
  ],
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
});

const response = await gateway.handle({
  id: 'req-1',
  method: 'GET',
  path: '/users',
  headers: {},
  query: {},
  timestamp: Date.now(),
  ip: '127.0.0.1',
});
```

## Core Concepts

### RequestContext

Represents an incoming request with all necessary context:

```typescript
interface RequestContext {
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
```

### ResponseContext

Represents an outgoing response:

```typescript
interface ResponseContext {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
  duration: number;
}
```

### Route

Defines a route with handler and optional middleware:

```typescript
interface Route {
  path: string;
  method: string;
  version?: string;
  handler: RouteHandler;
  middleware?: Middleware[];
  rateLimit?: RateLimitConfig;
  circuitBreaker?: CircuitBreakerConfig;
}
```

## Features

### Request Routing

```typescript
import { Router } from '@aether/api-gateway';

const router = new Router();

router.addRoute({
  path: '/users/:id',
  method: 'GET',
  handler: async (ctx) => {
    const params = Router.extractParams('/users/:id', ctx.path);
    // params.id contains the user ID
    return { status: 200, headers: {}, timestamp: Date.now(), duration: 0 };
  },
});

// Wildcard matching
router.addRoute({
  path: '/api/*',
  method: 'GET',
  handler: async (ctx) => ({ status: 200, headers: {}, timestamp: Date.now(), duration: 0 }),
});
```

### Rate Limiting

```typescript
import { RateLimiter } from '@aether/api-gateway';

const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute window
  maxRequests: 100, // Max 100 requests per window
  keyGenerator: (ctx) => ctx.ip || 'unknown', // Custom key generator
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

const result = await rateLimiter.check(ctx);
if (!result.allowed) {
  // Request is rate limited
  console.log(`Rate limited. Reset at: ${result.reset}`);
}
```

### Circuit Breaking

```typescript
import { CircuitBreaker } from '@aether/api-gateway';

const circuitBreaker = new CircuitBreaker({
  threshold: 5, // Trip after 5 failures
  timeout: 1000, // Request timeout
  resetTimeout: 30000, // Reset after 30 seconds
  monitoringPeriod: 60000, // Monitor failures in 60s window
});

try {
  const result = await circuitBreaker.execute(async () => {
    // Execute potentially failing operation
    return await fetchExternalService();
  });
} catch (error) {
  // Circuit is open or operation failed
  console.error('Circuit breaker tripped:', error);
}
```

### Transformation

```typescript
import { Transformer, RequestTransformers, ResponseTransformers } from '@aether/api-gateway';

const transformer = new Transformer({
  request: {
    headers: RequestTransformers.normalizeHeaders(),
    body: RequestTransformers.parseJsonBody(),
  },
  response: {
    headers: ResponseTransformers.addCorsHeaders(),
    body: ResponseTransformers.wrapEnvelope(),
  },
});

const transformedCtx = transformer.transformRequest(ctx);
const transformedResponse = transformer.transformResponse(response);
```

### API Versioning

```typescript
import { VersionManager } from '@aether/api-gateway';

const versionManager = new VersionManager({
  header: 'API-Version',
  queryParam: 'version',
  defaultVersion: '1',
  versions: {
    '1': [{ path: '/v1/users', method: 'GET' }],
    '2': [{ path: '/v2/users', method: 'GET' }],
  },
});

const version = versionManager.extractVersion(ctx);
const routes = versionManager.getRoutes(version);
```

### Middleware

```typescript
const loggingMiddleware: Middleware = async (ctx, next) => {
  console.log(`Request: ${ctx.method} ${ctx.path}`);
  const response = await next();
  console.log(`Response: ${response.status}`);
  return response;
};

const authMiddleware: Middleware = async (ctx, next) => {
  const token = ctx.headers['authorization'];
  if (!token) {
    return {
      status: 401,
      headers: {},
      body: { error: 'Unauthorized' },
      timestamp: Date.now(),
      duration: 0,
    };
  }
  return next();
};

// Add to route or globally
const route = {
  path: '/protected',
  method: 'GET',
  middleware: [authMiddleware],
  handler: async (ctx) => ({ status: 200, headers: {}, timestamp: Date.now(), duration: 0 }),
};
```

## API Reference

### ApiGateway

Main gateway class that orchestrates all features.

#### Constructor

```typescript
constructor(config: GatewayConfig)
```

#### Methods

- `handle(ctx: RequestContext): Promise<ResponseContext>` - Handle an incoming request
- `getMetrics(): GatewayMetrics` - Get current metrics
- `resetMetrics(): void` - Reset all metrics
- `getRouter(): Router` - Get router instance
- `getRateLimiter(): RateLimiter | undefined` - Get rate limiter instance
- `getCircuitBreaker(): CircuitBreaker | undefined` - Get circuit breaker instance
- `getTransformer(): Transformer` - Get transformer instance
- `getVersionManager(): VersionManager | undefined` - Get version manager instance
- `destroy(): void` - Cleanup resources

### Router

Handles request routing.

#### Methods

- `addRoute(route: Route): void` - Add a route
- `addRoutes(routes: Route[]): void` - Add multiple routes
- `findRoute(ctx: RequestContext): Route | null` - Find matching route
- `getRoutes(): Route[]` - Get all routes
- `clear(): void` - Clear all routes
- `static matchPath(pattern: string, path: string): boolean` - Match path pattern
- `static extractParams(pattern: string, path: string): Record<string, string>` - Extract path parameters

### RateLimiter

Implements sliding window rate limiting.

#### Constructor

```typescript
constructor(config: RateLimitConfig)
```

#### Methods

- `check(ctx: RequestContext): Promise<RateLimitResult>` - Check if request is allowed
- `recordSuccess(ctx: RequestContext): void` - Record successful request
- `recordFailure(ctx: RequestContext): void` - Record failed request
- `reset(key: string): void` - Reset rate limit for specific key
- `resetAll(): void` - Reset all rate limits
- `size(): number` - Get current store size
- `destroy(): void` - Cleanup resources

### CircuitBreaker

Implements circuit breaker pattern.

#### Constructor

```typescript
constructor(config: CircuitBreakerConfig)
```

#### Methods

- `execute<T>(fn: () => Promise<T>): Promise<T>` - Execute function with circuit breaker protection
- `recordSuccess(): void` - Record successful operation
- `recordFailure(): void` - Record failed operation
- `getState(): CircuitBreakerState` - Get current state
- `open(): void` - Manually open circuit
- `close(): void` - Manually close circuit
- `reset(): void` - Reset circuit breaker

### Transformer

Handles request and response transformation.

#### Constructor

```typescript
constructor(config: TransformConfig)
```

#### Methods

- `transformRequest(ctx: RequestContext): RequestContext` - Transform request context
- `transformResponse(response: ResponseContext): ResponseContext` - Transform response context
- `updateConfig(config: TransformConfig): void` - Update transform config
- `clear(): void` - Clear all transforms

### VersionManager

Handles API versioning.

#### Constructor

```typescript
constructor(config: VersionConfig)
```

#### Methods

- `extractVersion(ctx: RequestContext): string` - Extract version from request
- `getRoutes(version: string): Route[]` - Get routes for version
- `isVersionSupported(version: string): boolean` - Check if version is supported
- `getSupportedVersions(): string[]` - Get all supported versions
- `getLatestVersion(): string` - Get latest version
- `addVersion(version: string, routes: Route[]): void` - Add version routes
- `removeVersion(version: string): void` - Remove version
- `static normalizeVersion(version: string): string` - Normalize version string
- `static compareVersions(v1: string, v2: string): number` - Compare versions

## Testing

```bash
npm test
```

## License

MIT
