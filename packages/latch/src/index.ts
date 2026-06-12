/**
 * @aether/latch - Latch
 */

export class Latch {
  private completed = false;
  private callbacks: Array<() => void> = [];
  
  async wait(): Promise<void> {
    if (this.completed) return;
    
    return new Promise(resolve => {
      this.callbacks.push(resolve);
    });
  }
  
  complete(): void {
    this.completed = true;
    this.callbacks.forEach(cb => cb());
    this.callbacks = [];
  }
}

export const latch = new Latch();