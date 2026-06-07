// Caching System for Aether Backend
// Implements response caching with configurable TTL for different cache types

import NodeCache from 'node-cache';

// Cache TTL Configuration (in seconds)
export const CACHE_TTL = {
  // Backend response caching - short TTL for dynamic data
  BACKEND_RESPONSE: 60, // 1 minute
  BACKEND_RESPONSE_LONG: 300, // 5 minutes
  
  // External API caching - medium TTL to respect rate limits
  BINANCE_API: 30, // 30 seconds (crypto prices change frequently)
  USGS_API: 300, // 5 minutes (earthquake data)
  NOAA_API: 300, // 5 minutes (solar/weather data)
  SLACK_API: 60, // 1 minute (Slack messages)
  
  // UAP detection correlation - longer TTL for expensive computations
  UAP_CORRELATION: 600, // 10 minutes
  UAP_ANOMALY: 300, // 5 minutes
  
  // Static data - very long TTL
  STATIC_DATA: 3600, // 1 hour
} as const;

// Cache instances for different types
class CacheManager {
  private caches: Map<string, NodeCache> = new Map();

  constructor() {
    // Initialize cache instances with different TTLs
    this.createCache('backend', CACHE_TTL.BACKEND_RESPONSE);
    this.createCache('backend-long', CACHE_TTL.BACKEND_RESPONSE_LONG);
    this.createCache('binance', CACHE_TTL.BINANCE_API);
    this.createCache('usgs', CACHE_TTL.USGS_API);
    this.createCache('noaa', CACHE_TTL.NOAA_API);
    this.createCache('slack', CACHE_TTL.SLACK_API);
    this.createCache('uap-correlation', CACHE_TTL.UAP_CORRELATION);
    this.createCache('uap-anomaly', CACHE_TTL.UAP_ANOMALY);
    this.createCache('static', CACHE_TTL.STATIC_DATA);
  }

  private createCache(name: string, ttl: number): void {
    const cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: ttl * 0.2, // Check for expired items every 20% of TTL
      useClones: false, // Performance optimization
    });
    this.caches.set(name, cache);
    
    // Log cache creation
    console.log(`[CACHE] Initialized '${name}' cache with ${ttl}s TTL`);
  }

  get(cacheName: string, key: string): any {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`[CACHE] Cache '${cacheName}' not found`);
      return null;
    }
    return cache.get(key);
  }

  set(cacheName: string, key: string, value: any, ttl?: number): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`[CACHE] Cache '${cacheName}' not found`);
      return false;
    }
    return cache.set(key, value, ttl);
  }

  del(cacheName: string, key: string): number {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`[CACHE] Cache '${cacheName}' not found`);
      return 0;
    }
    return cache.del(key);
  }

  flushAll(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`[CACHE] Cache '${cacheName}' not found`);
      return;
    }
    cache.flushAll();
    console.log(`[CACHE] Flushed '${cacheName}' cache`);
  }

  getStats(cacheName: string): any {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`[CACHE] Cache '${cacheName}' not found`);
      return null;
    }
    return cache.getStats();
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

export function generateRequestCacheKey(req: any): string {
  const url = req.url || req.path;
  const method = req.method || 'GET';
  const query = req.query ? JSON.stringify(req.query) : '';
  return `${method}:${url}:${query}`;
}

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

export function cacheMiddleware(cacheName: string, keyGenerator?: (req: any) => string) {
  return (req: any, res: any, next: any) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator ? keyGenerator(req) : generateRequestCacheKey(req);
    const cachedResponse = cacheManager.get(cacheName, cacheKey);

    if (cachedResponse) {
      console.log(`[CACHE] HIT for ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    console.log(`[CACHE] MISS for ${cacheKey}`);
    res.setHeader('X-Cache', 'MISS');

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data: any) {
      cacheManager.set(cacheName, cacheKey, data);
      return originalJson(data);
    };

    next();
  };
}

// ============================================================================
// API RESPONSE CACHING HELPERS
// ============================================================================

export async function cachedFetch(
  cacheName: string,
  cacheKey: string,
  fetcher: () => Promise<any>,
  ttl?: number
): Promise<any> {
  // Check cache first
  const cached = cacheManager.get(cacheName, cacheKey);
  if (cached !== undefined) {
    console.log(`[CACHE] API HIT for ${cacheKey}`);
    return cached;
  }

  console.log(`[CACHE] API MISS for ${cacheKey}`);
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cacheManager.set(cacheName, cacheKey, data, ttl);
  
  return data;
}

// ============================================================================
// UAP DETECTION CORRELATION CACHING
// ============================================================================

interface UAPCorrelationCacheEntry {
  timestamp: number;
  sensorData: number[];
  externalData: {
    earthquakes: number;
    solarActivity: number;
    weather: number;
  };
  correlationScore: number;
}

export function generateUAPCorrelationKey(sensorData: number[]): string {
  // Create a hash of sensor data for correlation cache key
  const hash = sensorData.reduce((acc, val, idx) => acc + val * Math.pow(2, idx % 32), 0);
  return `uap-correlation:${hash}`;
}

export function getCachedUAPCorrelation(sensorData: number[]): UAPCorrelationCacheEntry | null {
  const key = generateUAPCorrelationKey(sensorData);
  const cached = cacheManager.get('uap-correlation', key);
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL.UAP_CORRELATION * 1000) {
      console.log(`[CACHE] UAP correlation HIT for key ${key}`);
      return cached;
    }
    // Expired, delete it
    cacheManager.del('uap-correlation', key);
  }
  
  return null;
}

export function setCachedUAPCorrelation(
  sensorData: number[],
  externalData: { earthquakes: number; solarActivity: number; weather: number },
  correlationScore: number
): void {
  const key = generateUAPCorrelationKey(sensorData);
  const entry: UAPCorrelationCacheEntry = {
    timestamp: Date.now(),
    sensorData,
    externalData,
    correlationScore
  };
  cacheManager.set('uap-correlation', key, entry);
  console.log(`[CACHE] UAP correlation SET for key ${key}`);
}

// ============================================================================
// EXTERNAL API CACHING WRAPPERS
// ============================================================================

// Binance API caching
export async function cachedBinanceFetch(symbol: string = 'BTCUSDT'): Promise<any> {
  const cacheKey = `ticker:${symbol}`;
  return cachedFetch(
    'binance',
    cacheKey,
    async () => {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      return response.json();
    },
    CACHE_TTL.BINANCE_API
  );
}

// USGS API caching
export async function cachedUSGSFetch(): Promise<number> {
  const cacheKey = 'earthquakes:2.5_day';
  const result = await cachedFetch(
    'usgs',
    cacheKey,
    async () => {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      const data = await response.json();
      return data.features?.length || 0;
    },
    CACHE_TTL.USGS_API
  );
  return result as number;
}

// NOAA API caching
export async function cachedNOAAFetch(endpoint: string): Promise<any> {
  const cacheKey = `noaa:${endpoint}`;
  return cachedFetch(
    'noaa',
    cacheKey,
    async () => {
      const response = await fetch(endpoint);
      return response.json();
    },
    CACHE_TTL.NOAA_API
  );
}

// Slack API caching
export async function cachedSlackFetch(channel: string, message: string, token?: string): Promise<any> {
  const cacheKey = `slack:${channel}:${message.substring(0, 50)}`;
  return cachedFetch(
    'slack',
    cacheKey,
    async () => {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || process.env.SLACK_TOKEN || process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          text: message,
          username: 'Aether System',
          icon_emoji: '🤖'
        })
      });
      return response.json();
    },
    CACHE_TTL.SLACK_API
  );
}

// ============================================================================
// CACHE STATS ENDPOINT
// ============================================================================

export function getCacheStatsEndpoint() {
  return {
    stats: cacheManager.getAllStats(),
    ttl: CACHE_TTL,
    timestamp: new Date().toISOString()
  };
}
