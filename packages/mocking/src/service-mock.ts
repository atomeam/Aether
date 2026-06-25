/**
 * Service mocking for external services
 */

import type { ServiceMockConfig, ServiceCall } from './types.js';
import { ServiceMockConfigSchema, ServiceCallSchema } from './types.js';

export class ServiceMock {
  private config: ServiceMockConfig;
  private mocks: Map<string, ServiceCall[]> = new Map();
  private callHistory: ServiceCall[] = [];

  constructor(config: ServiceMockConfig) {
    this.config = ServiceMockConfigSchema.parse(config);
  }

  /**
   * Add a service call mock
   */
  addMock(mock: ServiceCall): void {
    const key = this.getServiceKey(mock.method);
    const existing = this.mocks.get(key) || [];
    existing.push(ServiceCallSchema.parse(mock));
    this.mocks.set(key, existing);
  }

  /**
   * Add multiple service call mocks
   */
  addMocks(mocks: ServiceCall[]): void {
    mocks.forEach((mock) => this.addMock(mock));
  }

  /**
   * Call a service method
   */
  async call(method: string, params: unknown[] = []): Promise<unknown> {
    const key = this.getServiceKey(method);
    const mocks = this.mocks.get(key);

    if (!mocks || mocks.length === 0) {
      throw new Error(`No mock found for service method: ${method}`);
    }

    const mock = mocks[0];
    const call: ServiceCall = {
      method,
      params,
      timestamp: Date.now(),
    };

    // Apply delay if configured
    if (mock.delay) {
      await new Promise((resolve) => setTimeout(resolve, mock.delay));
    }

    // Record call
    this.callHistory.push(call);

    if (this.config.enableLogging) {
      console.log(`[ServiceMock] ${this.config.serviceName}.${method}(${JSON.stringify(params)})`);
    }

    // Return error if configured
    if (mock.error) {
      throw new Error(mock.error);
    }

    // Return result
    return mock.result;
  }

  /**
   * Get service key
   */
  private getServiceKey(method: string): string {
    return `${this.config.serviceName}.${method}`;
  }

  /**
   * Clear all mocks
   */
  clear(): void {
    this.mocks.clear();
    this.callHistory = [];
  }

  /**
   * Clear mocks for a specific method
   */
  clearMethod(method: string): void {
    const key = this.getServiceKey(method);
    this.mocks.delete(key);
  }

  /**
   * Get call history
   */
  getCallHistory(): ServiceCall[] {
    return [...this.callHistory];
  }

  /**
   * Get calls for a specific method
   */
  getCallsForMethod(method: string): ServiceCall[] {
    return this.callHistory.filter((call) => call.method === method);
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  /**
   * Verify a method was called
   */
  verifyCalled(method: string, times?: number): boolean {
    const calls = this.getCallsForMethod(method);
    if (times === undefined) {
      return calls.length > 0;
    }
    return calls.length === times;
  }

  /**
   * Verify a method was called with specific params
   */
  verifyCalledWith(method: string, params: unknown[]): boolean {
    const calls = this.getCallsForMethod(method);
    return calls.some((call) => {
      return JSON.stringify(call.params) === JSON.stringify(params);
    });
  }

  /**
   * Get mock keys
   */
  getMockKeys(): string[] {
    return Array.from(this.mocks.keys());
  }
}

export { ServiceMockConfig };
