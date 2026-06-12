/**
 * API mocking for HTTP requests
 */

import type { ApiMockConfig, ApiResponse, MockDefinition, RouteHandler } from './types.js';
import { ApiMockConfigSchema, ApiResponseSchema, MockDefinitionSchema } from './types.js';

export class ApiMock {
  private config: ApiMockConfig;
  private mocks: Map<string, MockDefinition[]> = new Map();
  private handlers: Map<string, RouteHandler> = new Map();
  private callCount: Map<string, number> = new Map();

  constructor(config: Partial<ApiMockConfig> = {}) {
    this.config = ApiMockConfigSchema.parse(config);
  }

  /**
   * Add a mock definition
   */
  addMock(mock: MockDefinition): void {
    const key = this.getMockKey(mock.method, mock.path);
    const existing = this.mocks.get(key) || [];
    existing.push(MockDefinitionSchema.parse(mock));
    this.mocks.set(key, existing);
  }

  /**
   * Add multiple mock definitions
   */
  addMocks(mocks: MockDefinition[]): void {
    mocks.forEach((mock) => this.addMock(mock));
  }

  /**
   * Add a route handler
   */
  addHandler(method: string, path: string, handler: RouteHandler): void {
    const key = this.getMockKey(method, path);
    this.handlers.set(key, handler);
  }

  /**
   * Handle a request
   */
  async handleRequest(
    method: string,
    path: string,
    options?: {
      headers?: Record<string, string>;
      body?: unknown;
      query?: Record<string, string>;
    }
  ): Promise<ApiResponse> {
    const key = this.getMockKey(method, path);

    // Check for custom handler first
    const handler = this.handlers.get(key);
    if (handler) {
      const response = await handler({
        method,
        path,
        headers: options?.headers,
        body: options?.body,
        query: options?.query,
      });
      return ApiResponseSchema.parse(response);
    }

    // Check for mock definition
    const mocks = this.mocks.get(key);
    if (mocks && mocks.length > 0) {
      const count = this.callCount.get(key) || 0;
      const mock = mocks[count % mocks.length];
      this.callCount.set(key, count + 1);

      // Check if mock has remaining calls
      if (mock.times !== undefined && count >= mock.times) {
        throw new Error(`Mock for ${method} ${path} has been called ${mock.times} times`);
      }

      // Apply delay if configured
      const delay = mock.response.delay || this.config.delay;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (this.config.enableLogging) {
        console.log(`[ApiMock] ${method} ${path} -> ${mock.response.status}`);
      }

      return mock.response;
    }

    // No mock found
    throw new Error(`No mock found for ${method} ${path}`);
  }

  /**
   * Get mock key
   */
  private getMockKey(method: string, path: string): string {
    return `${method}:${path}`;
  }

  /**
   * Clear all mocks
   */
  clear(): void {
    this.mocks.clear();
    this.handlers.clear();
    this.callCount.clear();
  }

  /**
   * Clear mocks for a specific route
   */
  clearRoute(method: string, path: string): void {
    const key = this.getMockKey(method, path);
    this.mocks.delete(key);
    this.handlers.delete(key);
    this.callCount.delete(key);
  }

  /**
   * Get call count for a route
   */
  getCallCount(method: string, path: string): number {
    const key = this.getMockKey(method, path);
    return this.callCount.get(key) || 0;
  }

  /**
   * Reset call counts
   */
  resetCallCounts(): void {
    this.callCount.clear();
  }

  /**
   * Get all mock keys
   */
  getMockKeys(): string[] {
    return Array.from(new Set([...this.mocks.keys(), ...this.handlers.keys()]));
  }
}

export { ApiMockConfig, ApiResponse };
