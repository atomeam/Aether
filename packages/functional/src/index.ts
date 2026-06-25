/**
 * @aether/functional - Functional Programming Utilities
 */

export class Functional {
  pipe<T>(...fns: Array<(arg: any) => any>): (arg: T) => any {
    return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
  }
  
  compose<T>(...fns: Array<(arg: any) => any>): (arg: T) => any {
    return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
  }
  
  curry<T extends (...args: any[]) => any>(fn: T): T {
    return function curried(...args: any[]): any {
      if (args.length >= fn.length) {
        return fn(...args);
      }
      return (...more: any[]) => curried(...args, ...more);
    } as T;
  }
  
  partial<T extends (...args: any[]) => any>(fn: T, ...presetArgs: any[]): (...args: any[]) => any {
    return (...args: any[]) => fn(...presetArgs, ...args);
  }
  
  memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
  
  debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeout: any;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    }) as T;
  }
  
  throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
  
  once<T extends (...args: any[]) => any>(fn: T): T {
    let called = false;
    let result: any;
    return ((...args: any[]) => {
      if (!called) {
        called = true;
        result = fn(...args);
      }
      return result;
    }) as T;
  }
  
  negate<T extends (...args: any[]) => boolean>(fn: T): T {
    return ((...args: any[]) => !fn(...args)) as T;
  }
  
  tap<T>(value: T, fn: (value: T) => void): T {
    fn(value);
    return value;
  }
  
  identity<T>(value: T): T {
    return value;
  }
  
  always<T>(value: T): () => T {
    return () => value;
  }
}

export const functional = new Functional();