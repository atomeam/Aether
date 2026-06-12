/**
 * @aether/stream-utils - Stream Utilities
 */

export class Stream<T> {
  private items: T[] = [];
  private operations: Array<(items: any[]) => any[] | Promise<any[]>> = [];
  private isAsync = false;
  
  constructor(items: T[] = []) {
    this.items = items;
  }
  
  static from<T>(items: T[]): Stream<T> {
    return new Stream(items);
  }
  
  map<U>(fn: (item: T) => U): Stream<U> {
    const stream = new Stream<U>(this.items.map(fn));
    stream.operations = [...this.operations, (items: T[]) => items.map(fn as any)];
    stream.isAsync = this.isAsync;
    return stream as any;
  }
  
  filter(predicate: (item: T) => boolean): Stream<T> {
    const stream = new Stream(this.items.filter(predicate));
    stream.operations = [...this.operations, items => items.filter(predicate)];
    stream.isAsync = this.isAsync;
    return stream;
  }
  
  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(fn, initial);
  }
  
  take(count: number): Stream<T> {
    const stream = new Stream(this.items.slice(0, count));
    stream.operations = [...this.operations, items => items.slice(0, count)];
    stream.isAsync = this.isAsync;
    return stream;
  }
  
  skip(count: number): Stream<T> {
    const stream = new Stream(this.items.slice(count));
    stream.operations = [...this.operations, items => items.slice(count)];
    stream.isAsync = this.isAsync;
    return stream;
  }
  
  throttle(delay: number): Stream<T> {
    const stream = new Stream<T>([]);
    let lastEmit = 0;
    stream.operations = [
      ...this.operations,
      items => {
        const now = Date.now();
        if (now - lastEmit < delay) return [];
        lastEmit = now;
        return items;
      }
    ];
    stream.isAsync = this.isAsync;
    return stream;
  }
  
  debounce(delay: number): Stream<T> {
    const stream = new Stream<T>([]);
    let timeout: any;
    stream.operations = [
      ...this.operations,
      async (items: T[]) => {
        clearTimeout(timeout);
        return new Promise<any[]>(resolve => {
          timeout = setTimeout(() => resolve(items), delay);
        });
      }
    ];
    stream.isAsync = true;
    return stream as any;
  }
  
  buffer(count: number): Stream<T> {
    const stream = new Stream<T>([]);
    let buffer: T[] = [];
    stream.operations = [
      ...this.operations,
      items => {
        buffer = [...buffer, ...items].slice(-count);
        return [...buffer];
      }
    ];
    stream.isAsync = this.isAsync;
    return stream;
  }
  
  merge(...streams: Stream<T>[]): Stream<T> {
    const allItems = [this.items, ...streams.map(s => s.items)].flat();
    const stream = Stream.from(allItems);
    stream.operations = this.operations;
    stream.isAsync = this.isAsync || streams.some(s => s.isAsync);
    return stream;
  }
  
  concat(...streams: Stream<T>[]): Stream<T> {
    const allItems = [this.items, ...streams.map(s => s.items)].flat();
    const stream = Stream.from(allItems);
    stream.operations = this.operations;
    stream.isAsync = this.isAsync || streams.some(s => s.isAsync);
    return stream;
  }
  
  zip<U>(...streams: Stream<U>[]): Stream<[T, ...U[]]> {
    const maxLength = Math.max(this.items.length, ...streams.map(s => s.items.length));
    const zipped: [T, ...U[]][] = [];
    
    for (let i = 0; i < maxLength; i++) {
      zipped.push([this.items[i], ...streams.map(s => s.items[i])]);
    }
    
    const stream = Stream.from(zipped) as any;
    stream.operations = this.operations;
    stream.isAsync = this.isAsync || streams.some(s => s.isAsync);
    return stream;
  }
  
  toArray(): T[] {
    let result = this.items;
    for (const op of this.operations) {
      result = op(result) as T[];
    }
    return result;
  }
  
  async toArrayAsync(): Promise<T[]> {
    let result = this.items;
    for (const op of this.operations) {
      result = await op(result);
    }
    return result;
  }
  
  forEach(fn: (item: T) => void): void {
    this.toArray().forEach(fn);
  }
}

export function createStream<T>(items: T[]): Stream<T> {
  return Stream.from(items);
}