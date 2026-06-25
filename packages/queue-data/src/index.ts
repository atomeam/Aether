/**
 * @aether/queue-data - Queue Data Structure
 */

export class Queue<T> {
  private items: T[] = [];
  
  enqueue(item: T): void {
    this.items.push(item);
  }
  
  dequeue(): T | undefined {
    return this.items.shift();
  }
  
  peek(): T | undefined {
    return this.items[0];
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

export function createQueue<T>(): Queue<T> {
  return new Queue<T>();
}