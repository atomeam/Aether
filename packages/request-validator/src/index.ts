/**
 * @aether/request-validator - Request Validation Middleware
 * 
 * Provides request validation middleware using Zod schemas.
 * Validates request bodies, query parameters, and headers.
 */

import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
  data?: any;
}

export function validateRequest(config: ValidationConfig) {
  return function (req: any, res: any, next: any) {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    // Validate body
    if (config.body) {
      try {
        validatedData.body = config.body.parse(req.body);
        req.body = validatedData.body;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...formatZodError(error, 'body'));
        }
      }
    }

    // Validate query
    if (config.query) {
      try {
        validatedData.query = config.query.parse(req.query);
        req.query = validatedData.query;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...formatZodError(error, 'query'));
        }
      }
    }

    // Validate params
    if (config.params) {
      try {
        validatedData.params = config.params.parse(req.params);
        req.params = validatedData.params;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...formatZodError(error, 'params'));
        }
      }
    }

    // Validate headers
    if (config.headers) {
      try {
        validatedData.headers = config.headers.parse(req.headers);
        req.headers = validatedData.headers;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...formatZodError(error, 'headers'));
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
        message: 'Request validation failed'
      });
    }

    next();
  };
}

function formatZodError(error: ZodError, location: string): ValidationError[] {
  return error.errors.map(err => ({
    field: `${location}.${err.path.join('.')}`,
    message: err.message,
    code: err.code
  }));
}

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  url: z.string().url(),
  timestamp: z.string().datetime(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  boolean: z.coerce.boolean(),
  number: z.coerce.number(),
  date: z.coerce.date(),
  json: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON string'
      });
      return z.NEVER;
    }
  })
};

// Request validation result helper
export function validateData(schema: ZodSchema, data: any): ValidationResult {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: formatZodError(error, 'data')
      };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Unknown validation error',
        code: 'unknown'
      }]
    };
  }
}