/**
 * @aether/request-transformation - Request/Response Transformation Middleware
 * 
 * Provides request and response transformation middleware.
 * Transforms request body, query, params, and response data.
 */

export interface TransformationConfig {
  transformRequest?: (req: any) => any;
  transformResponse?: (data: any, req: any, res: any) => any;
  transformError?: (error: any, req: any, res: any) => any;
}

export function requestTransformation(config: TransformationConfig = {}) {
  const {
    transformRequest,
    transformResponse,
    transformError
  } = config;

  return function (req: any, res: any, next: any) {
    // Transform request
    if (transformRequest) {
      try {
        const transformed = transformRequest(req);
        Object.assign(req, transformed);
      } catch (error) {
        if (transformError) {
          return transformError(error, req, res);
        }
        return res.status(400).json({
          error: 'Request transformation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Transform response
    if (transformResponse) {
      const originalSend = res.send;
      res.send = function (data: any) {
        try {
          const transformed = transformResponse(data, req, res);
          return originalSend.call(this, transformed);
        } catch (error) {
          if (transformError) {
            return transformError(error, req, res);
          }
          return res.status(500).json({
            error: 'Response transformation failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      };
    }

    // Transform error
    if (transformError) {
      const originalJson = res.json;
      res.json = function (data: any) {
        if (res.statusCode >= 400) {
          try {
            const transformed = transformError(data, req, res);
            return originalJson.call(this, transformed);
          } catch (error) {
            return originalJson.call(this, {
              error: 'Error transformation failed',
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        return originalJson.call(this, data);
      };
    }

    next();
  };
}

// Common transformations
export const camelCaseTransformation = requestTransformation({
  transformRequest: (req) => {
    const transform = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(transform);
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = transform(value);
      }
      return result;
    };

    if (req.body) req.body = transform(req.body);
    if (req.query) req.query = transform(req.query);
    if (req.params) req.params = transform(req.params);
    return req;
  }
});

export const snakeCaseTransformation = requestTransformation({
  transformRequest: (req) => {
    const transform = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(transform);
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = transform(value);
      }
      return result;
    };

    if (req.body) req.body = transform(req.body);
    if (req.query) req.query = transform(req.query);
    if (req.params) req.params = transform(req.params);
    return req;
  }
});

export const trimStringsTransformation = requestTransformation({
  transformRequest: (req) => {
    const transform = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(transform);
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = typeof value === 'string' ? value.trim() : transform(value);
      }
      return result;
    };

    if (req.body) req.body = transform(req.body);
    if (req.query) req.query = transform(req.query);
    if (req.params) req.params = transform(req.params);
    return req;
  }
});