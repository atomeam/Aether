/**
 * @aether/async-iterator - Async Iterator
 */

export class AsyncIterator<T> {
  constructor(private items: T[]) {}
  
  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    for (const item of this.items) {
      yield item;
    }
  }
  
  async toArray(): Promise<T[]> {
    const result: T[] = [];
    for await (const item of this) {
      result.push(item);
    }
    return result;
  }
}

export function createAsyncIterator<T>(items: T[]): AsyncIterator<T> {
  return new AsyncIterator(items);
}