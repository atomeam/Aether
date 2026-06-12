/**
 * @aether/xss-protection - XSS Protection Middleware
 * 
 * Provides XSS protection middleware for Express applications.
 * Sanitizes request body, query, and params to prevent XSS attacks.
 */

export interface XSSProtectionConfig {
  sanitizeBody?: boolean;
  sanitizeQuery?: boolean;
  sanitizeParams?: boolean;
  sanitizeHeaders?: boolean;
}

export function xssProtection(config: XSSProtectionConfig = {}) {
  const {
    sanitizeBody = true,
    sanitizeQuery = true,
    sanitizeParams = true,
    sanitizeHeaders = false
  } = config;

  return function (req: any, res: any, next: any) {
    if (sanitizeBody && req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (sanitizeQuery && req.query) {
      req.query = sanitizeObject(req.query);
    }

    if (sanitizeParams && req.params) {
      req.params = sanitizeObject(req.params);
    }

    if (sanitizeHeaders && req.headers) {
      req.headers = sanitizeObject(req.headers);
    }

    next();
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeString(str: string): string {
  // Remove common XSS patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|button|link|meta|style)[^>]*>/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '');
}

// Pre-configured XSS protection
export const standardXSSProtection = xssProtection();
export const strictXSSProtection = xssProtection({
  sanitizeBody: true,
  sanitizeQuery: true,
  sanitizeParams: true,
  sanitizeHeaders: true
});