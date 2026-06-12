/**
 * @aether/retry - Retry Patterns
 */

export class Retry {
  async exponential<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; baseDelay?: number; maxDelay?: number; backoff?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 5, baseDelay = 100, maxDelay = 30000, backoff = 2 } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(backoff, attempt - 1), maxDelay);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  async linear<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; delay?: number; increment?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 5, delay = 1000, increment = 500 } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await this.delay(delay + increment * (attempt - 1));
        }
      }
    }
    
    throw lastError;
  }
  
  async withJitter<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; baseDelay?: number; jitter?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 5, baseDelay = 1000, jitter = 0.5 } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const jitteredDelay = baseDelay * (1 + jitter * (Math.random() * 2 - 1));
          await this.delay(jitteredDelay);
        }
      }
    }
    
    throw lastError;
  }
  
  async withPredicate<T>(
    fn: () => Promise<T>,
    predicate: (error: any) => boolean,
    options: { maxAttempts?: number; delay?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 5, delay = 1000 } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!predicate(error) || attempt >= maxAttempts) {
          throw error;
        }
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }
  
  async withBackoff<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; initialDelay?: number; maxDelay?: number; multiplier?: number } = {}
  ): Promise<T> {
    return this.exponential(fn, options);
  }
  
  async untilSuccess<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; delay?: number } = {}
  ): Promise<T> {
    return this.exponential(fn, options);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retry = new Retry();