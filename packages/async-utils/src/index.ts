/**
 * @aether/async-utils - Async Utilities
 */

export class AsyncUtils {
  async map<T, U>(items: T[], fn: (item: T, index: number) => Promise<U>): Promise<U[]> {
    return Promise.all(items.map((item, index) => fn(item, index)));
  }
  
  async filter<T>(items: T[], fn: (item: T, index: number) => Promise<boolean>): Promise<T[]> {
    const results = await Promise.all(items.map((item, index) => fn(item, index)));
    return items.filter((_, index) => results[index]);
  }
  
  async reduce<T, U>(items: T[], fn: (acc: U, item: T, index: number) => Promise<U>, initial: U): Promise<U> {
    let acc = initial;
    for (let i = 0; i < items.length; i++) {
      acc = await fn(acc, items[i], i);
    }
    return acc;
  }
  
  async each<T>(items: T[], fn: (item: T, index: number) => Promise<void>): Promise<void> {
    await Promise.all(items.map((item, index) => fn(item, index)));
  }
  
  async eachSeries<T>(items: T[], fn: (item: T, index: number) => Promise<void>): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      await fn(items[i], i);
    }
  }
  
  async parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map(task => task()));
  }
  
  async series<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    for (const task of tasks) {
      results.push(await task());
    }
    return results;
  }
  
  async waterfall<T>(tasks: Array<(acc: any) => Promise<any>>): Promise<any> {
    let result: any = {};
    for (const task of tasks) {
      result = await task(result);
    }
    return result;
  }
  
  async whilst(test: () => boolean, fn: () => Promise<void>): Promise<void> {
    while (test()) {
      await fn();
    }
  }
  
  async doWhilst(fn: () => Promise<void>, test: () => boolean): Promise<void> {
    do {
      await fn();
    } while (test());
  }
  
  async until(test: () => boolean, fn: () => Promise<void>): Promise<void> {
    while (!test()) {
      await fn();
    }
  }
  
  async doUntil(fn: () => Promise<void>, test: () => boolean): Promise<void> {
    do {
      await fn();
    } while (!test());
  }
  
  async retry<T>(
    fn: () => Promise<T>,
    options: { maxAttempts?: number; delay?: number; backoff?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await this.delay(delay * Math.pow(backoff, attempt - 1));
        }
      }
    }
    
    throw lastError;
  }
  
  async timeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
  }
  
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async sleep(ms: number): Promise<void> {
    return this.delay(ms);
  }
}

export const asyncUtils = new AsyncUtils();