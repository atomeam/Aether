/**
 * API Gateway Transformer
 * 
 * Handles request and response transformation.
 */

import type {
  RequestContext,
  ResponseContext,
  TransformConfig,
  RequestTransform,
  ResponseTransform,
} from './types.js';

export class Transformer {
  private config: TransformConfig;

  constructor(config: TransformConfig = {}) {
    this.config = config;
  }

  /**
   * Transform request context
   */
  transformRequest(ctx: RequestContext): RequestContext {
    if (!this.config.request) return ctx;

    const { request } = this.config;
    const transformed = { ...ctx };

    if (request.body && ctx.body !== undefined) {
      transformed.body = request.body(ctx.body);
    }

    if (request.headers) {
      transformed.headers = request.headers(ctx.headers);
    }

    if (request.query) {
      transformed.query = request.query(ctx.query);
    }

    return transformed;
  }

  /**
   * Transform response context
   */
  transformResponse(response: ResponseContext): ResponseContext {
    if (!this.config.response) return response;

    const responseTransform = this.config.response;
    const transformed = { ...response };

    if (responseTransform.body && response.body !== undefined) {
      transformed.body = responseTransform.body(response.body);
    }

    if (responseTransform.headers) {
      transformed.headers = responseTransform.headers(response.headers);
    }

    if (responseTransform.status) {
      transformed.status = responseTransform.status(response.status);
    }

    return transformed;
  }

  /**
   * Update transform config
   */
  updateConfig(config: TransformConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all transforms
   */
  clear(): void {
    this.config = {};
  }
}

/**
 * Common request transformers
 */
export const RequestTransformers = {
  /**
   * Add default headers
   */
  addDefaultHeaders(defaultHeaders: Record<string, string>): RequestTransform['headers'] {
    return (headers) => ({ ...defaultHeaders, ...headers });
  },

  /**
   * Remove specific headers
   */
  removeHeaders(headersToRemove: string[]): RequestTransform['headers'] {
    return (headers) => {
      const result = { ...headers };
      headersToRemove.forEach(key => delete result[key]);
      return result;
    };
  },

  /**
   * Normalize header names to lowercase
   */
  normalizeHeaders(): RequestTransform['headers'] {
    return (headers) => {
      const normalized: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        normalized[key.toLowerCase()] = value;
      });
      return normalized;
    };
  },

  /**
   * Parse JSON body
   */
  parseJsonBody(): RequestTransform['body'] {
    return (body) => {
      if (typeof body === 'string') {
        try {
          return JSON.parse(body);
        } catch {
          return body;
        }
      }
      return body;
    };
  },

  /**
   * Stringify body to JSON
   */
  stringifyJsonBody(): RequestTransform['body'] {
    return (body) => {
      if (typeof body === 'object' && body !== null) {
        return JSON.stringify(body);
      }
      return body;
    };
  },
};

/**
 * Common response transformers
 */
export const ResponseTransformers = {
  /**
   * Add CORS headers
   */
  addCorsHeaders(origin: string = '*'): ResponseTransform['headers'] {
    return (headers) => ({
      ...headers,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
  },

  /**
   * Add security headers
   */
  addSecurityHeaders(): ResponseTransform['headers'] {
    return (headers) => ({
      ...headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });
  },

  /**
   * Remove sensitive headers
   */
  removeSensitiveHeaders(): ResponseTransform['headers'] {
    return (headers) => {
      const result = { ...headers };
      delete result['authorization'];
      delete result['cookie'];
      delete result['set-cookie'];
      return result;
    };
  },

  /**
   * Wrap response in envelope
   */
  wrapEnvelope(): ResponseTransform['body'] {
    return (body) => ({
      success: true,
      data: body,
      timestamp: Date.now(),
    });
  },

  /**
   * Handle error responses
   */
  handleError(): ResponseTransform['body'] {
    return (body) => {
      if (typeof body === 'object' && body !== null) {
        return body;
      }
      return {
        success: false,
        error: String(body),
        timestamp: Date.now(),
      };
    };
  },
};
