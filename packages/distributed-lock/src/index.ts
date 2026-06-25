/**
 * @aether/distributed-lock - Distributed Lock
 */

export class DistributedLock {
  private locks: Map<string, string> = new Map();
  
  acquire(key: string, owner: string): boolean {
    if (!this.locks.has(key)) {
      this.locks.set(key, owner);
      return true;
    }
    return false;
  }
  
  release(key: string, owner: string): boolean {
    if (this.locks.get(key) === owner) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }
}

export const distributedLock = new DistributedLock();