/**
 * @aether/cors - CORS Middleware
 * 
 * Provides CORS (Cross-Origin Resource Sharing) middleware for Express applications.
 * Configurable origin, methods, headers, and credentials.
 */

export interface CORSConfig {
  origin?: string | string[] | RegExp | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

export function cors(config: CORSConfig = {}) {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,  // 24 hours
    optionsSuccessStatus = 204
  } = config;

  return function (req: any, res: any, next: any) {
    const requestOrigin = req.headers.origin;
    
    // Check origin
    const isAllowed = checkOrigin(requestOrigin, origin);
    if (!isAllowed) {
      return res.status(403).json({
        error: 'Origin not allowed',
        origin: requestOrigin
      });
    }

    // Set CORS headers
    if (typeof origin === 'string' && origin !== '*') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin) && origin.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    
    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Max-Age', maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(optionsSuccessStatus).end();
      return;
    }

    next();
  };
}

function checkOrigin(requestOrigin: string | undefined, origin: CORSConfig['origin']): boolean {
  if (!requestOrigin) return true;
  
  if (origin === '*') return true;
  
  if (typeof origin === 'string') {
    return origin === requestOrigin;
  }
  
  if (Array.isArray(origin)) {
    return origin.includes(requestOrigin);
  }
  
  if (origin instanceof RegExp) {
    return origin.test(requestOrigin);
  }
  
  if (typeof origin === 'function') {
    return origin(requestOrigin);
  }
  
  return false;
}

// Pre-configured CORS policies
export const permissiveCORS = cors({
  origin: '*',
  credentials: false
});

export const strictCORS = cors({
  origin: ['https://example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export const developmentCORS = cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*']
});