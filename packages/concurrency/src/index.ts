/**
 * @aether/concurrency - Concurrency Utilities
 */

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number,
    private refillInterval: number = 1000
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  async consume(tokens: number = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      await new Promise(resolve => setTimeout(resolve, this.refillInterval));
    }
  }
  
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    if (elapsed >= this.refillInterval) {
      const intervals = Math.floor(elapsed / this.refillInterval);
      this.tokens = Math.min(this.capacity, this.tokens + intervals * this.refillRate);
      this.lastRefill = now;
    }
  }
  
  availableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

export class LeakyBucket {
  private queue: Array<() => void> = [];
  private processing = false;
  
  constructor(
    private capacity: number,
    private rate: number,
    private interval: number = 1000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }
  
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, Math.min(this.rate, this.queue.length));
      await Promise.all(batch.map(fn => fn()));
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
    
    this.processing = false;
  }
  
  queueSize(): number {
    return this.queue.length;
  }
}

export class Semaphore {
  private queue: Array<() => void> = [];
  
  constructor(private permits: number) {}
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.queue.push(() => {
        this.permits--;
        resolve();
      });
    });
  }
  
  async acquireWithTimeout(timeout: number): Promise<boolean> {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    
    let resolved = false;
    
    return Promise.race([
      new Promise<boolean>(resolve => {
        this.queue.push(() => {
          if (!resolved) {
            this.permits--;
            resolve(true);
          }
        });
      }),
      new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolved = true;
          const idx = this.queue.findIndex(fn => fn.toString().includes('resolve'));
          if (idx !== -1) this.queue.splice(idx, 1);
          resolve(false);
        }, timeout);
      })
    ]);
  }
  
  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.permits++;
    }
  }
  
  availablePermits(): number {
    return this.permits;
  }
  
  queueLength(): number {
    return this.queue.length;
  }
}

export class Barrier {
  private waiting: Array<() => void> = [];
  
  constructor(private parties: number) {}
  
  async await(): Promise<void> {
    if (this.parties <= 0) return;
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
      
      if (this.waiting.length >= this.parties) {
        this.release();
      }
    });
  }
  
  async awaitWithTimeout(timeout: number): Promise<boolean> {
    if (this.parties <= 0) return true;
    
    let resolved = false;
    
    return Promise.race([
      new Promise<boolean>(resolve => {
        this.waiting.push(() => {
          if (!resolved) resolve(true);
        });
        
        if (this.waiting.length >= this.parties) {
          this.release();
        }
      }),
      new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolved = true;
          const idx = this.waiting.findIndex(fn => fn.toString().includes('resolve'));
          if (idx !== -1) this.waiting.splice(idx, 1);
          resolve(false);
        }, timeout);
      })
    ]);
  }
  
  private release(): void {
    const waiting = this.waiting;
    this.waiting = [];
    waiting.forEach(fn => fn());
  }
  
  waitingCount(): number {
    return this.waiting.length;
  }
}

export class Countdown {
  private waiting: Array<() => void> = [];
  
  constructor(private count: number) {}
  
  async await(): Promise<void> {
    if (this.count <= 0) return;
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
      
      if (this.count <= 0) {
        this.release();
      }
    });
  }
  
  decrement(): void {
    this.count--;
    if (this.count <= 0) {
      this.release();
    }
  }
  
  getCount(): number {
    return this.count;
  }
  
  private release(): void {
    const waiting = this.waiting;
    this.waiting = [];
    waiting.forEach(fn => fn());
  }
}

export function createTokenBucket(capacity: number, refillRate: number): TokenBucket {
  return new TokenBucket(capacity, refillRate);
}

export function createLeakyBucket(capacity: number, rate: number): LeakyBucket {
  return new LeakyBucket(capacity, rate);
}

export function createSemaphore(permits: number): Semaphore {
  return new Semaphore(permits);
}

export function createBarrier(parties: number): Barrier {
  return new Barrier(parties);
}

export function createCountdown(count: number): Countdown {
  return new Countdown(count);
}