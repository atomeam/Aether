/**
 * @aether/mocking - Comprehensive mocking and stubbing library
 * 
 * A powerful mocking framework that provides:
 * - API mocking for HTTP requests
 * - Database mocking for data persistence
 * - Service mocking for external services
 * - Request/response interception
 * - Fixture management for test data
 * 
 * @version 1.0.0
 */

export { ApiMock } from './api-mock.js';
export { DatabaseMock } from './database-mock.js';
export { ServiceMock } from './service-mock.js';
export { Interceptor } from './interceptor.js';
export { FixtureManager } from './fixtures.js';
export { schemas } from './types.js';
export type {
  ApiMockConfig,
  ApiResponse,
  DatabaseMockConfig,
  QueryResult,
  ServiceMockConfig,
  InterceptorConfig,
  InterceptedRequest,
  FixtureConfig,
  // MockServer, // TODO: Create mock-server.ts file
  // MockServerConfig, // TODO: Create mock-server.ts file
  MockDefinition,
  RouteHandler,
  DatabaseOperation,
  ServiceCall,
  FixtureData,
  // MockServerRoute, // TODO: Create mock-server.ts file
} from './types.js';
