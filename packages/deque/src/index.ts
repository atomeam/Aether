/**
 * @aether/deque - Double-Ended Queue
 */

export class Deque<T> {
  private items: T[] = [];
  
  pushFront(item: T): void {
    this.items.unshift(item);
  }
  
  pushBack(item: T): void {
    this.items.push(item);
  }
  
  popFront(): T | undefined {
    return this.items.shift();
  }
  
  popBack(): T | undefined {
    return this.items.pop();
  }
  
  peekFront(): T | undefined {
    return this.items[0];
  }
  
  peekBack(): T | undefined {
    return this.items[this.items.length - 1];
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  size(): number {
    return this.items.length;
  }
  
  clear(): void {
    this.items = [];
  }
  
  toArray(): T[] {
    return [...this.items];
  }
}

export function createDeque<T>(): Deque<T> {
  return new Deque<T>();
}