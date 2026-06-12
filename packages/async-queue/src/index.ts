/**
 * @aether/async-queue - Async Queue
 */

export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;
  
  async add(task: () => Promise<any>): Promise<void> {
    this.queue.push(task);
    if (!this.running) {
      this.running = true;
      await this.process();
    }
  }
  
  private async process(): Promise<void> {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
    }
    this.running = false;
  }
}

export const asyncQueue = new AsyncQueue();