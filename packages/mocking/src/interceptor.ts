/**
 * Request/response interception
 */

import type { InterceptorConfig, InterceptedRequest, InterceptedResponse } from './types.js';
import { InterceptorConfigSchema, InterceptedRequestSchema, InterceptedResponseSchema } from './types.js';

export class Interceptor {
  private config: InterceptorConfig;
  private requests: Map<string, InterceptedRequest> = new Map();
  private responses: Map<string, InterceptedResponse> = new Map();
  private requestCounter = 0;

  constructor(config: Partial<InterceptorConfig> = {}) {
    this.config = InterceptorConfigSchema.parse(config);
  }

  /**
   * Intercept a request
   */
  interceptRequest(
    method: string,
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: unknown;
    }
  ): InterceptedRequest {
    if (!this.config.interceptRequests) {
      throw new Error('Request interception is disabled');
    }

    const id = this.generateId();
    const request: InterceptedRequest = {
      id,
      method,
      url,
      headers: options?.headers || {},
      body: options?.body,
      timestamp: Date.now(),
    };

    this.requests.set(id, InterceptedRequestSchema.parse(request));

    if (this.config.enableLogging) {
      console.log(`[Interceptor] Request: ${method} ${url}`);
    }

    return request;
  }

  /**
   * Intercept a response
   */
  interceptResponse(
    requestId: string,
    status: number,
    options?: {
      headers?: Record<string, string>;
      body?: unknown;
    }
  ): InterceptedResponse {
    if (!this.config.interceptResponses) {
      throw new Error('Response interception is disabled');
    }

    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    const response: InterceptedResponse = {
      requestId,
      status,
      headers: options?.headers || {},
      body: options?.body,
      timestamp: Date.now(),
      duration: Date.now() - request.timestamp,
    };

    this.responses.set(requestId, InterceptedResponseSchema.parse(response));

    if (this.config.enableLogging) {
      console.log(`[Interceptor] Response: ${status} (${response.duration}ms)`);
    }

    return response;
  }

  /**
   * Get request by ID
   */
  getRequest(id: string): InterceptedRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * Get response by ID
   */
  getResponse(id: string): InterceptedResponse | undefined {
    return this.responses.get(id);
  }

  /**
   * Get all requests
   */
  getAllRequests(): InterceptedRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * Get all responses
   */
  getAllResponses(): InterceptedResponse[] {
    return Array.from(this.responses.values());
  }

  /**
   * Get requests by method
   */
  getRequestsByMethod(method: string): InterceptedRequest[] {
    return this.getAllRequests().filter((req) => req.method === method);
  }

  /**
   * Get requests by URL pattern
   */
  getRequestsByUrl(pattern: string | RegExp): InterceptedRequest[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.getAllRequests().filter((req) => regex.test(req.url));
  }

  /**
   * Get failed responses
   */
  getFailedResponses(): InterceptedResponse[] {
    return this.getAllResponses().filter((res) => res.status >= 400);
  }

  /**
   * Get slow responses (above threshold in ms)
   */
  getSlowResponses(threshold: number): InterceptedResponse[] {
    return this.getAllResponses().filter((res) => res.duration > threshold);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `req_${++this.requestCounter}`;
  }

  /**
   * Clear all intercepted data
   */
  clear(): void {
    this.requests.clear();
    this.responses.clear();
    this.requestCounter = 0;
  }

  /**
   * Clear requests older than specified time
   */
  clearOldRequests(maxAge: number): void {
    const now = Date.now();
    for (const [id, request] of this.requests.entries()) {
      if (now - request.timestamp > maxAge) {
        this.requests.delete(id);
        this.responses.delete(id);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRequests: number;
    totalResponses: number;
    failedRequests: number;
    averageDuration: number;
    slowRequests: number;
  } {
    const requests = this.getAllRequests();
    const responses = this.getAllResponses();
    const failed = this.getFailedResponses().length;
    const durations = responses.map((r) => r.duration);
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
    const slow = this.getSlowResponses(1000).length;

    return {
      totalRequests: requests.length,
      totalResponses: responses.length,
      failedRequests: failed,
      averageDuration,
      slowRequests: slow,
    };
  }
}

export { InterceptorConfig, InterceptedRequest };
