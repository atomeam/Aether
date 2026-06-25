/**
 * @aether/advanced-cache - Advanced Caching Patterns
 */

export class AdvancedCache {
  private caches: Map<string, any> = new Map();
  
  async get<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
    const cached = this.caches.get(key);
    if (cached && (!options?.ttl || Date.now() - cached.timestamp < options.ttl)) {
      return cached.value;
    }
    
    const value = await fetcher();
    this.caches.set(key, { value, timestamp: Date.now() });
    return value;
  }
  
  set<T>(key: string, value: T, options?: { ttl?: number }): void {
    this.caches.set(key, { value, timestamp: Date.now(), ttl: options?.ttl });
  }
  
  async multiLevel<T>(
    key: string,
    levels: Array<() => Promise<T>>,
    options?: { ttl?: number }
  ): Promise<T> {
    for (const level of levels) {
      try {
        const value = await level();
        this.set(key, value, options);
        return value;
      } catch {
        continue;
      }
    }
    throw new Error('All cache levels failed');
  }
  
  async refreshAhead<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; refreshBefore?: number }
  ): Promise<T> {
    const cached = this.caches.get(key);
    if (cached && options?.refreshBefore && Date.now() - cached.timestamp > options.refreshBefore) {
      // Refresh in background
      fetcher().then(value => this.set(key, value, options));
    }
    
    return this.get(key, fetcher, options);
  }
  
  invalidate(key: string): void {
    this.caches.delete(key);
  }
  
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.caches.keys()) {
      if (pattern.test(key)) {
        this.caches.delete(key);
      }
    }
  }
  
  clear(): void {
    this.caches.clear();
  }
  
  size(): number {
    return this.caches.size;
  }
  
  keys(): string[] {
    return Array.from(this.caches.keys());
  }
}

export function createAdvancedCache(): AdvancedCache {
  return new AdvancedCache();
}