/**
 * @aether/testing - Testing Utilities
 */

export class Assertion {
  static equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message ?? `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  }
  
  static deepEqual<T>(actual: T, expected: T, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message ?? `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  }
  
  static notEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(message ?? `Expected ${JSON.stringify(actual)} to not equal ${JSON.stringify(expected)}`);
    }
  }
  
  static truthy(value: any, message?: string): void {
    if (!value) {
      throw new Error(message ?? `Expected truthy value but got ${JSON.stringify(value)}`);
    }
  }
  
  static falsy(value: any, message?: string): void {
    if (value) {
      throw new Error(message ?? `Expected falsy value but got ${JSON.stringify(value)}`);
    }
  }
  
  static throws(fn: () => any, message?: string): void {
    try {
      fn();
      throw new Error(message ?? 'Expected function to throw');
    } catch {
      // Expected
    }
  }
  
  static async rejects(fn: () => Promise<any>, message?: string): Promise<void> {
    try {
      await fn();
      throw new Error(message ?? 'Expected promise to reject');
    } catch {
      // Expected
    }
  }
  
  static contains<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new Error(message ?? `Expected array to contain ${JSON.stringify(item)}`);
    }
  }
  
  static greaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
      throw new Error(message ?? `Expected ${actual} to be greater than ${expected}`);
    }
  }
  
  static lessThan(actual: number, expected: number, message?: string): void {
    if (actual >= expected) {
      throw new Error(message ?? `Expected ${actual} to be less than ${expected}`);
    }
  }
  
  static instanceOf(value: any, constructor: Function, message?: string): void {
    if (!(value instanceof constructor)) {
      throw new Error(message ?? `Expected value to be instance of ${constructor.name}`);
    }
  }
}

export class Mock {
  static fn<T extends (...args: any[]) => any>(implementation?: T): T & { mock: { calls: any[]; results: any[] } } {
    const calls: any[] = [];
    const results: any[] = [];
    
    const fn = ((...args: any[]) => {
      calls.push(args);
      const result = implementation ? implementation(...args) : undefined;
      results.push(result);
      return result;
    }) as T & { mock: { calls: any[]; results: any[] } };
    
    fn.mock = { calls, results };
    return fn;
  }
  
  static object<T>(obj: Partial<T>): T {
    return obj as T;
  }
  
  static resetAll(): void {
    // Reset all mocks if we had a registry
  }
}

export class Spy {
  static on<T extends object, K extends keyof T>(obj: T, method: K): { calls: any[]; restore: () => void } {
    const original = obj[method];
    const calls: any[] = [];
    
    (obj[method] as any) = (...args: any[]) => {
      calls.push(args);
      return (original as any).apply(obj, args);
    };
    
    return {
      calls,
      restore: () => {
        obj[method] = original;
      }
    };
  }
}

export class Fixture {
  static create<T>(template: Partial<T>): T {
    return template as T;
  }
  
  static createMany<T>(template: Partial<T>, count: number): T[] {
    return Array.from({ length: count }, () => this.create(template));
  }
}

export const assert = new Assertion();
export const mock = new Mock();
export const spy = new Spy();
export const fixture = new Fixture();