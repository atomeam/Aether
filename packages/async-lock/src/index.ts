/**
 * @aether/async-lock - Async Lock
 */

export class AsyncLock {
  private locks: Map<string, Promise<any>> = new Map();
  
  async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.locks.get(key);
    if (existing) {
      await existing;
    }
    
    const promise = fn().finally(() => {
      this.locks.delete(key);
    });
    
    this.locks.set(key, promise);
    return promise;
  }
}

export const asyncLock = new AsyncLock();