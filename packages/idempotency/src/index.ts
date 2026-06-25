/**
 * @aether/idempotency - Idempotency Key Middleware
 * 
 * Provides idempotency key middleware for safe retry of requests.
 * Prevents duplicate processing of identical requests.
 */

export interface IdempotencyConfig {
  headerName?: string;
  ttl?: number;  // Time to live for idempotency keys in seconds
  store?: Map<string, any>;  // In-memory store (use Redis in production)
}

export interface IdempotencyRecord {
  key: string;
  response: any;
  status: number;
  timestamp: number;
}

export function idempotency(config: IdempotencyConfig = {}) {
  const {
    headerName = 'Idempotency-Key',
    ttl = 86400,  // 24 hours
    store = new Map<string, IdempotencyRecord>()
  } = config;

  // Clean up expired records
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.timestamp > ttl * 1000) {
        store.delete(key);
      }
    }
  }, 3600000);  // Clean up every hour

  return function (req: any, res: any, next: any) {
    const idempotencyKey = req.headers[headerName.toLowerCase()];

    if (!idempotencyKey) {
      // No idempotency key, proceed normally
      return next();
    }

    // Check if we have a cached response
    const cached = store.get(idempotencyKey);
    if (cached) {
      res.setHeader('Idempotency-Replayed', 'true');
      return res.status(cached.status).json(cached.response);
    }

    // Store the original send function
    const originalSend = res.send;

    // Override send to cache successful responses
    res.send = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(idempotencyKey, {
          key: idempotencyKey,
          response: data,
          status: res.statusCode,
          timestamp: Date.now()
        });
        res.setHeader('Idempotency-Key', idempotencyKey);
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

// Helper functions
export function generateIdempotencyKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

export function clearIdempotencyStore(store: Map<string, any>): void {
  store.clear();
}

export function getIdempotencyStats(store: Map<string, any>): { total: number; keys: string[] } {
  return {
    total: store.size,
    keys: Array.from(store.keys())
  };
}