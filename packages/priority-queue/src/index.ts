/**
 * @aether/priority-queue - Priority Queue
 */

export class PriorityQueue<T> {
  private items: { value: T; priority: number }[] = [];
  
  enqueue(value: T, priority: number): void {
    this.items.push({ value, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }
  
  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }
  
  peek(): T | undefined {
    return this.items[0]?.value;
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
}

export function createPriorityQueue<T>(): PriorityQueue<T> {
  return new PriorityQueue<T>();
}