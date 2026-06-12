/**
 * @aether/cache - Caching Layer
 */

export class Cache {
  private store: Map<string, { value: any; expiry: number }> = new Map();
  
  set(key: string, value: any, ttl: number = 60000): void {
    this.store.set(key, { value, expiry: Date.now() + ttl });
  }
  
  get(key: string): any {
    const item = this.store.get(key);
    if (!item || item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  
  delete(key: string): void {
    this.store.delete(key);
  }
}

export const cache = new Cache();