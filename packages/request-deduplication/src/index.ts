/**
 * @aether/request-deduplication - Request Deduplication Middleware
 * 
 * Provides request deduplication middleware to prevent duplicate requests.
 * Uses in-memory store to track recent requests.
 */

export interface DeduplicationConfig {
  windowMs?: number;        // Time window in milliseconds
  maxRequests?: number;     // Max requests per window
  skipSuccessful?: boolean;  // Skip successful requests
  keyGenerator?: (req: any) => string;
}

export function requestDeduplication(config: DeduplicationConfig = {}) {
  const {
    windowMs = 60000,  // 1 minute
    maxRequests = 10,
    skipSuccessful = false,
    keyGenerator = (req: any) => `${req.method}:${req.path}:${JSON.stringify(req.body)}`
  } = config;

  const requestStore = new Map<string, { count: number; lastSeen: number }>();

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestStore.entries()) {
      if (now - data.lastSeen > windowMs) {
        requestStore.delete(key);
      }
    }
  }, 60000);

  return function (req: any, res: any, next: any) {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let entry = requestStore.get(key);
    
    if (!entry || now - entry.lastSeen > windowMs) {
      entry = { count: 0, lastSeen: now };
      requestStore.set(key, entry);
    }
    
    entry.count++;
    entry.lastSeen = now;
    
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many duplicate requests',
        message: 'Request deduplicated',
        retryAfter: Math.ceil((windowMs - (now - entry.lastSeen)) / 1000)
      });
    }

    if (skipSuccessful) {
      const originalSend = res.send;
      res.send = function(data: any) {
        if (res.statusCode < 400) {
          entry.count--;
        }
        originalSend.call(this, data);
      };
    }

    next();
  };
}

// Pre-configured deduplication
export const standardDeduplication = requestDeduplication({
  windowMs: 60000,
  maxRequests: 10
});

export const strictDeduplication = requestDeduplication({
  windowMs: 30000,
  maxRequests: 5
});

export const looseDeduplication = requestDeduplication({
  windowMs: 120000,
  maxRequests: 20
});