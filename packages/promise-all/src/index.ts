/**
 * @aether/promise-all - Promise All
 */

export class PromiseAll {
  static async all<T>(promises: Promise<T>[]): Promise<T[]> {
    return Promise.all(promises);
  }
  
  static async allSettled<T>(promises: Promise<T>[]): Promise<PromiseSettledResult<T>[]> {
    return Promise.allSettled(promises);
  }
  
  static async race<T>(promises: Promise<T>[]): Promise<T> {
    return Promise.race(promises);
  }
  
  static async any<T>(promises: Promise<T>[]): Promise<T> {
    return Promise.any(promises);
  }
}

export const promiseAll = new PromiseAll();