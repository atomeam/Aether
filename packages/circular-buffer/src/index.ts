/**
 * @aether/circular-buffer - Circular Buffer
 */

export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  write(item: T): boolean {
    if (this.isFull()) return false;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }
  
  read(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }
  
  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.buffer[this.head];
  }
  
  isEmpty(): boolean {
    return this.count === 0;
  }
  
  isFull(): boolean {
    return this.count === this.capacity;
  }
  
  size(): number {
    return this.count;
  }
  
  clear(): void {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
}

export function createCircularBuffer<T>(capacity: number): CircularBuffer<T> {
  return new CircularBuffer<T>(capacity);
}