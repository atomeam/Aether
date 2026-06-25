/**
 * @aether/memoizer - Memoizer
 */

export class Memoizer {
  private cache: Map<string, any> = new Map();
  
  memoize<T extends (...args: any[]) => any>(fn: T, keyGenerator?: (...args: Parameters<T>) => string): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      const result = fn(...args);
      this.cache.set(key, result);
      return result;
    }) as T;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const memoizer = new Memoizer();