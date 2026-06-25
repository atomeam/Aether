/**
 * Type definitions for mocking library
 */

import { z } from 'zod';

// =============================================================================
// API MOCKING
// =============================================================================

export const ApiMockConfigSchema = z.object({
  baseUrl: z.string().default('http://localhost:3000'),
  delay: z.number().int().nonnegative().default(0),
  enableLogging: z.boolean().default(false),
});

export type ApiMockConfig = z.infer<typeof ApiMockConfigSchema>;

export const ApiResponseSchema = z.object({
  status: z.number().int().positive(),
  headers: z.record(z.string()).default({}),
  body: z.unknown().optional(),
  delay: z.number().int().nonnegative().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

export const MockDefinitionSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  path: z.string(),
  response: ApiResponseSchema,
  times: z.number().int().nonnegative().optional(),
});

export type MockDefinition = z.infer<typeof MockDefinitionSchema>;

export const RouteHandlerSchema = z.function().args(z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  query: z.record(z.string()).optional(),
})).returns(z.union([z.custom<ApiResponse>(), z.custom<Promise<ApiResponse>>()]));

export type RouteHandler = z.infer<typeof RouteHandlerSchema>;

// =============================================================================
// DATABASE MOCKING
// =============================================================================

export const DatabaseMockConfigSchema = z.object({
  autoCommit: z.boolean().default(true),
  delay: z.number().int().nonnegative().default(0),
  enableLogging: z.boolean().default(false),
});

export type DatabaseMockConfig = z.infer<typeof DatabaseMockConfigSchema>;

export const QueryResultSchema = z.object({
  rows: z.array(z.record(z.unknown())).default([]),
  rowCount: z.number().int().nonnegative().default(0),
  affectedRows: z.number().int().nonnegative().default(0),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

export const DatabaseOperationSchema = z.union([
  z.object({
    type: z.literal('SELECT'),
    table: z.string(),
    where: z.record(z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('INSERT'),
    table: z.string(),
    data: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal('UPDATE'),
    table: z.string(),
    data: z.record(z.unknown()),
    where: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal('DELETE'),
    table: z.string(),
    where: z.record(z.unknown()),
  }),
]);

export type DatabaseOperation = z.infer<typeof DatabaseOperationSchema>;

// =============================================================================
// SERVICE MOCKING
// =============================================================================

export const ServiceMockConfigSchema = z.object({
  serviceName: z.string(),
  timeout: z.number().int().positive().default(5000),
  enableLogging: z.boolean().default(false),
});

export type ServiceMockConfig = z.infer<typeof ServiceMockConfigSchema>;

export const ServiceCallSchema = z.object({
  method: z.string(),
  params: z.array(z.unknown()).default([]),
  result: z.unknown().optional(),
  error: z.string().optional(),
  delay: z.number().int().nonnegative().optional(),
  timestamp: z.number().optional(),
});

export type ServiceCall = z.infer<typeof ServiceCallSchema>;

// =============================================================================
// INTERCEPTION
// =============================================================================

export const InterceptorConfigSchema = z.object({
  enableLogging: z.boolean().default(false),
  interceptRequests: z.boolean().default(true),
  interceptResponses: z.boolean().default(true),
});

export type InterceptorConfig = z.infer<typeof InterceptorConfigSchema>;

export const InterceptedRequestSchema = z.object({
  id: z.string(),
  method: z.string(),
  url: z.string(),
  headers: z.record(z.string()).default({}),
  body: z.unknown().optional(),
  timestamp: z.number(),
});

export type InterceptedRequest = z.infer<typeof InterceptedRequestSchema>;

export const InterceptedResponseSchema = z.object({
  requestId: z.string(),
  status: z.number().int().positive(),
  headers: z.record(z.string()).default({}),
  body: z.unknown().optional(),
  timestamp: z.number(),
  duration: z.number().nonnegative(),
});

export type InterceptedResponse = z.infer<typeof InterceptedResponseSchema>;

// =============================================================================
// FIXTURES
// =============================================================================

export const FixtureConfigSchema = z.object({
  directory: z.string().default('__fixtures__'),
  autoLoad: z.boolean().default(true),
  parser: z.enum(['json', 'yaml', 'js']).default('json'),
});

export type FixtureConfig = z.infer<typeof FixtureConfigSchema>;

export const FixtureDataSchema = z.record(z.unknown());

export type FixtureData = z.infer<typeof FixtureDataSchema>;

// =============================================================================
// MOCK SERVER
// =============================================================================

export const MockServerConfigSchema = z.object({
  port: z.number().int().positive().default(3000),
  host: z.string().default('localhost'),
  enableCors: z.boolean().default(true),
  enableLogging: z.boolean().default(false),
});

export type MockServerConfig = z.infer<typeof MockServerConfigSchema>;

export const MockServerRouteSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  path: z.string(),
  handler: z.custom<RouteHandler>(),
});

export type MockServerRoute = z.infer<typeof MockServerRouteSchema>;

// =============================================================================
// EXPORT SCHEMAS
// =============================================================================

export const schemas = {
  ApiMockConfig: ApiMockConfigSchema,
  ApiResponse: ApiResponseSchema,
  MockDefinition: MockDefinitionSchema,
  RouteHandler: RouteHandlerSchema,
  DatabaseMockConfig: DatabaseMockConfigSchema,
  QueryResult: QueryResultSchema,
  DatabaseOperation: DatabaseOperationSchema,
  ServiceMockConfig: ServiceMockConfigSchema,
  ServiceCall: ServiceCallSchema,
  InterceptorConfig: InterceptorConfigSchema,
  InterceptedRequest: InterceptedRequestSchema,
  InterceptedResponse: InterceptedResponseSchema,
  FixtureConfig: FixtureConfigSchema,
  FixtureData: FixtureDataSchema,
  MockServerConfig: MockServerConfigSchema,
  MockServerRoute: MockServerRouteSchema,
} as const;
