/**
 * @aether/ttl-cache - TTL Cache
 */

export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expires: number }> = new Map();
  private defaultTTL: number;
  
  constructor(defaultTTL: number = 60000) {
    this.defaultTTL = defaultTTL;
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  set(key: K, value: V, ttl?: number): void {
    const expires = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expires });
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
  
  get size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

export function createTTLCache<K, V>(defaultTTL: number = 60000): TTLCache<K, V> {
  return new TTLCache<K, V>(defaultTTL);
}