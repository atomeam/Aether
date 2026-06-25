/**
 * @aether/queue - Message Queue
 */

export class Queue {
  private items: any[] = [];
  
  enqueue(item: any): void {
    this.items.push(item);
  }
  
  dequeue(): any {
    return this.items.shift();
  }
  
  size(): number {
    return this.items.length;
  }
}

export const queue = new Queue();